import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DynamoDBStack } from '../../../lib/stacks/dynamodb.stack';

/**
 * Properties for all Step Functions
 */
export interface StepFunctionProps {
  /**
   * Environment identifier (dev, staging, prod)
   */
  environment: string;
  
  /**
   * Resource name prefix
   */
  prefix: string;
  
  /**
   * Optional tags to apply to all resources
   */
  tags?: { [key: string]: string };
  
  /**
   * Enable X-Ray tracing (default: true)
   */
  tracingEnabled?: boolean;
  
  /**
   * State machine type (default: STANDARD)
   */
  stateMachineType?: sfn.StateMachineType;
  
  /**
   * CloudWatch log level
   */
  logLevel?: sfn.LogLevel;
  
  /**
   * The DynamoDB stack containing all tables
   */
  dynamodbStack: DynamoDBStack;
  
  /**
   * Lambda layer to use for all functions
   */
  layer: lambda.LayerVersion;
}

/**
 * Core interface for Step Functions
 */
export interface IStepFunction {
  /**
   * The underlying Step Function state machine
   */
  readonly stateMachine: sfn.StateMachine;
  
  /**
   * The name of the state machine
   */
  readonly stateMachineName: string;
} 