import * as path from "path";
import { Duration } from "aws-cdk-lib";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import { Construct } from "constructs";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";

interface LogAnalysisCompletionProps {
  onboardingTable: ITable;
  analysisTable: ITable;
  commonLayer: lambda.ILayerVersion;
}

export class LogAnalysisCompletion extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: LogAnalysisCompletionProps) {
    super(scope, id);

    const pythonLambda = new PythonLambda(this, "Function", {
      name: "LogAnalysisCompletion",
      entry: path.join(
        __dirname,
        "../../../../src/workflow/onboarding/log-analysis-completion"
      ),
      handler: "index.lambda_handler",
      environment: {
        ONBOARDING_TABLE_NAME: props.onboardingTable.tableName,
        ANALYSIS_TABLE_NAME: props.analysisTable.tableName,
      },
      timeout: Duration.seconds(30),
      layers: [props.commonLayer],
    });

    this.function = pythonLambda.function;

    // Grant read access to both tables
    props.onboardingTable.grantReadData(this.function);
    props.analysisTable.grantReadData(this.function);

    // Grant StepFunctions permissions to send task success/failure
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"],
      })
    );
  }
}
