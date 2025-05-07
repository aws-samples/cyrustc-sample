import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface UpdateOnboardingStatusFunctionProps {
  tableName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class UpdateOnboardingStatusFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: UpdateOnboardingStatusFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "update-onboarding-status",
      entry: path.join(
        __dirname,
        "../../../../../lib/src/workflow/onboarding/update-onboarding-status"
      ),
      handler: "index.lambda_handler",
      description: "Updates onboarding status to READY_TO_CHECK",
      environment: {
        ONBOARDING_TABLE_NAME: props.tableName,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 128,
      initialPolicy: [
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
