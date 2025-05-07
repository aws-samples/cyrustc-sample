import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface UpdateStatusFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class UpdateStatusFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: UpdateStatusFunctionProps) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "update-status",
      entry: path.join(__dirname, "../../../../../lib/src/workflow/analysis/update-status"),
      handler: "index.lambda_handler",
      description: "Updates analysis status in DynamoDB",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        // DynamoDB write permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:UpdateItem"],
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