import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { Construct } from "constructs";
import { cfAuthFunction } from "./cf-auth.function";
import { checkAuthFunction } from "./cf-check-auth.function";
import { cfConfigFunction } from "./cf-config.function";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface FrontendHostingConstructProps {
  userPoolId: string;
  clientId: string;
  clientSecret: string;
  cognitoDomain: string;
  cognitoRegion?: string;
  apiEndpoint: string;
}

export class FrontendHostingConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly originAccessIdentity: cloudfront.OriginAccessIdentity;

  constructor(
    scope: Construct,
    id: string,
    props: FrontendHostingConstructProps
  ) {
    super(scope, id);

    // Use the provided region or default to us-west-2
    const cognitoRegion = props.cognitoRegion || "us-west-2";

    // Create S3 bucket for frontend hosting
    this.bucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
    });

    // Create CloudFront OAI
    this.originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
      {
        comment: "CloudFront access to S3",
      }
    );

    // Grant read access to CloudFront
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            this.originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // Create Auth Edge Function
    const authEdgeFunction = new lambda.Function(this, "AuthEdgeFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(
        cfAuthFunction(
          props.userPoolId,
          props.clientId,
          props.clientSecret,
          props.cognitoDomain
        )
      ),
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
    });

    // Create version for Lambda@Edge
    const version = authEdgeFunction.currentVersion;

    // Create Auth Check Function
    const checkAuthCloudFrontFunction = new cloudfront.Function(
      this,
      "CheckAuthFunction",
      {
        code: cloudfront.FunctionCode.fromInline(
          checkAuthFunction(props.cognitoDomain, props.clientId)
        ),
        runtime: cloudfront.FunctionRuntime.JS_2_0,
      }
    );

    // Create Config Function
    const configCloudFrontFunction = new cloudfront.Function(
      this,
      "ConfigFunction",
      {
        code: cloudfront.FunctionCode.fromInline(
          cfConfigFunction(
            props.apiEndpoint,
            props.userPoolId,
            props.clientId,
            props.cognitoDomain,
            cognitoRegion
          )
        ),
        runtime: cloudfront.FunctionRuntime.JS_2_0,
      }
    );

    // Create S3 bucket origin using the non-deprecated S3BucketOrigin class
    const s3Origin = S3BucketOrigin.withOriginAccessIdentity(this.bucket, {
      originAccessIdentity: this.originAccessIdentity,
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        defaultBehavior: {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          functionAssociations: [
            {
              function: checkAuthCloudFrontFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        additionalBehaviors: {
          "/cf-auth": {
            origin: s3Origin,
            edgeLambdas: [
              {
                functionVersion: version,
                eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
              },
            ],
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          "/config": {
            origin: s3Origin,
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            functionAssociations: [
              {
                function: configCloudFrontFunction,
                eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              },
            ],
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          },
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
        enableLogging: true,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      }
    );

    // Deploy the React static assets to S3
    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../../frontend/dist")),
      ],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
      memoryLimit: 1024,
      prune: true,
      retainOnDelete: false,
    });
  }
}
