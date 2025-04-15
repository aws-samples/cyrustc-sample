module "eks_blueprints_addons" {
  source = "aws-ia/eks-blueprints-addons/aws"
  version = "1.16.3" #ensure to update this to the latest/desired version

  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = module.eks.cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  enable_cert_manager = true
  enable_bottlerocket_update_operator           = true

  bottlerocket_update_operator = {
    name          = "brupop-operator"
    description   = "A Helm chart for BRUPOP"
    chart_version = "1.3.0"
    namespace     = "brupop-bottlerocket-aws"
    set           = [{
      name  = "scheduler_cron_expression"
      value = "* * * * * * *"
    }]
  }

  bottlerocket_shadow = {
    name          = "brupop-crds"
    description   = "A Helm chart for BRUPOP CRDs"
    chart_version = "1.0.0"
  }

  tags = {
    Environment = "master"
  }
}
