import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface StartAnalysisFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class StartAnalysisFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: StartAnalysisFunctionProps) {
    super(scope, id);

    // Create Lambda function
    const lambda = new PythonLambda(this, "Function", {
      name: "start-analysis",
      entry: path.join(
        __dirname,
        "../../../../src/api/analysis/start-analysis"
      ),
      handler: "start_analysis.lambda_handler",
      description: "Updates analysis status to start the workflow",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
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
      ],
    });

    this.function = lambda.function;
  }
}
