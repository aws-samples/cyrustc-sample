import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGateway } from "../api/rest-api-gateway.construct";
import { getConfig } from "../config/environment";
import { HelloApiResource } from "../api/hello/hello-api-resource.construct";
import { PythonLambdaLayer } from "../common/lambda-layer.construct";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { DynamoDBStack } from "./dynamodb.stack";
import * as cognito from "aws-cdk-lib/aws-cognito";

export interface ApiStackProps extends NestedStackProps {
  dynamodbStack: DynamoDBStack;
  environment: string;
  userPool?: cognito.IUserPool;
}

export class ApiStack extends NestedStack {
  public readonly apiGateway: RestApiGateway;
  public readonly lambdaLayer: PythonLambdaLayer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const config = getConfig(this);

    // Create common Python layer
    this.lambdaLayer = new PythonLambdaLayer(this, "CommonPythonLayer");

    // Create API Gateway with WAF
    this.apiGateway = new RestApiGateway(this, "RestApiGateway", {
      ...config,
      userPool: props.userPool,
    });

    // Add Hello API using the new resource construct
    new HelloApiResource(this, "HelloApi", {
      api: this.apiGateway,
      layer: this.lambdaLayer,
      table: props.dynamodbStack.helloWorldTable.table,
    });
  }
}
