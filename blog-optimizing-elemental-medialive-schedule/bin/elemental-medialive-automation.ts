#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ElementalMedialiveAutomationStack } from '../lib/elemental-medialive-automation-stack';

const app = new cdk.App();

// You can provide the email when deploying via CDK
new ElementalMedialiveAutomationStack(app, 'ElementalMedialiveAutomationStack', {
  // If you want to hardcode an email for development
  // notificationEmail: 'your-email@example.com',
});
