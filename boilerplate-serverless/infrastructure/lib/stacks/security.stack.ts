import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CognitoConstruct } from "../security/cognito.construct";

export interface SecurityStackProps extends cdk.NestedStackProps {
  cloudfrontDomain: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly cognitoConstruct: CognitoConstruct;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create Cognito resources
    this.cognitoConstruct = new CognitoConstruct(this, "Cognito", {
      cloudfrontDomain: props.cloudfrontDomain,
    });

    // Output Cognito User Pool ID
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.cognitoConstruct.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    // Output CloudFront Client ID
    new cdk.CfnOutput(this, "CloudFrontClientId", {
      value: this.cognitoConstruct.cloudFrontClient.userPoolClientId,
      description: "CloudFront Client ID",
    });

    // Output Cognito Domain
    new cdk.CfnOutput(this, "CognitoDomain", {
      value: this.cognitoConstruct.userPool.userPoolProviderName,
      description: "Cognito Domain",
    });
  }
}
