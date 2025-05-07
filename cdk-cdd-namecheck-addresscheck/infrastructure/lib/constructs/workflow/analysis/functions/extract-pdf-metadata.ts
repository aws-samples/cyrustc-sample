import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface ExtractPdfMetadataFunctionProps {
  tableName: string;
  bucketName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class ExtractPdfMetadataFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: ExtractPdfMetadataFunctionProps) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "extract-pdf-metadata",
      entry: path.join(__dirname, "../../../../../lib/src/workflow/analysis/extract-pdf-metadata"),
      handler: "index.lambda_handler",
      description: "Extracts metadata from PDF documents",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
        BUCKET_NAME: props.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      initialPolicy: [
        // S3 read permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:GetObject"],
          resources: [`arn:aws:s3:::${props.bucketName}/*`],
        }),
        // DynamoDB permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem"
          ],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}`,
          ],
        }),
      ],
      layers: [props.commonLayer],
    });

    this.function = lambda.function;
  }
} 