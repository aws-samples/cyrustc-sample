import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class PromptsTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create DynamoDB table
    this.table = new dynamodb.Table(this, "Table", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      timeToLiveAttribute: "ttl",
    });

    // Add GSI for querying prompts by type
    this.table.addGlobalSecondaryIndex({
      indexName: "typeIndex",
      partitionKey: {
        name: "type",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add stack outputs
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "Prompts DynamoDB table name",
    });

    new cdk.CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      description: "Prompts DynamoDB table ARN",
    });
  }
}
