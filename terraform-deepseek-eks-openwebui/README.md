# terraform-deepseek-eks-openwebui

> **⚠️ WARNING**: This project is provided for demonstration purposes only. It is not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in any production environment.

This project deploys DeepSeek LLM and OpenWebUI on separate Amazon EKS clusters using Terraform. The infrastructure is provisioned across multiple AWS regions for optimal performance and cost efficiency.

## Architecture Overview

The solution implements a distributed architecture with two main components:

- **LLM Infrastructure**:

  - EKS cluster optimized for running DeepSeek LLM models
  - Dedicated VPC in us-west-2 region
  - Auto-scaling node groups for compute-intensive workloads
  - Support for both GPU instances and AWS Inferentia (inf2) instances

- **Frontend Infrastructure**:
  - EKS cluster for hosting OpenWebUI and SearXNG
  - Dedicated VPC in ap-east-1 region
  - Auto-scaling node groups for web serving
  - Configured to communicate with the LLM API

### Network Architecture

- Each component runs in its own VPC with:
  - Public and private subnets across 3 AZs
  - NAT Gateways for outbound connectivity
  - VPC Flow Logs for security monitoring
  - Proper tagging for Kubernetes cloud integration

## Prerequisites

- Terraform >= 1.3
- AWS CLI configured with appropriate credentials
- kubectl installed for cluster management
- Access to AWS regions: us-west-2 and ap-east-1

## Project Structure

```
.
├── main.tf                # Provider configurations
├── variables.tf           # Input variables
├── outputs.tf             # Output values
├── terraform.tfvars       # Variable values
├── llm_vpc.tf             # LLM VPC configuration
├── ui_vpc.tf              # Frontend VPC configuration
├── llm_eks.tf             # LLM EKS cluster
├── ui_eks.tf              # Frontend EKS cluster
├── llm_nodepool.tf        # LLM node pool configuration
├── ui_nodepool.tf         # UI node pool configuration
├── llm_model.tf           # DeepSeek LLM deployment
├── ui_openwebui.tf        # OpenWebUI deployment
├── ui_searxng.tf          # SearXNG deployment
├── llm_eks_admin.tf       # LLM EKS admin configuration
├── ui_eks_admin.tf        # UI EKS admin configuration
└── llm_ecr.tf             # ECR repository configuration
```

## Getting Started

### Initialize Terraform

```bash
terraform init
```

### Configure Variables

Review and modify the `terraform.tfvars` file to customize your deployment:

```hcl
# Example configuration
llm_vpc_region = "us-west-2"
frontend_vpc_region = "ap-east-1"
llm_model = "deepseek-ai/DeepSeek-R1-Distill-Llama-8B"
is_neuron = false  # Set to true for AWS Inferentia instances
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
- ALB DNS names for accessing the services

### Configure kubectl

```bash
# For LLM cluster
aws eks update-kubeconfig --region us-west-2 --name llm-eks-cluster

# For Frontend cluster
aws eks update-kubeconfig --region ap-east-1 --name frontend-eks-cluster
```

### Accessing the Services

- **OpenWebUI**: Access through the frontend ALB DNS name
- **DeepSeek LLM API**: Access through the LLM ALB DNS name
- **SearXNG**: Access through the SearXNG service endpoint

## Known Limitations and TODOs

### OpenWebUI Scaling Limitation

**Issue**: OpenWebUI currently cannot be scaled to more than 1 replica because the config endpoint will result in 500 errors when multiple pods are running.

**Status**: To be investigated.

**Workaround**: Keep the replica count at 1 in the OpenWebUI deployment configuration. If you need higher availability, consider using pod disruption budgets and robust health checks instead of increasing replicas.

```terraform
spec = {
  replicas = 1  # Do not increase this value until the scaling issue is resolved
  ...
}
```

### Model Selection

The project currently supports DeepSeek models, with the default being `deepseek-ai/DeepSeek-R1-Distill-Llama-8B`. You can change the model by modifying the `llm_model` variable in your `terraform.tfvars` file.

### Infrastructure Costs

Be aware that running GPU or Inferentia instances for LLM workloads can incur significant AWS costs. Consider using spot instances for development environments or implementing auto-scaling based on usage patterns to optimize costs.

## Contributing

Contributions to improve the project are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
