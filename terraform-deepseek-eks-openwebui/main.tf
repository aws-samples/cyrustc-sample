terraform {
  required_version = ">= 1.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.34"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.9"
    }
    kubectl = {
      source  = "alekc/kubectl"
      version = ">= 2.0"
    }
  }
}

# Default provider configuration
provider "aws" {
  region = var.llm_vpc_region

  default_tags {
    tags = var.tags
  }
}

# LLM VPC provider
provider "aws" {
  alias  = "llm"
  region = var.llm_vpc_region

  default_tags {
    tags = var.tags
  }
}

# Frontend VPC provider
provider "aws" {
  alias  = "frontend"
  region = var.frontend_vpc_region

  default_tags {
    tags = var.tags
  }
}

# LLM EKS Helm Provider
provider "helm" {
  alias = "llm"
  kubernetes {
    host                   = module.llm_eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.llm_eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.llm_eks.cluster_name, "--region", var.llm_vpc_region]
    }
  }
}

# Frontend EKS Helm Provider
provider "helm" {
  alias = "frontend"
  kubernetes {
    host                   = module.frontend_eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.frontend_eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.frontend_eks.cluster_name, "--region", var.frontend_vpc_region]
    }
  }
}

# LLM EKS Kubectl Provider
provider "kubectl" {
  alias                  = "llm"
  apply_retry_count      = 5
  host                   = module.llm_eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.llm_eks.cluster_certificate_authority_data)
  load_config_file       = false

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.llm_eks.cluster_name, "--region", var.llm_vpc_region]
  }
}

# Frontend EKS Kubectl Provider
provider "kubectl" {
  alias                  = "frontend"
  apply_retry_count      = 5
  host                   = module.frontend_eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.frontend_eks.cluster_certificate_authority_data)
  load_config_file       = false

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.frontend_eks.cluster_name, "--region", var.frontend_vpc_region]
  }
} 
