# LLM VPC Variables
variable "llm_vpc_name" {
  description = "Name of the VPC for LLM EKS cluster"
  type        = string
  default     = "llm-vpc"
}

variable "llm_vpc_cidr" {
  description = "CIDR block for LLM VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "llm_vpc_region" {
  description = "AWS region for LLM VPC deployment"
  type        = string
  default     = "us-west-2"
}

variable "llm_vpc_azs" {
  description = "Availability zones for LLM VPC"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# LLM EKS Variables
variable "llm_cluster_version" {
  description = "Kubernetes version for LLM EKS cluster"
  type        = string
  default     = "1.31"
}

variable "llm_cluster_name" {
  description = "Name of the LLM EKS cluster"
  type        = string
  default     = "llm-eks-cluster"
}

variable "is_neuron" {
  description = "Whether to use AWS Inferentia (inf2) instances for LLM workloads. If false, will use GPU instances."
  type        = bool
  default     = false
}

variable "llm_model_name" {
  description = "LLM model to be deployed"
  type        = string
  default     = "TheBloke/deepseek-coder-6.7b-instruct-GPTQ"
}

# EKS Admin Access Variables
variable "enable_additional_admin" {
  description = "Whether to provision additional EKS admin access"
  type        = bool
  default     = false
}

variable "admin_principal_arn" {
  description = "ARN of the principal (role/user) to be granted EKS admin access"
  type        = string
  default     = null
}

# Common tags for all resources
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "deepseekcoder-eks"
    Terraform   = "true"
  }
}
