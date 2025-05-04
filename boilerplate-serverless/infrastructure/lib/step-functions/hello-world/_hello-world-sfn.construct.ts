import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';
import {
  BaseStepFunction,
  StepFunctionProps,
  IDynamoDbEventSource
} from '../../../core/step-function';
import { DynamoDBStack } from '../../stacks/dynamodb.stack';
import { TableInterfaces } from '../../../core/dynamodb';

// Use the existing lambda-python construct from common directory
import { LambdaPythonFunction } from '../../../core/lambda-python.construct';

/**
 * Properties for the HelloWorld Step Function
 * NOTE: This extends StepFunctionProps which already has dynamodbStack and layer
 */
export interface HelloWorldStepFunctionProps extends StepFunctionProps {
  // No additional properties needed
}

/**
 * HelloWorld Step Function construct that responds to DynamoDB stream events.
 */
export class HelloWorldStepFunction extends BaseStepFunction implements IDynamoDbEventSource {
  /**
   * The Lambda function used in the Step Function
   */
  private lambdaFunction?: lambda.Function;

  constructor(scope: Construct, id: string, props: HelloWorldStepFunctionProps) {
    // Call super constructor which will trigger lifecycle methods
    super(scope, id, props);
  }
  
  /**
   * Create dependencies required for the workflow
   */
  protected createDependencies(): void {
    // Get the helloWorld table from the registry
    const helloWorldTable = this.dynamodbStack.getTable('helloWorld');
    
    // Create the Lambda function
    this.lambdaFunction = new LambdaPythonFunction(this, 'HelloLambda', {
      entry: path.join(__dirname, 'hello-lambda'),
      layer: this.layer,
      environment: {
        ENVIRONMENT: this.node.tryGetContext('environment') || 'dev',
        HELLO_WORLD_TABLE: helloWorldTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    
    // Grant read/write permissions to the Lambda function for the table
    helloWorldTable.table.grantReadWriteData(this.lambdaFunction);
  }
  
  /**
   * Create the Step Function workflow definition
   */
  protected createWorkflowDefinition(): sfn.IChainable {
    if (!this.lambdaFunction) {
      throw new Error('Lambda function not initialized');
    }
    
    // Create Lambda task
    const helloTask = new tasks.LambdaInvoke(this, 'InvokeHelloLambda', {
      lambdaFunction: this.lambdaFunction,
      retryOnServiceExceptions: true,
      outputPath: '$.Payload',
    });
    
    // Create success and failure states
    const successState = new sfn.Succeed(this, 'Success', {
      comment: 'HelloWorld Step Function completed successfully',
    });
    
    const failState = new sfn.Fail(this, 'Fail', {
      cause: 'HelloWorld Step Function execution failed',
      error: 'HelloWorldError',
    });
    
    // Define the workflow
    return sfn.Chain.start(helloTask)
      .next(
        new sfn.Choice(this, 'WasSuccessful')
          .when(sfn.Condition.booleanEquals('$.success', true), successState)
          .otherwise(failState)
      );
  }
  
  /**
   * Set up additional resources after the state machine is created
   */
  protected setupResources(): void {
    // Get the helloWorld table from the registry
    const helloWorldTable = this.dynamodbStack.getTable('helloWorld');
    
    // Set up DynamoDB event source
    this.setupDynamoDbEventSource(helloWorldTable.table);
  }
  
  /**
   * Set up a DynamoDB event source for the Step Function
   * 
   * @param table The DynamoDB table with stream enabled
   * @param options Configuration options for the event source
   * @returns The created EventBridge Pipe
   */
  public setupDynamoDbEventSource(table: dynamodb.Table, options?: any): pipes.CfnPipe {
    // Check if table has stream enabled
    if (!table.tableStreamArn) {
      throw new Error(`DynamoDB table ${table.tableName} does not have streams enabled`);
    }
    
    // Create an IAM role for the pipe
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });
    
    // Grant permissions to read from DynamoDB stream
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams'
        ],
        resources: [table.tableStreamArn],
      })
    );
    
    // Grant permissions to invoke Step Function
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['states:StartExecution'],
        resources: [this.stateMachine.stateMachineArn],
      })
    );
    
    // Create the pipe with enhanced configuration similar to the reference implementation
    const pipe = new pipes.CfnPipe(this, 'DynamoDbPipe', {
      name: `${this.stateMachineName}-dynamodb-pipe`,
      source: table.tableStreamArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
          maximumBatchingWindowInSeconds: 60,
        },
        // Optional: Add filter to only trigger on specific conditions
        filterCriteria: {
          filters: [
            {
              pattern: JSON.stringify({
                eventName: ["INSERT", "MODIFY"],
              }),
            },
          ],
        },
      },
      target: this.stateMachine.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
        // Transform DynamoDB stream data into a cleaner format for the Step Function
        inputTemplate: JSON.stringify({
          recordId: "<$.dynamodb.NewImage.pk.S>",
          operation: "<$.eventName>",
          timestamp: "<$.approximateCreationDateTime>",
          tableName: "<$.eventSourceARN>",
        }),
      },
      roleArn: pipeRole.roleArn,
    });
    
    return pipe;
  }
} 