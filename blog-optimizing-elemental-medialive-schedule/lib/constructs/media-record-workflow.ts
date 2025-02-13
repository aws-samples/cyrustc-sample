import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { MediaWorkflow } from './media-workflow';

interface MediaRecordWorkflowProps {
  mediaWorkflow: MediaWorkflow;
  table: dynamodb.Table;
}

export class MediaRecordWorkflow extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  private readonly validationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: MediaRecordWorkflowProps) {
    super(scope, id);

    // Create Scheduler Group
    new cdk.CfnResource(this, 'MediaSchedulerGroup', {
      type: 'AWS::Scheduler::ScheduleGroup',
      properties: {
        Name: 'media-scheduler',
      },
    });

    // Create validation Lambda
    this.validationFunction = new lambda.Function(this, 'ValidationFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/validation'),
      timeout: cdk.Duration.seconds(30),
    });

    // Create Pass state to select first record
    const selectFirstRecord = new sfn.Pass(this, 'Select First Record', {
      parameters: {
        'eventID.$': '$[0].eventID',
        'eventName.$': '$[0].eventName',
        'eventVersion.$': '$[0].eventVersion',
        'eventSource.$': '$[0].eventSource',
        'awsRegion.$': '$[0].awsRegion',
        'dynamodb.$': '$[0].dynamodb',
        'eventSourceARN.$': '$[0].eventSourceARN',
      },
    });

    // Create Choice state for DynamoDB stream events (simplified)
    const choice = new sfn.Choice(this, 'Choice')
      .when(sfn.Condition.stringEquals('$.eventName', 'INSERT'), this.createNewRecordFlow(props))
      .when(sfn.Condition.stringEquals('$.eventName', 'MODIFY'), this.createModifyRecordFlow(props))
      .when(sfn.Condition.stringEquals('$.eventName', 'REMOVE'), this.createDeleteRecordFlow(props));

    // Create the state machine with Pass state as the first step
    this.stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: selectFirstRecord.next(choice),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
      },
    });

    // Grant Step Function permission to pass the scheduler role
    this.stateMachine.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [props.mediaWorkflow.schedulerRole.roleArn],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'scheduler.amazonaws.com',
          },
        },
      }),
    );

    // Also grant permission to create/delete schedules
    this.stateMachine.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['scheduler:CreateSchedule', 'scheduler:DeleteSchedule', 'scheduler:GetSchedule', 'scheduler:UpdateSchedule'],
        resources: ['*'],
      }),
    );

    // Create IAM role for EventBridge Pipe
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    // Grant permissions to read from DynamoDB Stream
    props.table.grantStreamRead(pipeRole);

    // Grant permissions to invoke Step Function
    this.stateMachine.grantStartExecution(pipeRole);

    // Create EventBridge Pipe
    new pipes.CfnPipe(this, 'StreamProcessor', {
      name: 'MediaSchedulerStreamProcessor',
      source: props.table.tableStreamArn!,
      target: this.stateMachine.stateMachineArn,
      roleArn: pipeRole.roleArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
          maximumRetryAttempts: 3,
          maximumRecordAgeInSeconds: 60,
        },
        filterCriteria: {
          filters: [
            {
              // Handle INSERT events
              pattern: JSON.stringify({
                eventName: ['INSERT'],
              }),
            },
            {
              // Handle DELETE events
              pattern: JSON.stringify({
                eventName: ['REMOVE'],
              }),
            },
            {
              // Handle MODIFY events only when relevant fields change
              pattern: JSON.stringify({
                eventName: ['MODIFY'],
                dynamodb: {
                  NewImage: {
                    mediaChannelId: [{ exists: true }],
                  },
                },
              }),
            },
            {
              pattern: JSON.stringify({
                eventName: ['MODIFY'],
                dynamodb: {
                  NewImage: {
                    startDateTime: [{ exists: true }],
                  },
                },
              }),
            },
            {
              pattern: JSON.stringify({
                eventName: ['MODIFY'],
                dynamodb: {
                  NewImage: {
                    endDateTime: [{ exists: true }],
                  },
                },
              }),
            },
          ],
        },
      },
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
    });

    // Add additional permissions to the pipe role
    pipeRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
        resources: [props.table.tableStreamArn!],
      }),
    );
  }

  private createScheduleTask(props: MediaRecordWorkflowProps, id: string): tasks.CallAwsService {
    return new tasks.CallAwsService(this, id, {
      service: 'scheduler',
      action: 'createSchedule',
      parameters: {
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
        Name: sfn.JsonPath.stringAt('$.scheduleName'),
        ScheduleExpression: sfn.JsonPath.stringAt('$.scheduleExpression'),
        Target: {
          Arn: props.mediaWorkflow.stateMachine.stateMachineArn,
          RoleArn: props.mediaWorkflow.schedulerRole.roleArn,
          Input: sfn.JsonPath.stringAt('$.workflowInput'),
        },
        GroupName: 'media-scheduler',
        State: 'ENABLED',
        ScheduleExpressionTimezone: 'UTC',
        ActionAfterCompletion: 'DELETE',
      },
      iamResources: ['*'],
      resultPath: '$.ResponseDetails',
    });
  }

  private createNewRecordFlow(props: MediaRecordWorkflowProps): sfn.IChainable {
    const validateNewRecord = new tasks.LambdaInvoke(this, 'Data Validation (New Record)', {
      lambdaFunction: this.validationFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    // Add Choice state to handle validation result
    const handleValidationResult = new sfn.Choice(this, 'Handle Validation Result')
      .when(
        sfn.Condition.booleanEquals('$.isValid', true),
        this.createScheduleTask(props, 'Create Eventbridge Schedule (New)')
          .next(
            new sfn.Pass(this, 'Combine Schedule Response', {
              parameters: {
                'record.$': '$.record',
                'scheduleName.$': '$.scheduleName',
                'scheduleExpression.$': '$.scheduleExpression',
                'workflowInput.$': '$.workflowInput',
                'ResponseDetails.$': '$.ResponseDetails',
              },
            }),
          )
          .next(
            new tasks.DynamoUpdateItem(this, 'Store Scheduler Info', {
              table: props.table,
              key: {
                mediaChannelId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.mediaChannelId')),
                startDateTime: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.startDateTime')),
              },
              updateExpression: 'SET schedulerArn = :schedulerArn, schedulerName = :schedulerName',
              expressionAttributeValues: {
                ':schedulerArn': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.ResponseDetails.ScheduleArn')),
                ':schedulerName': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.scheduleName')),
              },
              resultPath: sfn.JsonPath.DISCARD,
            }),
          ),
      )
      .otherwise(
        // Handle validation error
        new tasks.DynamoUpdateItem(this, 'Store Validation Error', {
          table: props.table,
          key: {
            mediaChannelId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.mediaChannelId')),
            startDateTime: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.startDateTime')),
          },
          updateExpression: 'SET #status = :status, errorMessage = :error',
          expressionAttributeNames: {
            '#status': 'status',
          },
          expressionAttributeValues: {
            ':status': tasks.DynamoAttributeValue.fromString('ERROR'),
            ':error': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.error')),
          },
          resultPath: sfn.JsonPath.DISCARD,
        }).next(new sfn.Succeed(this, 'End After Validation Error')),
      );

    return validateNewRecord.next(handleValidationResult);
  }

  private createModifyRecordFlow(props: MediaRecordWorkflowProps): sfn.IChainable {
    // We can directly start with validation since filtering is done by the pipe
    return this.createModifyScheduleFlow(props);
  }

  private createModifyScheduleFlow(props: MediaRecordWorkflowProps): sfn.IChainable {
    const validateExistingRecord = new tasks.LambdaInvoke(this, 'Data Validation (Existing Record)', {
      lambdaFunction: this.validationFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    // Get existing scheduler ARN
    const getExistingItem = new tasks.DynamoGetItem(this, 'Get Existing Schedule Info', {
      table: props.table,
      key: {
        mediaChannelId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.dynamodb.OldImage.mediaChannelId.S')),
        startDateTime: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.dynamodb.OldImage.startDateTime.S')),
      },
      resultPath: '$.existingItem',
    });

    const deleteSchedule = new tasks.CallAwsService(this, 'Delete Existing Schedule (via Update)', {
      service: 'scheduler',
      action: 'deleteSchedule',
      parameters: {
        Name: sfn.JsonPath.stringAt('$.dynamodb.OldImage.schedulerName.S'),
        GroupName: 'media-scheduler',
      },
      iamResources: ['*'],
      resultPath: sfn.JsonPath.DISCARD,
    });

    const stopExecution = new tasks.CallAwsService(this, 'Stop Execution (via Update)', {
      service: 'sfn',
      action: 'stopExecution',
      parameters: {
        ExecutionArn: sfn.JsonPath.stringAt('$.existingItem.Item.workflowId.S'),
      },
      iamResources: ['*'],
      resultPath: sfn.JsonPath.DISCARD,
    });

    const createSchedule = this.createScheduleTask(props, 'Create Eventbridge Schedule (Update)');

    // Store new scheduler ARN
    const updateSchedulerArn = new tasks.DynamoUpdateItem(this, 'Store New Scheduler ARN', {
      table: props.table,
      key: {
        mediaChannelId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.mediaChannelId')),
        startDateTime: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.record.startDateTime')),
      },
      updateExpression: 'SET schedulerArn = :schedulerArn',
      expressionAttributeValues: {
        ':schedulerArn': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.ResponseDetails.ScheduleArn')),
      },
      resultPath: sfn.JsonPath.DISCARD,
    });

    return validateExistingRecord.next(getExistingItem).next(deleteSchedule).next(stopExecution).next(createSchedule).next(updateSchedulerArn);
  }

  private createDeleteRecordFlow(props: MediaRecordWorkflowProps): sfn.IChainable {
    // Create the workflow check state first
    const stopExecution = new tasks.CallAwsService(this, 'Stop Execution (via Delete)', {
      service: 'sfn',
      action: 'stopExecution',
      parameters: {
        ExecutionArn: sfn.JsonPath.stringAt('$.dynamodb.OldImage.workflowId.S'),
      },
      iamResources: ['*'],
      resultPath: sfn.JsonPath.DISCARD,
    });

    const checkWorkflowExists = new sfn.Choice(this, 'Check Workflow Exists')
      .when(sfn.Condition.isPresent('$.dynamodb.OldImage.workflowId.S'), stopExecution)
      .otherwise(new sfn.Succeed(this, 'Skip Stop Execution'));

    // Then create the scheduler check state
    const deleteSchedule = new tasks.CallAwsService(this, 'Delete Existing Schedule (via Delete)', {
      service: 'scheduler',
      action: 'deleteSchedule',
      parameters: {
        Name: sfn.JsonPath.stringAt('$.dynamodb.OldImage.schedulerName.S'),
        GroupName: 'media-scheduler',
      },
      iamResources: ['*'],
      resultPath: sfn.JsonPath.DISCARD,
    });

    const checkSchedulerExists = new sfn.Choice(this, 'Check Scheduler Exists')
      .when(sfn.Condition.isPresent('$.dynamodb.OldImage.schedulerName.S'), deleteSchedule.next(checkWorkflowExists))
      .otherwise(new sfn.Pass(this, 'Skip Schedule Delete').next(checkWorkflowExists));

    return checkSchedulerExists;
  }
}
