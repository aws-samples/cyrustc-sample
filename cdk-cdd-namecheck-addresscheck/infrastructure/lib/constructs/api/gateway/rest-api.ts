import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface RestApiProps {
  stageName: string;
}

export class RestApi extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: RestApiProps) {
    super(scope, id);

    // Create CloudWatch role for API Gateway
    const cloudWatchRole = new iam.Role(this, "ApiGatewayCloudWatchRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        ),
      ],
    });

    // Create API Gateway Account to associate with CloudWatch role
    const apiGatewayAccount = new apigateway.CfnAccount(
      this,
      "ApiGatewayAccount",
      {
        cloudWatchRoleArn: cloudWatchRole.roleArn,
      }
    );

    // Create REST API
    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: "DigDoc API",
      description: "API for document analysis service",
      deployOptions: {
        stageName: props.stageName,
        tracingEnabled: true, // Enable X-Ray tracing
        metricsEnabled: true, // Enable CloudWatch metrics
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Add dependency to ensure CloudWatch role is created first
    const deployment = this.api.latestDeployment;
    if (deployment) {
      deployment.node.addDependency(apiGatewayAccount);
    }

    // Add a gateway response for CORS
    this.api.addGatewayResponse("corsResponse", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'*'",
      },
    });
  }
}
