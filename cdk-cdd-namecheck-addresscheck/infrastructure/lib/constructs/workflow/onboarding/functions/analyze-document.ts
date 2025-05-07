import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface AnalyzeDocumentFunctionProps {
  onboardingTableName: string;
  analysisTableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class AnalyzeDocumentFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: AnalyzeDocumentFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "analyze-onboarding-document",
      entry: path.join(
        __dirname,
        "../../../../../lib/src/workflow/onboarding/analyze-document"
      ),
      handler: "index.lambda_handler",
      description: "Analyzes onboarding document and updates analysis status",
      environment: {
        ONBOARDING_TABLE_NAME: props.onboardingTableName,
        ANALYSIS_TABLE_NAME: props.analysisTableName,
      },
      timeout: cdk.Duration.minutes(1),
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.onboardingTableName}`,
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.analysisTableName}`,
          ],
        }),
      ],
      layers: [props.commonLayer],
    });

    this.function = lambda.function;
  }
}
