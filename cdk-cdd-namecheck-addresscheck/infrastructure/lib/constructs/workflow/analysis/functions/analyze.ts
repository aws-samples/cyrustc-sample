import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface AnalyzeFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class AnalyzeFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: AnalyzeFunctionProps) {
    super(scope, id);

    const promptId = "arn:aws:bedrock:us-west-2:694900249028:prompt/ARQB8KDI79";

    const lambda = new PythonLambda(this, "Function", {
      name: "analyze",
      entry: path.join(
        __dirname,
        "../../../../../lib/src/workflow/analysis/analyze"
      ),
      handler: "index.lambda_handler",
      description: "Analyzes document content using Bedrock prompt",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
        PROMPT_ID: promptId,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      initialPolicy: [
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
        // Bedrock model invocation permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "bedrock:InvokeModel",
            "bedrock-runtime:InvokeModel"
          ],
          resources: ["*"],
        }),
        // Bedrock prompt permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:GetPrompt"],
          resources: [promptId],
        }),
      ],
      layers: [props.commonLayer],
    });

    this.function = lambda.function;
  }
}
