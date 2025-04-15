terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.10"
    }
    kubectl = {
      source  = "alekc/kubectl"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region  = "ap-southeast-1"
  profile = "personal"
}

locals {
  cluster_name   = "tf-karpenter-updator"
  vpc_cidr       = "10.4.0.0/16"
  azs            = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
  vpc_id         = "vpc-EXAMPLE"
  public_subnet  = ["subnet-EXAMPLE1", "subnet-EXAMPLE2", "subnet-EXAMPLE3"]
  private_subnet = ["subnet-EXAMPLE4", "subnet-EXAMPLE5", "subnet-EXAMPLE6"]
  argocd_domain  = "argocd.example.domain"
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      # This requires the awscli to be installed locally where Terraform is executed
      args = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--no-verify-ssl"]
    }
  }
}

provider "kubectl" {
  apply_retry_count      = 5
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  load_config_file       = false

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    # This requires the awscli to be installed locally where Terraform is executed
    args = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--no-verify-ssl"]
  }
}
