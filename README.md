# Code Samples by cyrustc@

> These projects are provided for demonstration purposes only. They are not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in your environment.

This repository contains various code samples and examples demonstrating different AWS solutions and architectures.

## Directory Structure

### aws-sdk-proxy-over-ecs

A CDK project that deploys a Squid proxy on AWS ECS Fargate with a Network Load Balancer for AWS SDK clients. Features include:

- Centralized egress control for AWS API calls
- Cross-region access for AWS services
- Simplified security management
- Enhanced monitoring of API call patterns
- Complete CDK implementation for repeatable deployments

### batch-kms-key-protection

A utility that automatically identifies and protects important AWS KMS keys that have been accidentally scheduled for deletion. Features include:

- Automatic cancellation of deletion for important KMS keys
- Batch processing for hundreds or thousands of keys
- Customizable protection through tagging
- Detailed reporting and logging
- Safety-first approach with dry-run mode

### bedrock-agent-streaming-terminal

An interactive terminal interface for Amazon Bedrock Agents with real-time streaming responses and trace visualization. Features include:

- Real-time trace visualization for agent processing steps
- Performance monitoring with latency tracking
- Multi-agent debugging capabilities
- Detailed logging in JSON format
- Interactive terminal-based chat experience

### cloudfront-s3-cognito

A secure static website hosting solution that implements:

- React + Vite frontend hosted on S3
- CloudFront distribution with custom authentication
- Cognito User Pool integration with OAuth 2.0 flows
- CloudFront Functions and Lambda@Edge for auth handling
- Infrastructure as Code using AWS CDK

### elemental-medialive-schedule-automation

A CDK project that demonstrates how to automate AWS Elemental MediaLive channel scheduling. Features include:

- Automated start/stop of MediaLive channels using EventBridge Scheduler
- DynamoDB for schedule management
- Step Functions for workflow orchestration
- Lambda functions for health checks and validation
- SNS notifications for channel status updates

### jupyter-notebook-bank-statement-extraction

A Jupyter notebook solution for extracting structured transaction data from bank statements using AWS Bedrock and Claude 3.5 Sonnet. Features include:

- PDF processing and high-quality image conversion
- Text extraction from bank statements
- AI-powered data extraction with AWS Bedrock
- Transaction categorization and formatting
- Structured CSV output generation

### quicksight-embedding

A project demonstrating how to embed Amazon QuickSight dashboards in a web application. Features include:

- Interactive dashboard embedding with parameter controls
- Event handling for user interactions
- Secure authentication for embedding URLs
- Responsive design for embedded dashboards
- Node.js Express server implementation

### terraform-deepseek-eks-openwebui

A Terraform project that deploys DeepSeek LLM and OpenWebUI on separate Amazon EKS clusters. Features include:

- Multi-region architecture with dedicated VPCs
- EKS clusters optimized for LLM workloads
- Support for both GPU and AWS Inferentia (inf2) instances
- DeepSeek LLM model deployment with Kubernetes
- OpenWebUI and SearXNG frontend interfaces
- Auto-scaling node groups for compute-intensive workloads
- Complete infrastructure as code using Terraform

### terraform-eks-karpenter-hardening

A Terraform project that demonstrates how to deploy a security-hardened Amazon EKS cluster with Karpenter for auto-scaling, focusing on CIS benchmark compliance. Features include:

- Security-hardened Bottlerocket nodes with CIS benchmark compliance
- Custom CIS bootstrap container for validation and enforcement
- Karpenter for intelligent, security-focused node provisioning
- Security-focused kernel parameters and system configurations
- Tools for validating CIS benchmark compliance

### terraform-eks-karpenter-kyverno

A Terraform project that demonstrates how to deploy an Amazon EKS cluster with Karpenter for auto-scaling and Kyverno for policy enforcement. Features include:

- Security-hardened Bottlerocket nodes
- Karpenter with multiple node pools for different workloads
- Kyverno for Kubernetes policy enforcement
- Pod Security Standards implementation
- Custom policies for deployment standards
- Sample applications demonstrating policy enforcement

### terraform-eks-karpenter-updator

A Terraform project that deploys an Amazon EKS cluster with Karpenter for auto-scaling and the Bottlerocket Update Operator for automated node updates. Features include:

- EKS cluster with Bottlerocket nodes (security-focused container OS)
- Karpenter for intelligent node provisioning and scaling
- Bottlerocket Update Operator (BRUPOP) for automated OS updates
- Security-hardened node configurations
- Complete infrastructure as code using Terraform

## Usage

Each directory contains its own README with specific setup and deployment instructions.

> [!WARNING]
>
> This sample allows you to interact with models from third party providers. Your use of the third-party generative AI (GAI) models is governed by the terms provided to you by the third-party GAI model providers when you acquired your license to use them (for example, their terms of service, license agreement, acceptable use policy, and privacy policy).
>
> You are responsible for ensuring that your use of the third-party GAI models comply with the terms governing them, and any laws, rules, regulations, policies, or standards that apply to you.
>
> You are also responsible for making your own independent assessment of the third-party GAI models that you use, including their outputs and how third-party GAI model providers use any data that might be transmitted to them based on your deployment configuration. AWS does not make any representations, warranties, or guarantees regarding the third-party GAI models, which are “Third-Party Content” under your agreement with AWS. This sample is offered to you as “AWS Content” under your agreement with AWS.

## Shared Responsibility Model

Security and Compliance is a shared responsibility between AWS and the customer. This shared model can help relieve the customer's operational burden as AWS operates, manages and controls the components from the host operating system and virtualization layer down to the physical security of the facilities in which the service operates. The customer assumes responsibility and management of the guest operating system (including updates and security patches), other associated application software as well as the configuration of the AWS provided security group firewall. Customers should carefully consider the services they choose as their responsibilities vary depending on the services used, the integration of those services into their IT environment, and applicable laws and regulations. The nature of this shared responsibility also provides the flexibility and customer control that permits the deployment. As shown in the chart below, this differentiation of responsibility is commonly referred to as Security "of" the Cloud
versus Security "in" the Cloud. For more details, please refer to [AWS Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/).

## Content Security Legal Disclaimer

The sample code; software libraries; command line tools; proofs of concept; templates; or other related technology (including any of the foregoing that are provided by our personnel) is provided to you as AWS Content under the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). You should not use this AWS Content in your production accounts, or on production or other critical data. You are responsible for testing, securing, and optimizing the AWS Content, such as sample code, as appropriate for production grade use based on your specific quality control practices and standards. Deploying AWS Content may incur AWS charges for creating or using AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
