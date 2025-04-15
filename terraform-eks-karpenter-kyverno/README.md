# Terraform EKS Karpenter Kyverno

> These projects are provided for demonstration purposes only. They are not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in your environment.

This project demonstrates how to deploy an Amazon EKS cluster with Karpenter for auto-scaling and Kyverno for policy enforcement, creating a secure and compliant Kubernetes environment.

## Architecture Overview

This Terraform project deploys:

1. An Amazon EKS cluster (v1.30) with security-hardened Bottlerocket nodes
2. Karpenter for intelligent node provisioning and scaling
3. Kyverno for policy enforcement and security compliance
4. Multiple node pools with different security configurations
5. Sample applications demonstrating policy enforcement

## Key Components

### EKS Cluster
- Uses Bottlerocket as the node OS (security-focused container OS)
- Configures managed node groups with security hardening
- Implements secure kernel parameters and system configurations

### Karpenter
- Provides intelligent, security-focused node provisioning
- Configures multiple node pools with different characteristics
- Uses EC2NodeClass with security hardening
- Implements consolidation for cost optimization

### Kyverno
- Enforces Pod Security Standards (PSS) at the "restricted" level
- Implements custom policies for deployment standards
- Validates security contexts, labels, and topology spread constraints
- Provides real-time policy enforcement with detailed validation messages

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

## Kyverno Policies

This project implements several Kyverno policies for demonstration purposes only. These policies should be used as references to create your own validation scripts tailored to your specific security requirements.

### Pod Security Standards
- Enforces the "restricted" Pod Security Standard
- Validation action is set to "enforce" (blocks non-compliant resources)

### Custom Policies
1. **Require Deployment Standards**:
   - Enforces required labels (`app` and `team`)
   - Requires topology spread constraints for zone distribution
   - Mandates security context with `runAsNonRoot: true`

## Working with Kyverno

### Viewing Policy Violations

When a resource violates a policy, Kyverno will block its creation with detailed error messages:

```
Error: default/nginx-nodeclass2 failed to run apply: error when creating "/tmp/81546957kubectl_manifest.yaml": admission webhook "validate.kyverno.svc-fail" denied the request: 

resource Deployment/default/nginx-nodeclass2 was blocked due to the following policies 

disallow-capabilities-strict:
  autogen-require-drop-all: 'validation failure: Containers must drop `ALL` capabilities.'
disallow-privilege-escalation:
  autogen-privilege-escalation: 'validation error: Privilege escalation is disallowed.
    The fields spec.containers[*].securityContext.allowPrivilegeEscalation, spec.initContainers[*].securityContext.allowPrivilegeEscalation,
    and spec.ephemeralContainers[*].securityContext.allowPrivilegeEscalation must
    be set to `false`. rule autogen-privilege-escalation failed at path /spec/template/spec/containers/0/securityContext/'
```

## Customization

### Modifying Kyverno Policies
Kyverno policies can be customized in the `kyverno-policies.yaml` file:
- Adjust the Pod Security Standard level (restricted, baseline, privileged)
- Modify the validation failure action (enforce, audit)
- Add or modify custom policies

### Adding Additional Node Pools
Additional node pools can be added by creating new EC2NodeClass and NodePool resources in `eks_karpenter_nodes.tf`.

## License

This project is licensed under the terms specified in the repository's license file.
