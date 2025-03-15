# Code Samples by cyrustc@

> These projects are provided for demonstration purposes only. They are not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in your environment.

This repository contains various code samples and examples demonstrating different AWS solutions and architectures.

## Directory Structure

### terraform-deepseek-eks-openwebui

A Terraform project that deploys DeepSeek LLM and OpenWebUI on separate Amazon EKS clusters. Features include:

- Multi-region architecture with dedicated VPCs
- EKS clusters optimized for LLM workloads
- Support for both GPU and AWS Inferentia (inf2) instances
- DeepSeek LLM model deployment with Kubernetes
- OpenWebUI and SearXNG frontend interfaces
- Auto-scaling node groups for compute-intensive workloads
- Complete infrastructure as code using Terraform

### elemental-medialive-schedule-automation

A CDK project that demonstrates how to automate AWS Elemental MediaLive channel scheduling. Features include:

- Automated start/stop of MediaLive channels using EventBridge Scheduler
- DynamoDB for schedule management
- Step Functions for workflow orchestration
- Lambda functions for health checks and validation
- SNS notifications for channel status updates

### cloudfront-s3-cognito

A secure static website hosting solution that implements:

- React + Vite frontend hosted on S3
- CloudFront distribution with custom authentication
- Cognito User Pool integration with OAuth 2.0 flows
- CloudFront Functions and Lambda@Edge for auth handling
- Infrastructure as Code using AWS CDK

## Usage

Each directory contains its own README with specific setup and deployment instructions.
