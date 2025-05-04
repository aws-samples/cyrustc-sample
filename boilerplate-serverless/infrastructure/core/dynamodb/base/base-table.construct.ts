import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { BaseTableProps, ITable, IndexDefinition } from "../interfaces/table.interface";

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
 * Base construct for DynamoDB tables with standardized configuration
 */
export class BaseTable extends Construct implements ITable {
  /**
   * The underlying DynamoDB table
   */
  public readonly table: dynamodb.Table;
  
  /**
   * The table name
   */
  public readonly tableName: string;
  
  constructor(scope: Construct, id: string, props: BaseTableProps) {
    super(scope, id);
    
    // Determine if this is a development environment
    const isDevEnvironment = props.environment === 'local' || props.environment === 'dev';
    
    // Create the table
    this.table = new dynamodb.Table(this, props.tableName, {
      tableName: props.physicalTableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      billingMode: props.billingMode || dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isDevEnvironment ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      stream: props.stream?.enabled ? props.stream.viewType : undefined,
    });
    
    // Store table name
    this.tableName = this.table.tableName;
    
    // Add any additional indexes
    if (props.indexes) {
      for (const index of props.indexes) {
        if (index.type === 'GSI') {
          this.table.addGlobalSecondaryIndex({
            indexName: index.indexName,
            partitionKey: index.partitionKey,
            sortKey: index.sortKey,
            projectionType: index.projectionType || dynamodb.ProjectionType.ALL,
          });
        } else if (index.type === 'LSI') {
          this.table.addLocalSecondaryIndex({
            indexName: index.indexName,
            sortKey: index.sortKey!,
            projectionType: index.projectionType || dynamodb.ProjectionType.ALL,
          });
        }
      }
    }
    
    // Apply tags
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this.table).add(key, value);
      });
    }
    
    // Add standard tags
    cdk.Tags.of(this.table).add('Environment', props.environment);
    cdk.Tags.of(this.table).add('ManagedBy', 'CDK');
  }
} 