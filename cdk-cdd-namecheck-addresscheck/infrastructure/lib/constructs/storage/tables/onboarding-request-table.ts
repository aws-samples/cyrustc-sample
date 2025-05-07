import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class OnboardingRequestTable extends Construct {
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
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add stack outputs
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "Onboarding Request DynamoDB table name",
    });

    new cdk.CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      description: "Onboarding Request DynamoDB table ARN",
    });
  }
}
