import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface CreateOnboardingFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class CreateOnboardingFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: CreateOnboardingFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "create-onboarding",
      entry: path.join(
        __dirname,
        "../../../../src/api/onboarding/create-onboarding"
      ),
      handler: "create_onboarding.lambda_handler",
      description: "Creates a new onboarding request",
      environment: {
        ONBOARDING_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
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
