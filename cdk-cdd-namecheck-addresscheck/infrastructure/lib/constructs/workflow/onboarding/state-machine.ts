import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as pipes from "aws-cdk-lib/aws-pipes";
import { Construct } from "constructs";
import { UpdateStatusFunction } from "./functions/update-status";
import { AnalyzeDocumentFunction } from "./functions/analyze-document";
import { StorageStack } from "../../../stacks/storage-stack";
import { LogAnalysisCompletion } from "./functions/log-analysis-completion";
import { UpdateOnboardingStatusFunction } from "./functions/update-onboarding-status";

interface OnboardingStateMachineProps {
  storageStack: StorageStack;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class OnboardingStateMachine extends Construct {
  public readonly stateMachine: sfn.StateMachine;

  constructor(
    scope: Construct,
    id: string,
    props: OnboardingStateMachineProps
  ) {
    super(scope, id);

    // Create Lambda functions
    const updateStatus = new UpdateStatusFunction(this, "UpdateStatus", {
      tableName: props.storageStack.onboardingRequestTable.tableName,
      commonLayer: props.commonLayer,
    });

    const analyzeDocument = new AnalyzeDocumentFunction(
      this,
      "AnalyzeDocument",
      {
        onboardingTableName:
          props.storageStack.onboardingRequestTable.tableName,
        analysisTableName: props.storageStack.analysisTable.tableName,
        commonLayer: props.commonLayer,
      }
    );

    // Create Step Function tasks
    const updateStatusTask = new tasks.LambdaInvoke(
      this,
      "Update Status to Checking",
      {
        lambdaFunction: updateStatus.function,
        payload: sfn.TaskInput.fromObject({
          "pk.$": "$[0].dynamodb.NewImage.pk.S",
          status: "CHECKING",
        }),
        outputPath: "$.Payload",
      }
    );

    const analyzeDocumentTask = new tasks.LambdaInvoke(
      this,
      "Analyze Document",
      {
        lambdaFunction: analyzeDocument.function,
        integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        payload: sfn.TaskInput.fromObject({
          requestId: sfn.JsonPath.stringAt("$.requestId"),
          taskToken: sfn.JsonPath.taskToken,
        }),
      }
    );

    const logAnalysisCompletion = new LogAnalysisCompletion(
      this,
      "LogAnalysisCompletion",
      {
        onboardingTable: props.storageStack.onboardingRequestTable,
        analysisTable: props.storageStack.analysisTable,
        commonLayer: props.commonLayer,
      }
    );

    const updateOnboardingStatus = new UpdateOnboardingStatusFunction(
      this,
      "UpdateOnboardingStatus",
      {
        tableName: props.storageStack.onboardingRequestTable.tableName,
        commonLayer: props.commonLayer,
      }
    );

    const logCompletionTask = new tasks.LambdaInvoke(
      this,
      "LogCompletionTask",
      {
        lambdaFunction: logAnalysisCompletion.function,
        payload: sfn.TaskInput.fromObject({
          "analysisId.$": "$.analysisId",
          "status.$": "$.status",
          "onboardingId.$": "$.onboardingId",
        }),
        resultPath: "$.logCompletion",
      }
    );

    const updateOnboardingStatusTask = new tasks.LambdaInvoke(
      this,
      "UpdateOnboardingStatusTask",
      {
        lambdaFunction: updateOnboardingStatus.function,
        payload: sfn.TaskInput.fromObject({
          "onboardingId.$": "$.onboardingId",
          "status.$": "$.status",
        }),
        resultPath: "$.updateStatus",
      }
    );

    // Create state machine definition with sequential tasks
    const definition = updateStatusTask
      .next(analyzeDocumentTask)
      .next(logCompletionTask)
      .next(updateOnboardingStatusTask);

    // Create state machine
    this.stateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
      logs: {
        destination: new cdk.aws_logs.LogGroup(this, "LogGroup", {
          retention: cdk.aws_logs.RetentionDays.TWO_WEEKS,
        }),
        level: sfn.LogLevel.ALL,
      },
    });

    // Add stack outputs
    new cdk.CfnOutput(this, "StateMachineArn", {
      value: this.stateMachine.stateMachineArn,
      description: "Onboarding workflow state machine ARN",
    });
  }
}
