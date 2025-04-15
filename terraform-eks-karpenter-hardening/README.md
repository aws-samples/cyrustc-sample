# Terraform EKS Karpenter Hardening

> These projects are provided for demonstration purposes only. They are not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in your environment.

This project demonstrates how to deploy a security-hardened Amazon EKS cluster with Karpenter for auto-scaling, focusing on CIS (Center for Internet Security) benchmark compliance and security best practices.

## Architecture Overview

This Terraform project deploys:

1. An Amazon EKS cluster (v1.30) with security-hardened Bottlerocket nodes
2. Karpenter for intelligent node provisioning and scaling
3. CIS benchmark compliance validation through bootstrap containers
4. Security-focused kernel parameters and system configurations
5. AWS CloudWatch metrics for monitoring

## Key Security Features

### Bottlerocket Hardening

- Kernel lockdown in integrity mode
- Disabled unnecessary kernel modules (udf, sctp)
- Secure network sysctl settings
- CIS benchmark validation

### EKS Security

- EBS volume encryption
- IMDSv2 requirement (token-based metadata service)
- Secure node bootstrapping
- Proper IAM permissions

### Karpenter Security

- Instance selection based on security criteria
- Nitro-based instances only
- Modern CPU generations
- Secure node provisioning

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform v1.3+
- kubectl installed
- Docker installed (for building the CIS bootstrap container)

## Usage

1. Update the administrator IAM role ARNs in `eks.tf`

2. Build and push the CIS bootstrap container:

   ```bash
   cd cis-bootstrap-image
   docker build -t cis-bootstrap:latest .
   ```

3. Create an ECR repository and push the image:

   ```bash
   aws ecr create-repository --repository-name cis-bootstrap
   aws ecr get-login-password | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com
   docker tag cis-bootstrap:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/cis-bootstrap:latest
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/cis-bootstrap:latest
   ```

4. Initialize Terraform:

   ```bash
   terraform init
   ```

5. Apply the configuration:

   ```bash
   terraform plan
   terraform apply
   ```

6. Configure kubectl:
   ```bash
   aws eks --region ap-southeast-1 update-kubeconfig --name ex-tf-karpenter
   ```

## CIS Benchmark Validation

The project includes tools to validate CIS benchmark compliance:

### Bottlerocket CIS Benchmark

```bash
# Connect to a node
apiclient report cis-k8s -l 2
```

### Check Bootstrap Container Logs

```bash
enter-admin-container
sudo sheltie
journalctl -u bootstrap-containers@cis-bootstrap.service
```

### Run kube-bench

```bash
kubectl apply -f bench.yaml
kubectl logs job/kube-bench
```

## Components

### EKS Cluster

- Uses Bottlerocket as the node OS
- Configures managed node groups with security hardening
- Implements CIS benchmark recommendations

### Karpenter

- Provides intelligent, security-focused node provisioning
- Configured with specific instance requirements
- Uses EC2NodeClass with security hardening

### CIS Bootstrap Container

- Custom container that validates and enforces CIS benchmark settings
- Runs as a bootstrap container on all nodes
- Provides validation reporting

### CloudWatch Metrics

- Enables AWS CloudWatch metrics for monitoring
- Helps track security-related events and metrics

## Security Considerations

- **Kernel Hardening**: Implements kernel lockdown and secure sysctl settings
- **Network Security**: Disables IP forwarding and redirects
- **Metadata Service**: Requires IMDSv2 tokens
- **Storage Security**: Encrypts EBS volumes
- **Access Control**: Uses proper IAM roles and permissions

## Customization

### Modifying Security Settings

Security settings can be customized in:

- `eks.tf` - Node bootstrap arguments
- `cis-bootstrap-image/bootstrap-script.sh` - CIS hardening script

## References

- [Validating Amazon EKS Optimized Bottlerocket AMI Against the CIS Benchmark](https://aws.amazon.com/blogs/containers/validating-amazon-eks-optimized-bottlerocket-ami-against-the-cis-benchmark/)
- [Kube-bench with Security Hub](https://catalog.us-east-1.prod.workshops.aws/workshops/165b0729-2791-4452-8920-53b734419050/en-US/10-regulatory-compliance/1-kube-bench)
- [Kubernetes CIS Hardening Policies](https://github.com/raspbernetes/k8s-security-policies/blob/main/policies/)

## License

This project is licensed under the terms specified in the repository's license file.
