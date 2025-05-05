import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BaseStepFunction } from './base-step-function';
import { StepFunctionProps } from '../interfaces/step-function.interface';
import { 
  IDynamoDbEventSource, 
  DynamoDbEventSourceOptions 
} from '../interfaces/dynamodb-event-source.interface';

/**
 * Properties for DynamoDB event Step Functions
 */
export interface DynamoDbEventStepFunctionProps extends StepFunctionProps {
  /**
   * Whether to automatically set up the DynamoDB event source when constructed
   */
  autoSetupDynamoDbEventSource?: boolean;
  
  /**
   * The DynamoDB table to use as event source (required if autoSetupDynamoDbEventSource is true)
   */
  dynamodbTable?: dynamodb.Table;
  
  /**
   * Configuration options for the DynamoDB event source
   */
  dynamodbEventSourceOptions?: DynamoDbEventSourceOptions;
}

/**
 * Base class for Step Functions that can be triggered by DynamoDB events
 */
export abstract class DynamoDbEventStepFunction extends BaseStepFunction implements IDynamoDbEventSource {
  constructor(scope: Construct, id: string, props: DynamoDbEventStepFunctionProps) {
    super(scope, id, props);
    
    // Automatically set up DynamoDB event source if configured
    if (props.autoSetupDynamoDbEventSource && props.dynamodbTable) {
      this.setupDynamoDbEventSource(props.dynamodbTable, props.dynamodbEventSourceOptions);
    }
  }
  
  /**
   * Set up a DynamoDB event source for the Step Function
   * 
   * @param table The DynamoDB table with stream enabled
   * @param options Configuration options for the event source
   * @returns The created EventBridge Pipe
   */
  public setupDynamoDbEventSource(table: dynamodb.Table, options?: DynamoDbEventSourceOptions): pipes.CfnPipe {
    // Check if table has stream enabled
    if (!table.tableStreamArn) {
      throw new Error(`DynamoDB table ${table.tableName} does not have streams enabled`);
    }
    
    // Create IAM role for the pipe
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
    
    // Generate pipe name with optional suffix
    const pipeName = options?.pipeSuffix 
      ? `${this.stateMachineName}-${options.pipeSuffix}`
      : `${this.stateMachineName}-dynamodb-pipe`;
    
    // Create the pipe - using basic structure to avoid linter issues
    const pipe = new pipes.CfnPipe(this, 'DynamoDbPipe', {
      name: pipeName,
      source: table.tableStreamArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
        },
      },
      target: this.stateMachine.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
      roleArn: pipeRole.roleArn,
    });
    
    return pipe;
  }
} 