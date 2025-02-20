import * as cdk from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface UpdateCallbackUrlsProps {
  userPoolId: string;
  clientId: string;
  cloudfrontDomain: string;
}

export class UpdateCallbackUrlsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: UpdateCallbackUrlsProps) {
    super(scope, id);

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
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          `arn:aws:cognito-idp:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:userpool/${props.userPoolId}`,
        ],
      }),
    });
  }
}
