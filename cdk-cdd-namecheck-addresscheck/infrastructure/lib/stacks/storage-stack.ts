import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AnalysisTable } from "../constructs/storage/tables/analysis-table";
import { PromptsTable } from "../constructs/storage/tables/prompts-table";
import { DocumentBucket } from "../constructs/storage/document-bucket";
import { OnboardingRequestTable } from "../constructs/storage/tables/onboarding-request-table";
import { WebsiteBucket } from "../constructs/storage/website-bucket";
import path = require("path");

export class StorageStack extends cdk.Stack {
  public readonly analysisTable: cdk.aws_dynamodb.Table;
  public readonly promptsTable: cdk.aws_dynamodb.Table;
  public readonly documentBucket: cdk.aws_s3.Bucket;
  public readonly onboardingRequestTable: cdk.aws_dynamodb.Table;
  public readonly publicWebsiteBucket: WebsiteBucket;
  public readonly adminPortalBucket: WebsiteBucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Analysis DynamoDB table
    const analysisTableConstruct = new AnalysisTable(this, "AnalysisTable");
    this.analysisTable = analysisTableConstruct.table;

    // Create Prompts DynamoDB table
    const promptsTableConstruct = new PromptsTable(this, "PromptsTable");
    this.promptsTable = promptsTableConstruct.table;

    // Create Document S3 bucket
    const documentBucketConstruct = new DocumentBucket(this, "DocumentBucket");
    this.documentBucket = documentBucketConstruct.bucket;

    // Create Onboarding Request Table
    const onboardingRequestTableConstruct = new OnboardingRequestTable(
      this,
      "OnboardingRequestTable"
    );
    this.onboardingRequestTable = onboardingRequestTableConstruct.table;

    // Create public website bucket with CloudFront
    this.publicWebsiteBucket = new WebsiteBucket(this, "PublicWebsiteBucket", {
      websiteName: "digdoc-public",
      deploymentSourcePath: path.join(__dirname, "../../../public-website/out"),
    });

    // Create admin portal bucket with CloudFront
    this.adminPortalBucket = new WebsiteBucket(this, "AdminPortalBucket", {
      websiteName: "digdoc-admin",
      deploymentSourcePath: path.join(__dirname, "../../../frontend/dist"),
    });
  }
}
