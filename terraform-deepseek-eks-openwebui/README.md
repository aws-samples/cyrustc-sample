# DeepSeek on EKS with OpenWebUI

This project demonstrates how to deploy DeepSeek LLM and OpenWebUI on separate Amazon EKS clusters. It uses Terraform to provision the infrastructure across multiple AWS regions for optimal performance and cost efficiency.

## Architecture Overview

The solution implements the following architecture:

- **LLM Infrastructure**: 
  - EKS cluster optimized for running DeepSeek LLM
  - Dedicated VPC in us-west-2 region
  - Auto-scaling node groups for compute-intensive workloads

- **Frontend Infrastructure**:
  - EKS cluster for hosting OpenWebUI
  - Dedicated VPC in ap-east-1 region
  - Auto-scaling node groups for web serving

### Network Architecture

- Each component runs in its own VPC with:
  - Public and private subnets across 3 AZs
  - NAT Gateways for outbound connectivity
  - VPC Flow Logs for security monitoring
  - Proper tagging for Kubernetes cloud integration

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- kubectl installed for cluster management
- Access to AWS regions: us-west-2 and ap-east-1

## Project Structure

```
.
├── main.tf                # Provider configurations
├── variables.tf           # Input variables
├── outputs.tf            # Output values
├── llm_vpc.tf           # LLM VPC configuration
├── ui_vpc.tf            # Frontend VPC configuration
├── llm_eks.tf           # LLM EKS cluster
└── ui_eks.tf            # Frontend EKS cluster
```

## Getting Started

### Initialize Terraform

```bash
terraform init
```

### Deploy Infrastructure

```bash
terraform plan
terraform apply
```

After deployment, Terraform will output:
- VPC IDs and CIDR ranges
- EKS cluster endpoints
- Security group IDs
- NAT Gateway IPs

### Configure kubectl

```bash
# For LLM cluster
aws eks update-kubeconfig --region us-west-2 --name llm-eks-cluster

# For Frontend cluster
aws eks update-kubeconfig --region ap-east-1 --name frontend-eks-cluster
```