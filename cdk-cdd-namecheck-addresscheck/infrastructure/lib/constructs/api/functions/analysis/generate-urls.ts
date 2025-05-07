import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface GenerateUrlsFunctionProps {
  tableName: string;
  bucketName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class GenerateUrlsFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: GenerateUrlsFunctionProps) {
    super(scope, id);

    // Create Lambda function
    const lambda = new PythonLambda(this, "Function", {
      name: "generate-urls",
      entry: path.join(__dirname, "../../../../src/api/analysis/generate-urls"),
      handler: "generate_urls.lambda_handler",
      description: "Generates presigned URLs for document upload",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
        BUCKET_NAME: props.bucketName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        // S3 permissions for presigned URLs
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:PutObject"],
          resources: [`arn:aws:s3:::${props.bucketName}/*`],
        }),
        // DynamoDB read permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:GetItem"],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}`,
          ],
        }),
      ],
    });

    this.function = lambda.function;
  }
}
