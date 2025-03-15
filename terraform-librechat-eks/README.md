# terraform-librechat-eks

> **⚠️ WARNING**: This project is provided for demonstration purposes only. It is not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in any production environment.

This project uses Terraform to deploy LibreChat on Amazon EKS (Elastic Kubernetes Service). It provides a complete infrastructure as code solution for running your own self-hosted, open-source chat platform with various AI model integrations.

## Overview

LibreChat (formerly BabyAGI UI) is an open-source chat interface that supports multiple AI providers and models, including:

- OpenAI (ChatGPT, GPT-4)
- Anthropic (Claude)
- Google (Gemini)
- Local models via Ollama
- Custom API endpoints

This Terraform project automates the deployment of LibreChat on Amazon EKS, providing a scalable, resilient, and secure infrastructure.

## Architecture

The solution implements the following architecture:

- **EKS Cluster**:
  - Managed Kubernetes environment for running LibreChat
  - Auto-scaling node groups for optimal resource utilization
  - Proper IAM roles and security configurations

- **Database**:
  - MongoDB for chat history and user data storage
  - Options for AWS DocumentDB or MongoDB Atlas integration

- **Authentication**:
  - Support for various authentication methods
  - Integration with Amazon Cognito (optional)

- **Networking**:
  - VPC with public and private subnets
  - Application Load Balancer for traffic distribution
  - Security groups and network ACLs for access control

- **Monitoring and Logging**:
  - CloudWatch integration for logs and metrics
  - Prometheus and Grafana for Kubernetes monitoring (optional)

## Prerequisites

- Terraform >= 1.3
- AWS CLI configured with appropriate credentials
- kubectl installed for cluster management
- Basic understanding of Kubernetes and EKS

## Project Structure

```
.
├── main.tf                # Provider configurations
├── variables.tf           # Input variables
├── outputs.tf             # Output values
├── vpc.tf                 # VPC and networking resources
├── eks.tf                 # EKS cluster configuration
├── nodegroups.tf          # EKS node groups
├── mongodb.tf             # MongoDB deployment
├── librechat.tf           # LibreChat deployment
├── monitoring.tf          # Monitoring and logging resources
└── terraform.tfvars.example  # Example variable values
```

## Planned Features

- [ ] Automated EKS cluster provisioning
- [ ] MongoDB deployment (self-hosted or managed)
- [ ] LibreChat Kubernetes manifests
- [ ] Ingress controller with TLS support
- [ ] Persistent storage for user data
- [ ] Horizontal Pod Autoscaling
- [ ] Backup and disaster recovery
- [ ] CI/CD integration options

## Getting Started

Instructions for deployment will be provided once the Terraform code is complete.

## Contributing

Contributions to improve the project are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## References

- [LibreChat GitHub Repository](https://github.com/danny-avila/LibreChat)
- [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)