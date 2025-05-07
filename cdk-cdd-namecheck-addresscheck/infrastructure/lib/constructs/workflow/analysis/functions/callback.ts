import * as path from "path";
import { Duration } from "aws-cdk-lib";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

interface CallbackFunctionProps {
  tableName: string;
  commonLayer: lambda.ILayerVersion;
}

export class CallbackFunction extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: CallbackFunctionProps) {
    super(scope, id);

    const pythonLambda = new PythonLambda(this, "Function", {
      name: "AnalysisCallback",
      entry: path.join(__dirname, "../../../../src/workflow/analysis/callback"),
      handler: "index.lambda_handler",
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      timeout: Duration.seconds(30),
      layers: [props.commonLayer],
    });

    this.function = pythonLambda.function;

    // Grant read/write permissions to the Analysis table
    const analysisTable = dynamodb.Table.fromTableName(
      this,
      "AnalysisTable",
      props.tableName
    );
    analysisTable.grantReadWriteData(this.function);

    // Grant StepFunctions permissions to send task success/failure
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"], // You might want to restrict this to specific state machines
      })
    );
  }
}
