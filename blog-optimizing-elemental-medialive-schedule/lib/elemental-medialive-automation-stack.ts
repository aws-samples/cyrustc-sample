import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MediaRecordWorkflow } from './constructs/media-record-workflow';
import { MediaSchedulerTable } from './constructs/media-scheduler-table';
import { MediaWorkflow } from './constructs/media-workflow';

export interface ElementalMedialiveAutomationStackProps extends cdk.StackProps {
  notificationEmail?: string;
}

export class ElementalMedialiveAutomationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ElementalMedialiveAutomationStackProps) {
    super(scope, id, props);

    // Add CloudFormation parameter for email
    const emailParam = new cdk.CfnParameter(this, 'NotificationEmail', {
      type: 'String',
      description: 'Email address to receive MediaLive channel notifications',
      allowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      constraintDescription: 'Must be a valid email address',
      default: 'email@example.com',
    });

    // Create DynamoDB table
    const mediaSchedulerTable = new MediaSchedulerTable(this, 'Table');

    // Create Media Workflow (Step Functions + SNS)
    const mediaWorkflow = new MediaWorkflow(this, 'Workflow', {
      table: mediaSchedulerTable.table,
      notificationEmail: props?.notificationEmail || emailParam.valueAsString,
    });

    // Create Media Record Workflow with integrated EventBridge Pipe
    new MediaRecordWorkflow(this, 'RecordWorkflow', {
      mediaWorkflow,
      table: mediaSchedulerTable.table,
    });
  }
}
