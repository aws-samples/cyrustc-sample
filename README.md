# Code Samples by cyrustc@

This repository contains various code samples and examples demonstrating different AWS solutions and architectures.

## Directory Structure

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
