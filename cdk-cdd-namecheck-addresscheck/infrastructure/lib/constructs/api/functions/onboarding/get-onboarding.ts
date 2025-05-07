import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface GetOnboardingFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class GetOnboardingFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: GetOnboardingFunctionProps) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "get-onboarding",
      entry: path.join(
        __dirname,
        "../../../../src/api/onboarding/get-onboarding"
      ),
      handler: "get_onboarding.lambda_handler",
      description: "Gets onboarding request details by ID",
      environment: {
        ONBOARDING_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
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
