import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { HelloWorldTable } from "../dynamodb/hello-world-table.construct";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";

export interface DynamoDBStackProps extends NestedStackProps {
  environment?: string;
}

export class DynamoDBStack extends NestedStack {
  public readonly helloWorldTable: HelloWorldTable;

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    // Create Hello World table
    this.helloWorldTable = new HelloWorldTable(this, "HelloWorldTable");

  }
}
