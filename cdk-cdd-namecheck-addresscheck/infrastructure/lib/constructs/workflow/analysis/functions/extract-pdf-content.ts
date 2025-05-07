import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface ExtractPdfContentFunctionProps {
  tableName: string;
  bucketName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class ExtractPdfContentFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: ExtractPdfContentFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "extract-pdf-content",
      entry: path.join(
        __dirname,
        "../../../../../lib/src/workflow/analysis/extract-pdf-content"
      ),
      handler: "index.lambda_handler",
      description: "Extracts content from PDF documents using Bedrock",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
        BUCKET_NAME: props.bucketName,
        MODEL_ID: "anthropic.claude-3-sonnet-20240307-v1:0",
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
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
          actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:InvokeModel"],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:GetPrompt"],
          resources: [
            "arn:aws:bedrock:us-west-2:694900249028:prompt/BRWZQENLG9",
          ],
        }),
      ],
      layers: [props.commonLayer],
    });

    this.function = lambda.function;
  }
}
