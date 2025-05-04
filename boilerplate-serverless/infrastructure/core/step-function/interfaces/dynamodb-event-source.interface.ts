import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as pipes from 'aws-cdk-lib/aws-pipes';

/**
 * Configuration options for DynamoDB event source
 */
export interface DynamoDbEventSourceOptions {
  /**
   * Name suffix for the EventBridge Pipe
   */
  pipeSuffix?: string;
  
  /**
   * Input transformation options
   */
  transformation?: {
    /**
     * Input template for transforming DynamoDB records
     */
    inputTemplate?: string;
  };
  
  /**
   * Filter criteria for the pipe
   */
  filterCriteria?: {
    /**
     * Event pattern to match
     */
    pattern: string | object;
  };
  
  /**
   * Source parameters for the pipe
   */
  sourceParameters?: {
    /**
     * Maximum batching window in seconds
     */
    maximumBatchingWindowInSeconds?: number;
    
    /**
     * Batch size
     */
    batchSize?: number;
    
    /**
     * Starting position for the stream
     */
    startingPosition?: string;
  };
}

/**
 * Interface for Step Functions that can be triggered by DynamoDB events
 */
export interface IDynamoDbEventSource {
  /**
   * Set up a DynamoDB event source for the Step Function
   * 
   * @param table The DynamoDB table with stream enabled
   * @param options Configuration options for the event source
   * @returns The created EventBridge Pipe
   */
  setupDynamoDbEventSource(table: dynamodb.Table, options?: DynamoDbEventSourceOptions): pipes.CfnPipe;
} 