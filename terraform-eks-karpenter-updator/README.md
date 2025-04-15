# Terraform EKS Karpenter Updator

> These projects are provided for demonstration purposes only. They are not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in your environment.

This project demonstrates how to set up an Amazon EKS cluster with Karpenter for auto-scaling and the Bottlerocket Update Operator for automated node updates.

## Architecture Overview

This Terraform project deploys:

1. An Amazon EKS cluster (v1.30) with Bottlerocket nodes
2. Karpenter for intelligent node provisioning and scaling
3. Bottlerocket Update Operator (BRUPOP) for automated node OS updates
4. Required IAM roles and policies for proper operation

## Key Components

### EKS Cluster
- Uses Bottlerocket as the node OS (security-focused container OS)
- Configures managed node groups for the control plane
- Sets up proper security groups and IAM permissions

### Karpenter
- Provides intelligent, fast node provisioning
- Configured with specific instance requirements (CPU, instance types, etc.)
- Uses EC2NodeClass for defining node properties
- Implements consolidation for cost optimization

### Bottlerocket Update Operator
- Automates Bottlerocket OS updates
- Ensures nodes are kept up-to-date with security patches
- Configured with a cron schedule for updates

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform v1.0.0+
- kubectl installed
- An existing VPC with public and private subnets

## Usage

1. Update the `locals` block in `main.tf` with your VPC and subnet IDs
2. Update the administrator IAM role ARNs in `eks.tf` (look for `aws_eks_access_entry` and `aws_eks_access_policy_association` resources)
3. Verify the EKS cluster version in `eks.tf` is the version you want to use (currently set to 1.30)
4. Initialize Terraform:
   ```
   terraform init
   ```
5. Review the plan:
   ```
   terraform plan
   ```
6. Apply the configuration:
   ```
   terraform apply
   ```

## Important Configuration Parameters

### Required Updates Before Deployment

1. **VPC and Subnet Configuration** (in `main.tf`):
   ```hcl
   locals {
     vpc_id = "vpc-EXAMPLE"
     public_subnet = ["subnet-EXAMPLE1", "subnet-EXAMPLE2", "subnet-EXAMPLE3"]
     private_subnet = ["subnet-EXAMPLE4", "subnet-EXAMPLE5", "subnet-EXAMPLE6"]
   }
   ```

2. **Administrator IAM Role** (in `eks.tf`):
   ```hcl
   resource aws_eks_access_entry admin {
     type = "STANDARD"
     cluster_name = module.eks.cluster_name
     principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"
   }
   
   resource aws_eks_access_policy_association admin {
     cluster_name = module.eks.cluster_name
     policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
     principal_arn = "arn:aws:iam::ACCOUNT_ID:role/aws-reserved/sso.amazonaws.com/ap-southeast-1/AWSReservedSSO_AdministratorAccess_EXAMPLE"
     # ...
   }
   ```

3. **EKS Version** (in `eks.tf`):
   ```hcl
   module "eks" {
     # ...
     cluster_version = "1.30"  # Update to the desired EKS version
     # ...
   }
   ```

## Karpenter Configuration

The Karpenter configuration includes:

- Node class definition with Bottlerocket OS
- Node pool with specific instance requirements
- Security hardening for Bottlerocket nodes
- Consolidation policy for cost optimization

## Bottlerocket Update Operator

The Bottlerocket Update Operator is configured to:

- Run in its own namespace
- Use a specific cron schedule for updates
- Apply updates to nodes with the appropriate labels

## Security Considerations

- Uses Bottlerocket OS for enhanced security
- Implements secure kernel parameters
- Configures metadata service with IMDSv2 (token required)
- Encrypts EBS volumes
- Restricts network access appropriately

## Maintenance

To update the EKS cluster version:
1. Modify the `cluster_version` parameter in `eks.tf`
2. Run `terraform plan` and `terraform apply`

To update Karpenter:
1. Modify the `version` parameter in the `helm_release` resource
2. Run `terraform plan` and `terraform apply`

## Version Compatibility

Always check the compatibility matrix between:
- EKS version
- Karpenter version
- Bottlerocket AMI version
- AWS provider version

The current configuration uses:
- EKS: v1.30
- Karpenter: v0.37.0
- Bottlerocket AMI: 1.20.3-5d9ac849

## License

This project is licensed under the terms specified in the repository's license file.
