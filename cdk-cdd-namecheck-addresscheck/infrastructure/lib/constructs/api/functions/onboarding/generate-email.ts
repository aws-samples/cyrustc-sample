import * as path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { PythonLambda } from "../../../common/lambda/python-lambda";

// Constants for Bedrock resources
const BEDROCK_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";
const BEDROCK_PROMPT_ID =
  "arn:aws:bedrock:us-west-2:694900249028:prompt/FNOCOGP9HZ";

export interface GenerateEmailLambdaProps {
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class GenerateEmailLambda extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(scope: Construct, id: string, props: GenerateEmailLambdaProps) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "generate-email",
      entry: path.join(
        __dirname,
        "../../../../src/api/onboarding/generate-email"
      ),
      handler: "index.lambda_handler",
      description: "Generates email content for onboarding communications",
      environment: {
        POWERTOOLS_SERVICE_NAME: "onboarding-email-generator",
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:InvokeModel"],
          resources: [
            `arn:aws:bedrock:${
              cdk.Stack.of(this).region
            }::foundation-model/${BEDROCK_MODEL_ID}`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:GetPrompt"],
          resources: [BEDROCK_PROMPT_ID],
        }),
      ],
    });

    this.function = lambda.function;
  }
}
