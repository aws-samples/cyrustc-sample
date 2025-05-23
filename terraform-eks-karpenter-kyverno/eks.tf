################################################################################
# Cluster
################################################################################


resource "aws_eks_access_entry" "admin" {
  type          = "STANDARD"
  cluster_name  = module.eks.cluster_name
  principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"
}

resource "aws_eks_access_policy_association" "admin" {
  cluster_name  = module.eks.cluster_name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"

  access_scope {
    type = "cluster"
  }
  depends_on = [aws_eks_access_entry.admin]
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.11"

  cluster_name    = local.name
  cluster_version = "1.30"

  enable_cluster_creator_admin_permissions = true
  cluster_endpoint_public_access           = true

  cluster_addons = {
    coredns = {
      configuration_values = jsonencode({
        tolerations = [
          {
            key    = "karpenter.sh/controller"
            value  = "true"
            effect = "NoSchedule"
          }
        ]
      })
    }
    eks-pod-identity-agent = {}
    kube-proxy             = {}
    vpc-cni                = {}
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    karpenter = {
      ami_type       = "BOTTLEROCKET_x86_64"
      instance_types = ["m5.large"]

      min_size     = 2
      max_size     = 2
      desired_size = 2

      bootstrap_extra_args = <<-EOT
          [settings.kernel]
          lockdown = "integrity"

          [settings.kernel.modules]
          udf = { allowed = false }
          sctp = { allowed = false }

          [settings.kernel.sysctl]
          "net.ipv4.conf.all.send_redirects" = "0"
          "net.ipv4.conf.default.send_redirects" = "0"
          "net.ipv4.conf.all.accept_redirects" = "0"
          "net.ipv4.conf.default.accept_redirects" = "0"
          "net.ipv6.conf.all.accept_redirects" = "0"
          "net.ipv6.conf.default.accept_redirects" = "0"
          "net.ipv4.conf.all.secure_redirects" = "0"
          "net.ipv4.conf.default.secure_redirects" = "0"
          "net.ipv4.conf.all.log_martians" = "1"
          "net.ipv4.conf.default.log_martians" = "1"

          [settings.bootstrap-containers.cis-bootstrap]
          source = "${aws_ecr_repository.cis_bootstrap.repository_url}:latest"
          mode = "always"
        EOT

      labels = {
        "karpenter.sh/controller" = "true"
      }
    }
  }

  node_security_group_tags = merge(local.tags, {
    "karpenter.sh/discovery" = local.name
  })

  tags = local.tags
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${local.region} update-kubeconfig --name ${module.eks.cluster_name}"
}

################################################################################
# Controller & Node IAM roles, SQS Queue, Eventbridge Rules
################################################################################

module "karpenter" {
  source  = "terraform-aws-modules/eks/aws//modules/karpenter"
  version = "~> 20.11"

  cluster_name                    = module.eks.cluster_name
  create_pod_identity_association = true

  node_iam_role_additional_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }

  tags = local.tags
}

################################################################################
# Helm charts
################################################################################

resource "helm_release" "karpenter" {
  namespace  = "kube-system"
  name       = "karpenter"
  repository = "oci://public.ecr.aws/karpenter"
  #   repository_username = data.aws_ecrpublic_authorization_token.token.user_name
  #   repository_password = data.aws_ecrpublic_authorization_token.token.password
  chart   = "karpenter"
  version = "0.37.0"
  wait    = false

  values = [
    <<-EOT
    serviceAccount:
      name: ${module.karpenter.service_account}
    settings:
      clusterName: ${module.eks.cluster_name}
      clusterEndpoint: ${module.eks.cluster_endpoint}
      interruptionQueue: ${module.karpenter.queue_name}
    EOT
  ]
}
