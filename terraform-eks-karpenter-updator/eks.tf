module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = local.cluster_name
  cluster_version = "1.30"

  cluster_endpoint_public_access  = true

  cluster_addons = {
    kube-proxy             = {}
    eks-pod-identity-agent = {}
    vpc-cni                = {}
  }

  vpc_id                   = local.vpc_id
  subnet_ids               = local.public_subnet
  control_plane_subnet_ids = local.public_subnet

  eks_managed_node_groups = {
    example = {
      ami_type       = "BOTTLEROCKET_x86_64"
      platform = "bottlerocket"
      ami_release_version = "1.20.3-5d9ac849"
      instance_types = ["m5.xlarge"]

      min_size     = 2
      max_size     = 2
      desired_size = 2

      labels = {
        "karpenter.sh/controller" = "true"
        "bottlerocket.aws/updater-interface-version": "2.0.0"
      }

      node_security_group_tags = merge({}, {
        "karpenter.sh/discovery" = local.cluster_name
      })

      taints = []
    }
  }

  enable_cluster_creator_admin_permissions = true

  cluster_security_group_additional_rules = {
    ingress_ec2_tcp = {
      description                = "Access EKS from EC2 instance."
      protocol                   = "tcp"
      from_port                  = 443
      to_port                    = 443
      type                       = "ingress"
      cidr_blocks                = ["0.0.0.0/0"]
    }
  }

  tags = {
    Terraform   = "true"
  }
}

module "karpenter_eks" {
  source  = "terraform-aws-modules/eks/aws//modules/karpenter"
  version = "~> 20.11"

  cluster_name = module.eks.cluster_name
  create_pod_identity_association = true

  node_iam_role_additional_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }
}


resource "helm_release" "karpenter" {
  namespace           = "kube-system"
  name                = "karpenter"
  repository          = "oci://public.ecr.aws/karpenter"
  chart               = "karpenter"
  version             = "0.37.0"
  wait                = false

  values = [
    <<-EOT
    serviceAccount:
      name: ${module.karpenter_eks.service_account}
    settings:
      clusterName: ${module.eks.cluster_name}
      clusterEndpoint: ${module.eks.cluster_endpoint}
      interruptionQueue: ${module.karpenter_eks.queue_name}
    EOT
  ]
}

resource "kubectl_manifest" "eks_karpenter_node_class" {
  yaml_body = <<-YAML
    apiVersion: karpenter.k8s.aws/v1beta1
    kind: EC2NodeClass
    metadata:
      name: default
    spec:
      amiFamily: Bottlerocket
      role: ${module.karpenter_eks.node_iam_role_name}
      userData: |
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

      blockDeviceMappings:
        - deviceName: /dev/xvda
          ebs:
            volumeSize: 50Gi
            volumeType: gp3
            encrypted: true
            deleteOnTermination: true
      metadataOptions:
        httpEndpoint: enabled
        httpProtocolIPv6: disabled
        httpPutResponseHopLimit: 1
        httpTokens: required
      subnetSelectorTerms:
        - tags:
            karpenter.sh/discovery: scaling_subnet
      securityGroupSelectorTerms:
        - tags:
            karpenter.sh/discovery: ${module.eks.cluster_name}
      tags:
        karpenter.sh/discovery: ${module.eks.cluster_name}
  YAML

  depends_on = [
    helm_release.karpenter
  ]
}

resource "kubectl_manifest" "eks_karpenter_node_pool" {
  yaml_body = <<-YAML
    apiVersion: karpenter.sh/v1beta1
    kind: NodePool
    metadata:
      name: default
    spec:
      template:
        spec:
          nodeClassRef:
            name: default
          requirements:
            - key: "karpenter.k8s.aws/instance-category"
              operator: In
              values: ["c", "m", "r"]
            - key: "karpenter.k8s.aws/instance-cpu"
              operator: In
              values: ["4", "8", "16", "32"]
            - key: "karpenter.k8s.aws/instance-hypervisor"
              operator: In
              values: ["nitro"]
            - key: "karpenter.k8s.aws/instance-cpu-manufacturer"
              operator: In
              values: ["intel"]
            - key: "karpenter.k8s.aws/instance-generation"
              operator: Gt
              values: ["2"]
            - key: "karpenter.sh/capacity-type"
              operator: In
              values: ["spot","on-demand"]
          tolerations:
            - key: "karpenter.sh/controller"
              operator: "Equal"
              value: "true"
              effect: "NoSchedule"
      limits:
        cpu: 5000
      disruption:
        consolidationPolicy: WhenUnderutilized
  YAML

  depends_on = [
    kubectl_manifest.eks_karpenter_node_class
  ]
}

resource aws_eks_access_entry admin{
  type = "STANDARD"
  cluster_name = module.eks.cluster_name
  principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"
}

resource aws_eks_access_policy_association admin {
  cluster_name = module.eks.cluster_name
  policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"

  access_scope {
    type = "cluster"
  }
  depends_on = [aws_eks_access_entry.admin]
}