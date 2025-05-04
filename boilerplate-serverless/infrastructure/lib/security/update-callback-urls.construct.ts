import * as cdk from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface UpdateCallbackUrlsProps {
  userPoolId: string;
  clientId: string;
  cloudfrontDomain: string;
  cognitoRegion?: string; // Optional region param for cross-region setup
}

export class UpdateCallbackUrlsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: UpdateCallbackUrlsProps) {
    super(scope, id);

    // Use the provided region or default to the stack's region
    const region = props.cognitoRegion || cdk.Stack.of(this).region;

    // Create the custom resource using AwsCustomResource
    new cr.AwsCustomResource(this, "UpdateCallbackUrlsResource", {
      onCreate: {
        service: "CognitoIdentityServiceProvider",
        action: "updateUserPoolClient",
        parameters: {
          UserPoolId: props.userPoolId,
          ClientId: props.clientId,
          CallbackURLs: [`https://${props.cloudfrontDomain}/cf-auth`],
          AllowedOAuthFlows: ["code"],
          AllowedOAuthFlowsUserPoolClient: true,
          AllowedOAuthScopes: ["email", "openid", "profile"],
          SupportedIdentityProviders: ["COGNITO"],
          PreventUserExistenceErrors: "ENABLED",
          GenerateSecret: true,
          ExplicitAuthFlows: ["ALLOW_REFRESH_TOKEN_AUTH"],
        },
        physicalResourceId: cr.PhysicalResourceId.of(props.clientId),
        region: region, // Specify the region for this API call
      },
      onUpdate: {
        service: "CognitoIdentityServiceProvider",
        action: "updateUserPoolClient",
        parameters: {
          UserPoolId: props.userPoolId,
          ClientId: props.clientId,
          CallbackURLs: [`https://${props.cloudfrontDomain}/cf-auth`],
          AllowedOAuthFlows: ["code"],
          AllowedOAuthFlowsUserPoolClient: true,
          AllowedOAuthScopes: ["email", "openid", "profile"],
          SupportedIdentityProviders: ["COGNITO"],
          PreventUserExistenceErrors: "ENABLED",
          GenerateSecret: true,
          ExplicitAuthFlows: ["ALLOW_REFRESH_TOKEN_AUTH"],
        },
        physicalResourceId: cr.PhysicalResourceId.of(props.clientId),
        region: region, // Specify the region for this API call
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          `arn:aws:cognito-idp:${region}:${
            cdk.Stack.of(this).account
          }:userpool/${props.userPoolId}`,
        ],
      }),
    });
  }
}
