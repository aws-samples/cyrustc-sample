import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface CreateAnalysisIdFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class CreateAnalysisIdFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: CreateAnalysisIdFunctionProps
  ) {
    super(scope, id);

    // Create Lambda function
    const lambda = new PythonLambda(this, "Function", {
      name: "create-analysis-id",
      entry: path.join(
        __dirname,
        "../../../../src/api/analysis/create-analysis-id"
      ),
      handler: "create_analysis_id.lambda_handler",
      description: "Creates a new analysis ID",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        // DynamoDB write permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:PutItem"],
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
