# LLM VPC Outputs
output "llm_vpc_id" {
  description = "The ID of the LLM VPC"
  value       = module.llm_vpc.vpc_id
}

output "llm_private_subnets" {
  description = "List of IDs of LLM private subnets"
  value       = module.llm_vpc.private_subnets
}

output "llm_public_subnets" {
  description = "List of IDs of LLM public subnets"
  value       = module.llm_vpc.public_subnets
}

output "llm_nat_public_ips" {
  description = "List of public Elastic IPs created for LLM VPC NAT Gateway"
  value       = module.llm_vpc.nat_public_ips
}

output "llm_azs" {
  description = "List of AZs used in LLM VPC"
  value       = module.llm_vpc.azs
}

# LLM EKS Outputs
output "llm_cluster_endpoint" {
  description = "Endpoint for LLM EKS control plane"
  value       = module.llm_eks.cluster_endpoint
}

output "llm_cluster_security_group_id" {
  description = "Security group ID attached to the LLM EKS control plane"
  value       = module.llm_eks.cluster_security_group_id
}

output "llm_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the LLM cluster"
  value       = module.llm_eks.cluster_certificate_authority_data
}

# Additional VPC Information
output "llm_vpc_cidr_block" {
  description = "The CIDR block of the LLM VPC"
  value       = module.llm_vpc.vpc_cidr_block
}

output "llm_vpc_flow_log_id" {
  description = "The ID of the Flow Log for LLM VPC"
  value       = module.llm_vpc.vpc_flow_log_id
}
