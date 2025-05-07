import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface ListAnalysesFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class ListAnalysesFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: ListAnalysesFunctionProps) {
    super(scope, id);

    // Create Lambda function
    const lambda = new PythonLambda(this, "Function", {
      name: "list-analyses",
      entry: path.join(__dirname, "../../../../src/api/analysis/list-analyses"),
      handler: "list_analyses.lambda_handler",
      description: "Lists analyses with pagination",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        // DynamoDB read permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:Query"],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}`,
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}/index/createdAtIndex`,
          ],
        }),
      ],
    });

    this.function = lambda.function;
  }
}
