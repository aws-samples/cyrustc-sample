import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface ListOnboardingFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class ListOnboardingFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: ListOnboardingFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "list-onboarding",
      entry: path.join(
        __dirname,
        "../../../../src/api/onboarding/list-onboarding"
      ),
      handler: "list_onboarding.lambda_handler",
      description: "Lists onboarding requests with pagination",
      environment: {
        ONBOARDING_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:Query", "dynamodb:Scan"],
          resources: [
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}`,
            `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
              cdk.Stack.of(this).account
            }:table/${props.tableName}/index/*`,
          ],
        }),
      ],
    });

    this.function = lambda.function;
  }
}
