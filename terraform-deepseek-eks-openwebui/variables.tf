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

variable "llm_model" {
  description = "LLM model to be deployed (e.g., deepseek-ai/DeepSeek-R1-Distill-Llama-8B)"
  type        = string
  default     = "deepseek-ai/DeepSeek-R1-Distill-Llama-8B"
}

# Frontend VPC Variables
variable "frontend_vpc_name" {
  description = "Name of the VPC for Frontend EKS cluster"
  type        = string
  default     = "frontend-vpc"
}

variable "frontend_vpc_cidr" {
  description = "CIDR block for Frontend VPC"
  type        = string
  default     = "172.16.0.0/16"
}

variable "frontend_vpc_region" {
  description = "AWS region for Frontend VPC deployment"
  type        = string
  default     = "ap-east-1"
}

variable "frontend_vpc_azs" {
  description = "Availability zones for Frontend VPC"
  type        = list(string)
  default     = ["ap-east-1a", "ap-east-1b", "ap-east-1c"]
}

# Frontend EKS Variables
variable "frontend_cluster_version" {
  description = "Kubernetes version for Frontend EKS cluster"
  type        = string
  default     = "1.31"
}

variable "frontend_cluster_name" {
  description = "Name of the Frontend EKS cluster"
  type        = string
  default     = "frontend-eks-cluster"
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
    Project     = "deepseek-eks-openwebui"
    Terraform   = "true"
  }
}

# LLM ALB DNS Name
variable "llm_alb_dns_name" {
  description = "DNS name of the LLM ALB ingress (needed for OpenWebUI to connect to LLM API)"
  type        = string
  default     = ""
}
