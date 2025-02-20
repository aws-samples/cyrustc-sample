import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface CognitoCloudfrontClientStackProps
  extends cdk.NestedStackProps {
  userPool: cognito.IUserPool;
  cloudfrontDomain: string;
}

export class CognitoCloudfrontClientStack extends cdk.NestedStack {
  public readonly cloudFrontClient: cognito.UserPoolClient;

  constructor(
    scope: Construct,
    id: string,
    props: CognitoCloudfrontClientStackProps
  ) {
    super(scope, id, props);

    // Create User Pool Client for CloudFront with correct callback URL
    this.cloudFrontClient = new cognito.UserPoolClient(
      this,
      "CloudFrontClient",
      {
        userPool: props.userPool,
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: [`https://${props.cloudfrontDomain}/cf-auth`],
        },
        preventUserExistenceErrors: true,
        generateSecret: true,
      }
    );

    // Output CloudFront Client ID
    new cdk.CfnOutput(this, "CloudFrontClientId", {
      value: this.cloudFrontClient.userPoolClientId,
      description: "CloudFront Client ID",
    });
  }
}
