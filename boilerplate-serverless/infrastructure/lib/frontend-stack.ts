import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendStack } from "./stacks/frontend.stack";
import { UpdateCallbackUrlsConstruct } from "./security/update-callback-urls.construct";

export interface MainFrontendStackProps extends cdk.StackProps {
  userPoolId: string;
  clientId: string;
  clientSecret: string;
  cognitoDomain: string;
  cognitoRegion?: string; 
  apiEndpoint: string;
}

export class MainFrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MainFrontendStackProps) {
    super(scope, id, props);
    
    // Get the Cognito region (default to us-west-2)
    const cognitoRegion = props.cognitoRegion || "us-west-2";

    // Create the frontend nested stack
    const frontendStack = new FrontendStack(this, "FrontendStack", {
      userPoolId: props.userPoolId,
      clientId: props.clientId,
      clientSecret: props.clientSecret,
      cognitoDomain: props.cognitoDomain,
      cognitoRegion: cognitoRegion,
      apiEndpoint: props.apiEndpoint,
    });

    // Update Cognito callback URLs after CloudFront is created
    new UpdateCallbackUrlsConstruct(this, "UpdateCallbackUrls", {
      userPoolId: props.userPoolId,
      clientId: props.clientId,
      cloudfrontDomain:
        frontendStack.frontendHosting.distribution.distributionDomainName,
      cognitoRegion: cognitoRegion,
    });
  }
}
