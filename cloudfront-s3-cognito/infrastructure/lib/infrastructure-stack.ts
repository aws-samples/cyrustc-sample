import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SecurityStack } from "./stacks/security.stack";
import { FrontendStack } from "./stacks/frontend.stack";
import { UpdateCallbackUrlsConstruct } from "./security/update-callback-urls.construct";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the security nested stack first with a temporary domain
    const securityStack = new SecurityStack(this, "SecurityStack", {
      cloudfrontDomain: "temporary.cloudfront.net", // Temporary value
    });

    // Create the frontend nested stack
    const frontendStack = new FrontendStack(this, "FrontendStack", {
      userPoolId: securityStack.cognitoConstruct.userPool.userPoolId,
      clientId:
        securityStack.cognitoConstruct.cloudFrontClient.userPoolClientId,
      clientSecret:
        securityStack.cognitoConstruct.cloudFrontClient.userPoolClientSecret.unsafeUnwrap(),
      cognitoDomain: `${securityStack.cognitoConstruct.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
    });

    // Update Cognito callback URLs after CloudFront is created
    new UpdateCallbackUrlsConstruct(this, "UpdateCallbackUrls", {
      userPoolId: securityStack.cognitoConstruct.userPool.userPoolId,
      clientId:
        securityStack.cognitoConstruct.cloudFrontClient.userPoolClientId,
      cloudfrontDomain:
        frontendStack.frontendHosting.distribution.distributionDomainName,
    });

    // Add dependency to ensure security stack is created first
    frontendStack.addDependency(securityStack);
  }
}
