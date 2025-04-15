# Static Site with Cognito Authentication

This project demonstrates how to create a secure static website hosted on AWS S3, protected by CloudFront and Cognito authentication. It uses AWS CDK for infrastructure and React + Vite for the frontend.

> **Note:** This solution is a pivot of the existing [`aws-samples/cloudfront-authorization-at-edge`](https://github.com/aws-samples/cloudfront-authorization-at-edge) repository. While the original solution leverages AWS Lambda@Edge for each page request (which introduces higher latency and lambda quota consumption), this solution instead uses CloudFront Functions for validation (add no more than 10ms). The token exchange process still uses AWS Lambda@Edge due to CloudFront Function execution duration limitations.

## Architecture Overview

The solution implements the following architecture:

- **Frontend**: React + TypeScript + Vite application hosted in S3
- **Content Delivery**: CloudFront distribution with custom authentication
- **Authentication**: Amazon Cognito User Pool with OAuth 2.0 flows
- **Security**: CloudFront Functions and Lambda@Edge for auth handling

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│     User      │────▶│   CloudFront  │────▶│  S3 Bucket    │
│    Browser    │     │ Distribution  │     │  (Frontend)   │
│               │◀────│               │◀────│               │
└───────┬───────┘     └───────┬───────┘     └───────────────┘
        │                     │
        │                     │ Auth Check
        │                     ▼
        │             ┌───────────────┐     ┌───────────────┐
        │             │  CloudFront   │     │  Lambda@Edge  │
        └────────────▶│   Function    │────▶│  (Token       │
          Auth        │               │     │   Exchange)   │
          Redirect    └───────┬───────┘     └───────┬───────┘
                              │                     │
                              ▼                     │
                      ┌───────────────┐             │
                      │   Cognito     │◀────────────┘
                      │  User Pool    │
                      │               │
                      └───────────────┘
```

### Authentication Flow

1. User visits the CloudFront URL
2. CloudFront Function checks for authentication
3. If not authenticated, redirects to Cognito hosted UI
4. After successful login, Cognito redirects to `/cf-auth`
5. Lambda@Edge function exchanges the auth code for tokens
6. User is redirected to the main application with secure cookies

```
┌─────────┐           ┌────────────┐          ┌─────────┐          ┌─────────┐
│         │  1. Visit │            │          │         │          │         │
│  User   │──────────▶│ CloudFront │─────────▶│   S3    │          │ Cognito │
│ Browser │           │            │  If Auth │ Content │          │User Pool│
│         │◀───────── │            │◀─────────│         │          │         │
└────┬────┘  6. View  └──────┬─────┘          └─────────┘          └────┬────┘
     │       Content         │                                          │
     │                       │ 2. Check Auth                            │
     │                       ▼                                          │
     │               ┌───────────────┐                                  │
     │               │  CloudFront   │                                  │
     │               │   Function    │                                  │
     │               └───────┬───────┘                                  │
     │                       │ 3. Redirect if                           │
     │                       │    not auth                              │
     │                       ▼                                          │
     │              ┌────────────────┐                                  │
     │ 4. Login     │    Cognito     │                                  │
     └─────────────▶│   Hosted UI    │◀─────────────────────────────────┘
                    └────────┬───────┘
                             │
                             │ 5. Redirect with code
                             ▼
                    ┌───────────────┐
                    │  Lambda@Edge  │
                    │ (Token Exch.) │
                    └───────────────┘
```

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
