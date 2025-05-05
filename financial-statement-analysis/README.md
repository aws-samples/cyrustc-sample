# AWS Serverless Boilerplate

A serverless application boilerplate using AWS CDK, featuring a React frontend and Python Lambda functions.

## Architecture

This project implements a modern serverless architecture on AWS with:

- **Frontend**: React with TypeScript and Vite
- **Authentication**: Amazon Cognito with CloudFront Lambda@Edge protection
- **API**: Amazon API Gateway with AWS Lambda (Python)
- **Database**: Amazon DynamoDB with single-table design
- **Infrastructure**: AWS CDK for infrastructure as code

## Project Structure

```
├── frontend/               # React TypeScript application
│   ├── src/                # Application source code
│   ├── public/             # Static assets
│   ├── index.html          # HTML entry point
│   └── vite.config.ts      # Vite configuration
│
└── infrastructure/         # AWS CDK Infrastructure code
    ├── bin/                # CDK app entry point
    └── lib/                # Infrastructure code
        ├── stacks/         # CDK nested stacks
        ├── api/            # API Gateway and Lambda functions
        ├── dynamodb/       # DynamoDB table definitions
        ├── frontend/       # Frontend hosting infrastructure
        └── security/       # Authentication and security resources
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- AWS CLI configured
- AWS CDK installed
- Python 3.9+

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Infrastructure Development

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
npm install

# Compile TypeScript code
npm run build

# Deploy to AWS
npx cdk bootstrap    # First time only
npx cdk deploy
```

## Key Features

- **Authentication Flow**: Secured by Amazon Cognito with CloudFront integration
- **API Design**: RESTful API with proper resource naming and HTTP methods
- **Database**: DynamoDB with single-table design patterns
- **Frontend Hosting**: S3 + CloudFront with proper cache settings
- **Security**: CloudFront functions to validate authentication

## Deployment

The infrastructure includes all necessary components for secure deployment:
- The frontend is automatically deployed to S3 and distributed via CloudFront
- API Gateway endpoints are configured and protected
- Cognito callback URLs are automatically updated during deployment 