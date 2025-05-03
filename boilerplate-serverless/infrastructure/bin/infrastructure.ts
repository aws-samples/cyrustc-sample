#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MainFrontendStack } from "../lib/frontend-stack";
import { MainBackendStack } from "../lib/backend-stack";

const app = new cdk.App();

// Define the regions
const backendRegion = "us-west-2";
const frontendRegion = "us-east-1";

const backendStack = new MainBackendStack(app, "BackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: backendRegion,
  },
  temporaryCloudFrontDomain: "temporary.cloudfront.net", // Will be updated later
  description: "Backend infrastructure stack containing security resources"
});

const frontendStack = new MainFrontendStack(app, "FrontendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: frontendRegion,
  },
  userPoolId: backendStack.userPoolId,
  clientId: backendStack.clientId,
  clientSecret: backendStack.clientSecret,
  cognitoDomain: backendStack.cognitoDomain,
  cognitoRegion: backendRegion,
  description: "Frontend infrastructure stack containing CloudFront distribution",
  crossRegionReferences: true, // Enable cross-region references
});

// Add dependency to ensure backend stack is deployed before frontend stack
frontendStack.addDependency(backendStack);
