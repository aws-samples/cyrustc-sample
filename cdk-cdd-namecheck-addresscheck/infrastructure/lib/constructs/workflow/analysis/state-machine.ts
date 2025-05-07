import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import { ExtractPdfMetadataFunction } from "./functions/extract-pdf-metadata";
import { ExtractPdfContentFunction } from "./functions/extract-pdf-content";
import { UpdateStatusFunction } from "./functions/update-status";
import { CallbackFunction } from "./functions/callback";
import { AnalyzeFunction } from "./functions/analyze";

interface AnalysisStateMachineProps {
  tableName: string;
  bucketName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class AnalysisStateMachine extends Construct {
  public readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: AnalysisStateMachineProps) {
    super(scope, id);

    // Create Lambda functions with layer
    const extractPdfMetadataFunction = new ExtractPdfMetadataFunction(
      this,
      "ExtractPdfMetadataFunction",
      {
        tableName: props.tableName,
        bucketName: props.bucketName,
        commonLayer: props.commonLayer,
      }
    );

    const extractPdfContentFunction = new ExtractPdfContentFunction(
      this,
      "ExtractPdfContentFunction",
      {
        tableName: props.tableName,
        bucketName: props.bucketName,
        commonLayer: props.commonLayer,
      }
    );

    const updateStatusFunction = new UpdateStatusFunction(
      this,
      "UpdateStatusFunction",
      {
        tableName: props.tableName,
        commonLayer: props.commonLayer,
      }
    );

    const callbackFunction = new CallbackFunction(this, "CallbackFunction", {
      tableName: props.tableName,
      commonLayer: props.commonLayer,
    });

    const analyzeFunction = new AnalyzeFunction(this, "AnalyzeFunction", {
      tableName: props.tableName,
      commonLayer: props.commonLayer,
    });

    // Create error handler
    const updateToError = new tasks.LambdaInvoke(this, "UpdateToErrorTask", {
      lambdaFunction: updateStatusFunction.function,
      payload: sfn.TaskInput.fromObject({
        analysisId: sfn.JsonPath.stringAt(
          "$[0].dynamodb.NewImage.analysisId.S"
        ),
        status: "ERROR",
      }),
    });

    // Define state machine tasks
    const updateToProcessing = new tasks.LambdaInvoke(
      this,
      "UpdateToProcessingTask",
      {
        lambdaFunction: updateStatusFunction.function,
        payload: sfn.TaskInput.fromObject({
          analysisId: sfn.JsonPath.stringAt(
            "$[0].dynamodb.NewImage.analysisId.S"
          ),
          status: "STARTED",
        }),
        outputPath: "$.Payload",
      }
    ).addCatch(updateToError, {
      resultPath: "$.error",
    });

    const extractPdfMetadata = new tasks.LambdaInvoke(
      this,
      "ExtractPdfMetadataTask",
      {
        lambdaFunction: extractPdfMetadataFunction.function,
        payload: sfn.TaskInput.fromObject({
          analysisId: sfn.JsonPath.stringAt("$.analysisId"),
          objectsData: sfn.JsonPath.stringAt("$.objectsData"),
        }),
        outputPath: "$.Payload",
      }
    ).addCatch(updateToError, {
      resultPath: "$.error",
    });

    // Create Map state for processing pages
    const processPages = new sfn.Map(this, "ProcessPagesMap", {
      maxConcurrency: 1,
      itemsPath: "$.pageTasks",
      parameters: {
        "analysisId.$": "$.analysisId",
        "objectKey.$": "$$.Map.Item.Value.objectKey",
        "pageNumber.$": "$$.Map.Item.Value.pageNumber",
        "totalPages.$": "$$.Map.Item.Value.totalPages",
      },
      resultPath: "$.processedPages",
    });

    const extractPageContent = new tasks.LambdaInvoke(
      this,
      "ExtractPageContentTask",
      {
        lambdaFunction: extractPdfContentFunction.function,
        payload: sfn.TaskInput.fromObject({
          analysisId: sfn.JsonPath.stringAt("$.analysisId"),
          objectKey: sfn.JsonPath.stringAt("$.objectKey"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
          totalPages: sfn.JsonPath.stringAt("$.totalPages"),
        }),
        outputPath: "$.Payload",
        retryOnServiceExceptions: true,
      }
    ).addRetry({
      backoffRate: 2,
      interval: cdk.Duration.seconds(30),
      maxAttempts: 10,
      maxDelay: cdk.Duration.seconds(120),
      jitterStrategy: sfn.JitterType.FULL,
    });

    // Set Map state iterator
    processPages.iterator(extractPageContent);

    const analyze = new tasks.LambdaInvoke(this, "AnalyzeTask", {
      lambdaFunction: analyzeFunction.function,
      payload: sfn.TaskInput.fromObject({
        analysisId: sfn.JsonPath.stringAt("$.analysisId"),
      }),
      outputPath: "$.Payload",
      retryOnServiceExceptions: true,
    })
      .addRetry({
        backoffRate: 2,
        interval: cdk.Duration.seconds(30),
        maxAttempts: 10,
        maxDelay: cdk.Duration.seconds(120),
        jitterStrategy: sfn.JitterType.FULL,
      })
      .addCatch(updateToError, {
        resultPath: "$.error",
      });

    const updateToProcessed = new tasks.LambdaInvoke(
      this,
      "UpdateToProcessedTask",
      {
        lambdaFunction: updateStatusFunction.function,
        payload: sfn.TaskInput.fromObject({
          analysisId: sfn.JsonPath.stringAt("$.analysisId"),
          status: "COMPLETED",
        }),
        outputPath: "$.Payload",
      }
    ).addCatch(updateToError, {
      resultPath: "$.error",
    });

    // Add task to send callback using the same Lambda
    const sendCallback = new tasks.LambdaInvoke(this, "SendCallback", {
      lambdaFunction: callbackFunction.function,
      payload: sfn.TaskInput.fromObject({
        analysisId: sfn.JsonPath.stringAt("$.analysisId"),
        status: "COMPLETED",
      }),
    });

    // Create state machine definition
    const definition = sfn.Chain.start(updateToProcessing)
      .next(extractPdfMetadata)
      .next(processPages)
      .next(analyze)
      .next(updateToProcessed)
      .next(sendCallback);

    // Create state machine
    this.stateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.STANDARD,
      logs: {
        destination: new cdk.aws_logs.LogGroup(this, "StateMachineLogs", {
          retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });
  }
}
