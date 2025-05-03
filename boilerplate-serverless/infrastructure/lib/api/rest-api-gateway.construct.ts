import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { ApiGatewayConfig, EnvironmentConfig } from "../config/environment";



export class RestApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly v1: apigateway.Resource;
  public readonly userPool?: cognito.IUserPool;

  constructor(scope: Construct, id: string, props: EnvironmentConfig) {
    super(scope, id);

    // Create CloudWatch Logs Role for API Gateway
    const apiGatewayLogsRole = new iam.Role(this, "ApiGatewayLogsRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        ),
      ],
    });

    // Create account settings to enable CloudWatch logging
    const apiGatewayAccount = new apigateway.CfnAccount(
      this,
      "ApiGatewayAccount",
      {
        cloudWatchRoleArn: apiGatewayLogsRole.roleArn,
      }
    );

    // Create REST API
    this.api = new apigateway.RestApi(this, `${props.appNameShort}Api`, {
      restApiName: `${props.appNameShort}-api-${props.apiGateway.stageName}`,
      description: `${props.appName} API`,
      deployOptions: {
        stageName: props.apiGateway.stageName,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel:
          apigateway.MethodLoggingLevel[
            props.apiGateway.logLevel as keyof typeof apigateway.MethodLoggingLevel
          ],
        dataTraceEnabled: true,
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
          "X-Request-Id",
        ],
        maxAge: cdk.Duration.days(1),
      },
      apiKeySourceType: props.apiGateway.requireApiKey
        ? apigateway.ApiKeySourceType.HEADER
        : undefined,
    });

    // Create v1 resource
    this.v1 = this.api.root.addResource("v1");

    // Add Gateway Response for CORS
    this.api.addGatewayResponse("corsResponse", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'*'",
      },
    });

    // Add default validator
    this.api.addRequestValidator("DefaultValidator", {
      requestValidatorName: "DefaultValidator",
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Add API Key only if required
    if (props.apiGateway.requireApiKey) {
      this.api.addApiKey("DefaultApiKey");
    }

    // Ensure the API Gateway account settings are created before the API
    this.api.node.addDependency(apiGatewayAccount);
  }
}
