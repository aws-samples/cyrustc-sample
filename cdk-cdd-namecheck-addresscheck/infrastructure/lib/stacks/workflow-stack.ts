import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { AnalysisStateMachine } from "../constructs/workflow/analysis/state-machine";
import { AnalysisPipe } from "../constructs/workflow/analysis/analysis-pipe";
import { OnboardingStateMachine } from "../constructs/workflow/onboarding/state-machine";
import { OnboardingPipe } from "../constructs/workflow/onboarding/onboarding-pipe";
import { StorageStack } from "./storage-stack";
import * as path from "path";

interface WorkflowStackProps extends cdk.StackProps {
  storageStack: StorageStack;
}

export class WorkflowStack extends cdk.Stack {
  public readonly analysisStateMachine: cdk.aws_stepfunctions.StateMachine;
  public readonly onboardingStateMachine: cdk.aws_stepfunctions.StateMachine;
  private readonly workflowLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props);

    // Create Lambda Layer for workflow functions
    this.workflowLayer = new lambda.LayerVersion(this, "WorkflowLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/layer/"), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            "bash",
            "-c",
            [
              "pip install -r python/requirements.txt -t /asset-output/python",
              "cp -r python/utilities /asset-output/python/",
              "cp -r python/data /asset-output/python/",
            ].join(" && "),
          ],
        },
      }),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: "Common utilities for workflow Lambda functions",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Analysis State Machine
    const analysisWorkflow = new AnalysisStateMachine(
      this,
      "AnalysisStateMachine",
      {
        tableName: props.storageStack.analysisTable.tableName,
        bucketName: props.storageStack.documentBucket.bucketName,
        commonLayer: this.workflowLayer,
      }
    );

    // Create Analysis EventBridge Pipe
    new AnalysisPipe(this, "AnalysisPipe", {
      table: props.storageStack.analysisTable,
      stateMachine: analysisWorkflow.stateMachine,
    });

    // Create Onboarding State Machine
    const onboardingWorkflow = new OnboardingStateMachine(
      this,
      "OnboardingStateMachine",
      {
        storageStack: props.storageStack,
        commonLayer: this.workflowLayer,
      }
    );

    // Create Onboarding EventBridge Pipe
    new OnboardingPipe(this, "OnboardingPipe", {
      table: props.storageStack.onboardingRequestTable,
      stateMachine: onboardingWorkflow.stateMachine,
    });

    // Assign public properties
    this.analysisStateMachine = analysisWorkflow.stateMachine;
    this.onboardingStateMachine = onboardingWorkflow.stateMachine;

    // Add stack outputs
    new cdk.CfnOutput(this, "AnalysisStateMachineArn", {
      value: this.analysisStateMachine.stateMachineArn,
      description: "Analysis workflow state machine ARN",
    });

    new cdk.CfnOutput(this, "OnboardingStateMachineArn", {
      value: this.onboardingStateMachine.stateMachineArn,
      description: "Onboarding workflow state machine ARN",
    });
  }
}
