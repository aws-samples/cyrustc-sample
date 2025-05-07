#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastructure-stack";

const app = new cdk.App();
new InfrastructureStack(app, "DigDocStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-west-2",
  },
  description: "Document Analysis Service Infrastructure",
});
