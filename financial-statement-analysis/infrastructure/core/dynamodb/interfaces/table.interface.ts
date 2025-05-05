import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

/**
 * Definition for a table index
 */
export interface IndexDefinition {
  /**
   * The name of the index
   */
  indexName: string;
  
  /**
   * The partition key for the index
   */
  partitionKey: {
    name: string;
    type: dynamodb.AttributeType;
  };
  
  /**
   * Optional sort key for the index
   */
  sortKey?: {
    name: string;
    type: dynamodb.AttributeType;
  };
  
  /**
   * Index type: GSI or LSI
   */
  type: "GSI" | "LSI";
  
  /**
   * Projection type for the index
   */
  projectionType?: dynamodb.ProjectionType;
}

/**
 * Configuration for DynamoDB streams
 */
export interface StreamConfig {
  /**
   * Whether streams are enabled
   */
  enabled: boolean;
  
  /**
   * What information to include in stream records
   */
  viewType: dynamodb.StreamViewType;
}

/**
 * Properties for the BaseTable construct
 */
export interface BaseTableProps {
  /**
   * The environment (dev, staging, prod)
   */
  environment: string;
  
  /**
   * Logical name for the table
   */
  tableName: string;
  
  /**
   * Physical name override for the table (optional)
   */
  physicalTableName?: string;
  
  /**
   * Partition key definition
   */
  partitionKey: {
    name: string;
    type: dynamodb.AttributeType;
  };
  
  /**
   * Optional sort key definition
   */
  sortKey?: {
    name: string;
    type: dynamodb.AttributeType;
  };
  
  /**
   * Additional indexes (GSIs and LSIs)
   */
  indexes?: IndexDefinition[];
  
  /**
   * Stream configuration
   */
  stream?: StreamConfig;
  
  /**
   * Billing mode (default: PAY_PER_REQUEST)
   */
  billingMode?: dynamodb.BillingMode;
  
  /**
   * Optional tags
   */
  tags?: { [key: string]: string };
}

/**
 * Core interface for DynamoDB tables
 */
export interface ITable {
  /**
   * The underlying DynamoDB table
   */
  readonly table: dynamodb.Table;
  
  /**
   * The table name
   */
  readonly tableName: string;
} 