module "frontend_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  providers = {
    aws = aws.frontend
  }

  name = var.frontend_vpc_name
  cidr = var.frontend_vpc_cidr

  azs             = var.frontend_vpc_azs
  private_subnets = [for i, az in var.frontend_vpc_azs : cidrsubnet(var.frontend_vpc_cidr, 4, i)]
  public_subnets  = [for i, az in var.frontend_vpc_azs : cidrsubnet(var.frontend_vpc_cidr, 4, i + 3)]

  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true

  tags = merge(var.tags, {
    Type = "Frontend-Infrastructure"
  })

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
    "kubernetes.io/cluster/${var.frontend_vpc_name}-cluster" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/${var.frontend_vpc_name}-cluster" = "shared"
  }
} 