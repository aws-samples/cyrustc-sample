import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface PythonLambdaProps {
  name: string;
  entry: string;
  handler: string;
  description?: string;
  environment?: { [key: string]: string };
  timeout?: cdk.Duration;
  memorySize?: number;
  layers?: lambda.ILayerVersion[];
  initialPolicy?: iam.PolicyStatement[];
}

export class PythonLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: PythonLambdaProps) {
    super(scope, id);

    // Create Lambda function
    this.function = new lambda.Function(this, "Function", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.entry),
      description: props.description,
      environment: {
        POWERTOOLS_SERVICE_NAME: props.name,
        LOG_LEVEL: "INFO",
        ...props.environment,
      },
      timeout: props.timeout || cdk.Duration.seconds(30),
      memorySize: props.memorySize || 256,
      layers: props.layers,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // Add initial policies if provided
    if (props.initialPolicy) {
      props.initialPolicy.forEach((policy) => {
        this.function.addToRolePolicy(policy);
      });
    }

    // Add CloudWatch permissions for Lambda Powertools
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );

    // Add X-Ray permissions
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries",
        ],
        resources: ["*"],
      })
    );
  }
}
