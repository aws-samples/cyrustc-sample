# Static Site with Cognito Authentication

This project demonstrates how to create a secure static website hosted on AWS S3, protected by CloudFront and Cognito authentication. It uses AWS CDK for infrastructure and React + Vite for the frontend.

## Architecture Overview

The solution implements the following architecture:

- **Frontend**: React + TypeScript + Vite application hosted in S3
- **Content Delivery**: CloudFront distribution with custom authentication
- **Authentication**: Amazon Cognito User Pool with OAuth 2.0 flows
- **Security**: CloudFront Functions and Lambda@Edge for auth handling

### Authentication Flow

1. User visits the CloudFront URL
2. CloudFront Function checks for authentication
3. If not authenticated, redirects to Cognito hosted UI
4. After successful login, Cognito redirects to `/cf-auth`
5. Lambda@Edge function exchanges the auth code for tokens
6. User is redirected to the main application with secure cookies

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Project Structure

```
.
├── frontend/               # React + Vite frontend application
│   ├── src/               # Application source code
│   └── dist/              # Built frontend assets
└── infrastructure/        # AWS CDK infrastructure code
    ├── bin/              # CDK app entry point
    ├── lib/              # CDK constructs and stacks
    │   ├── frontend/     # Frontend hosting constructs
    │   ├── security/     # Cognito and auth constructs
    │   └── stacks/       # Main CDK stacks
    └── test/             # Infrastructure tests
```

## Getting Started

### Build Frontend

```bash
cd frontend
npm install
npm run build
```

### Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk deploy --all --require-approval never
```

After deployment, the CDK will output:
- CloudFront Distribution URL
- Cognito User Pool ID
- Cognito Client ID
- Cognito Domain

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

### Infrastructure Development

```bash
cd infrastructure
npm run watch  # Watch for TypeScript changes
```

## Security Features

- Cognito User Pool with secure password policies
- OAuth 2.0 authorization code flow
- Secure cookie handling
- HTTPS-only access
- S3 bucket with blocked public access
- CloudFront Functions for auth verification
- Lambda@Edge for token exchange
