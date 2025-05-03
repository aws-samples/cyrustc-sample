import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendHostingConstruct } from "../frontend/frontend-hosting.construct";

export interface FrontendStackProps extends cdk.NestedStackProps {
  userPoolId: string;
  clientId: string;
  clientSecret: string;
  cognitoDomain: string;
  cognitoRegion?: string;
  apiEndpoint: string;
}

export class FrontendStack extends cdk.NestedStack {
  public readonly frontendHosting: FrontendHostingConstruct;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // Create Frontend hosting resources
    this.frontendHosting = new FrontendHostingConstruct(
      this,
      "FrontendHosting",
      {
        userPoolId: props.userPoolId,
        clientId: props.clientId,
        clientSecret: props.clientSecret,
        cognitoDomain: props.cognitoDomain,
        cognitoRegion: props.cognitoRegion,
        apiEndpoint: props.apiEndpoint,
      }
    );

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${this.frontendHosting.distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL",
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, "S3BucketName", {
      value: this.frontendHosting.bucket.bucketName,
      description: "Frontend S3 Bucket Name",
    });
  }
}
