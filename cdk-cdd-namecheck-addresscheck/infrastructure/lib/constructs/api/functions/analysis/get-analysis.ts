import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

interface GetAnalysisFunctionProps {
  tableName: string;
  commonLayer: lambda.LayerVersion;
}

export class GetAnalysisFunction extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: GetAnalysisFunctionProps) {
    super(scope, id);

    this.function = new lambda.Function(this, "Function", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "get_analysis.lambda_handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../../src/api/analysis/get-analysis")
      ),
      environment: {
        ANALYSIS_TABLE_NAME: props.tableName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });
  }
}
