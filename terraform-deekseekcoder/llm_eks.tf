module "llm_eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  providers = {
    aws = aws.llm
  }

  cluster_name                   = var.llm_cluster_name
  cluster_version               = var.llm_cluster_version
  cluster_endpoint_public_access = true

  enable_cluster_creator_admin_permissions = true

  cluster_compute_config = {
    enabled    = true
    node_pools = ["general-purpose"]
  }

  vpc_id     = module.llm_vpc.vpc_id
  subnet_ids = module.llm_vpc.private_subnets

  tags = merge(var.tags, {
    Type = "LLM-Infrastructure"
  })
} 