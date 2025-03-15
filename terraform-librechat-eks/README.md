# terraform-librechat-eks

> **⚠️ WARNING**: This project is provided for demonstration purposes only. It is not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in any production environment.

This project uses Terraform to deploy LibreChat on Amazon EKS (Elastic Kubernetes Service). It provides a complete infrastructure as code solution for running your own self-hosted, open-source chat platform with AWS services.

## Overview

LibreChat (formerly BabyAGI UI) is an open-source chat interface that supports multiple AI model integrations. This Terraform project automates the deployment of LibreChat on Amazon EKS, providing a scalable, resilient, and secure infrastructure.

## Architecture

The solution implements the following architecture:

- **EKS Cluster**:
  - Managed Kubernetes environment in Auto Mode for running LibreChat
  - Auto-scaling node groups for optimal resource utilization
  - Proper IAM roles and security configurations

- **Database**:
  - AWS DocumentDB for chat history and user data storage
  - Configured with appropriate security and backup policies

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
├── documentdb.tf          # AWS DocumentDB configuration
├── librechat.tf           # LibreChat deployment
└── terraform.tfvars.example  # Example variable values
```

## Planned Features

- [ ] Automated EKS cluster provisioning in Auto Mode
- [ ] AWS DocumentDB deployment
- [ ] LibreChat Kubernetes manifests
- [ ] Ingress controller with TLS support
- [ ] Persistent storage for user data
- [ ] Horizontal Pod Autoscaling

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
- [AWS DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/latest/developerguide/what-is.html)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)