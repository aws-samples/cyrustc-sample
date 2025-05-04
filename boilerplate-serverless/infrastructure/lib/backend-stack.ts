import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SecurityStack } from "./stacks/security.stack";
import { ApiStack } from "./stacks/api.stack";
import { DynamoDBStack } from "./stacks/dynamodb.stack";
import { StepFunctionsStack } from "./stacks/step-functions.stack";

export interface MainBackendStackProps extends cdk.StackProps {
  temporaryCloudFrontDomain: string;
}

export class MainBackendStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly clientId: string;
  public readonly clientSecret: string;
  public readonly cognitoDomain: string;
  public readonly apiEndpoint: string;
  public readonly dynamodbStack: DynamoDBStack;
  public readonly apiStack: ApiStack;
  public readonly stepFunctionsStack: StepFunctionsStack;

  constructor(scope: Construct, id: string, props: MainBackendStackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext("environment") || "dev";
    const prefix = this.node.id.toLowerCase();

    // Create the security nested stack with a temporary domain
    const securityStack = new SecurityStack(this, "SecurityStack", {
      cloudfrontDomain: props.temporaryCloudFrontDomain,
    });
  
    // Create DynamoDB Stack first
    this.dynamodbStack = new DynamoDBStack(this, "DynamoDBStack", {
      description: "DynamoDB nested stack containing tables",
      environment: environment,
    });

    // Create the API stack
    this.apiStack = new ApiStack(this, "ApiStack", {
      description:
        "API nested stack containing API Gateway and Lambda functions",
      environment: environment,
      dynamodbStack: this.dynamodbStack,
      userPool: securityStack.cognitoConstruct.userPool,
    });

    // Create the Step Functions stack
    this.stepFunctionsStack = new StepFunctionsStack(this, "StepFunctionsStack", {
      description: "Step Functions nested stack containing state machines",
      environment: environment,
      prefix: prefix,
      dynamodbStack: this.dynamodbStack,
    });

    // Store Cognito details to be used by frontend stack
    this.userPoolId = securityStack.cognitoConstruct.userPool.userPoolId;
    this.clientId = securityStack.cognitoConstruct.cloudFrontClient.userPoolClientId;
    this.clientSecret = securityStack.cognitoConstruct.cloudFrontClient.userPoolClientSecret.unsafeUnwrap();
    this.cognitoDomain = `${securityStack.cognitoConstruct.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;
    this.apiEndpoint = this.apiStack.apiGateway.api.url;

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, "UserPoolIdOutput", {
      value: this.userPoolId,
      description: "Cognito User Pool ID",
      exportName: `${id}-UserPoolId`,
    });

    new cdk.CfnOutput(this, "ClientIdOutput", {
      value: this.clientId,
      description: "Cognito Client ID",
      exportName: `${id}-ClientId`,
    });

    new cdk.CfnOutput(this, "CognitoDomainOutput", {
      value: this.cognitoDomain,
      description: "Cognito Domain",
      exportName: `${id}-CognitoDomain`,
    });

    new cdk.CfnOutput(this, "ApiEndpointOutput", {
      value: this.apiEndpoint,
      description: "API Gateway Endpoint",
      exportName: `${id}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, "HelloWorldStepFunctionOutput", {
      value: this.stepFunctionsStack.helloWorldStepFunction.stateMachine.stateMachineArn,
      description: "Hello World Step Function ARN",
      exportName: `${id}-HelloWorldStepFunction`,
    });
  }
} 