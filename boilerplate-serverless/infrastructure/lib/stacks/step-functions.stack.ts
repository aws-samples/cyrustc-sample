import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { HelloWorldStepFunction } from '../step-functions/hello-world/_hello-world-sfn.construct';
import { DynamoDBStack } from './dynamodb.stack';
import { PythonLambdaLayer } from '../../core/lambda-layer.construct';

export interface StepFunctionsStackProps extends cdk.NestedStackProps {
  prefix: string;
  environment: string;
  dynamodbStack: DynamoDBStack;
}

export class StepFunctionsStack extends cdk.NestedStack {
  // Expose the hello world step function
  public readonly helloWorldStepFunction: HelloWorldStepFunction;
  
  // Lambda layer for Step Functions
  public readonly lambdaLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: StepFunctionsStackProps) {
    super(scope, id, props);

    // Use the existing Python Lambda layer
    this.lambdaLayer = new PythonLambdaLayer(this, 'StepFunctionsLambdaLayer');

    // Create the hello world step function
    this.helloWorldStepFunction = new HelloWorldStepFunction(this, 'HelloWorldStepFunction', {
      prefix: props.prefix,
      environment: props.environment,
      dynamodbStack: props.dynamodbStack, // Pass the entire DynamoDB stack
      layer: this.lambdaLayer, // Pass the layer
      tags: {
        Service: 'StepFunctions',
        Feature: 'HelloWorld'
      }
    });

    // Add outputs
    new cdk.CfnOutput(this, 'HelloWorldStepFunctionArn', {
      value: this.helloWorldStepFunction.stateMachine.stateMachineArn,
      description: 'ARN of the Hello World Step Function',
      exportName: `${props.prefix}-hello-world-step-function-arn-${props.environment}`
    });
  }
} 