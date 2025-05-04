import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import { BaseTable, TableInterfaces } from "../../core/dynamodb";

/**
 * Properties for the HelloWorld Table
 */
export interface HelloWorldTableProps {
  /**
   * The environment (dev, staging, prod)
   */
  environment?: string;
}

/**
 * HelloWorld DynamoDB table with standardized configuration
 */
export class HelloWorldTable extends BaseTable {
  constructor(scope: Construct, id: string, props?: HelloWorldTableProps) {
    // Get environment from props or CDK context
    const stack = Stack.of(scope);
    const environment = props?.environment || stack.node.tryGetContext('environment') || 'dev';
    
    // Call super with all the table configuration
    super(scope, id, {
      environment,
      tableName: "HelloWorldTable",
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      stream: {
        enabled: true,
        viewType: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      },
      tags: {
        Feature: 'HelloWorld'
      }
    });
  }
} 