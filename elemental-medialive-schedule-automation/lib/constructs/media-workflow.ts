import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface MediaWorkflowProps {
  table: dynamodb.Table;
  notificationEmail?: string;
}

export class MediaWorkflow extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly notificationTopic: sns.Topic;
  public readonly schedulerRole: iam.Role;

  constructor(scope: Construct, id: string, props: MediaWorkflowProps) {
    super(scope, id);

    // Create SNS topic for notifications
    this.notificationTopic = new sns.Topic(this, 'MediaChannelNotifications', {
      displayName: 'Media Channel Status Notifications',
    });

    // Add email subscription if provided
    if (props.notificationEmail) {
      this.notificationTopic.addSubscription(new subscriptions.EmailSubscription(props.notificationEmail));
    }

    // Create EventBridge Scheduler role
    this.schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      description: 'Role for EventBridge Scheduler to invoke Step Functions',
    });

    // Create Step Function states
    const updateWorkflowId = new tasks.DynamoUpdateItem(this, 'Update Workflow ID', {
      table: props.table,
      key: {
        mediaChannelId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.mediaChannelId')),
        startDateTime: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.startDateTime')),
      },
      updateExpression: 'SET workflowId = :workflowId',
      expressionAttributeValues: {
        ':workflowId': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.Execution.Id')),
      },
      resultPath: sfn.JsonPath.DISCARD,
    });

    const startChannel = new tasks.CallAwsService(this, 'Start Channel', {
      service: 'medialive',
      action: 'startChannel',
      parameters: {
        ChannelId: sfn.JsonPath.stringAt('$.mediaChannelId'),
      },
      iamResources: ['*'],
      resultPath: '$.channelInfo',
    });

    const waitForChannelStart = new sfn.Wait(this, 'Wait for channel being started', {
      time: sfn.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const checkChannelState = new tasks.CallAwsService(this, 'Check Channel State', {
      service: 'medialive',
      action: 'describeChannel',
      parameters: {
        ChannelId: sfn.JsonPath.stringAt('$.channelInfo.Id'),
      },
      iamResources: ['*'],
      resultPath: '$.ChannelState',
    });

    const publishStartingNotification = new tasks.SnsPublish(this, 'Publish Starting Notification', {
      topic: this.notificationTopic,
      message: sfn.TaskInput.fromObject({
        status: 'STARTING',
        channelId: sfn.JsonPath.stringAt('$.mediaChannelId'),
        startDateTime: sfn.JsonPath.stringAt('$.startDateTime'),
        endDateTime: sfn.JsonPath.stringAt('$.endDateTime'),
      }),
      subject: 'MediaLive Channel Starting',
      resultPath: '$.NotificationResult',
    });

    const publishStartedNotification = new tasks.SnsPublish(this, 'Publish Started Notification', {
      topic: this.notificationTopic,
      message: sfn.TaskInput.fromObject({
        status: 'STARTED',
        channelId: sfn.JsonPath.stringAt('$.mediaChannelId'),
        startDateTime: sfn.JsonPath.stringAt('$.startDateTime'),
        endDateTime: sfn.JsonPath.stringAt('$.endDateTime'),
        channelInfo: sfn.JsonPath.stringAt('$.channelInfo'),
      }),
      subject: 'MediaLive Channel Started',
      resultPath: '$.NotificationResult',
    });

    const waitUntilEndTime = new sfn.Wait(this, 'Wait until end date time', {
      time: sfn.WaitTime.timestampPath('$.endDateTime'),
    });

    const stopChannel = new tasks.CallAwsService(this, 'Stop Channel', {
      service: 'medialive',
      action: 'stopChannel',
      parameters: {
        ChannelId: sfn.JsonPath.stringAt('$.channelInfo.Id'),
      },
      iamResources: ['*'],
      resultPath: '$.stopChannelResult',
    });

    const waitForChannelStop = new sfn.Wait(this, 'Wait until channel being stopped', {
      time: sfn.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const checkChannelStateForStop = new tasks.CallAwsService(this, 'Describe Channel for Stop', {
      service: 'medialive',
      action: 'describeChannel',
      parameters: {
        ChannelId: sfn.JsonPath.stringAt('$.channelInfo.Id'),
      },
      iamResources: ['*'],
      resultPath: '$.ChannelState',
    });

    const publishStoppedNotification = new tasks.SnsPublish(this, 'Publish Stopped Notification', {
      topic: this.notificationTopic,
      message: sfn.TaskInput.fromObject({
        status: 'STOPPED',
        channelId: sfn.JsonPath.stringAt('$.mediaChannelId'),
        startDateTime: sfn.JsonPath.stringAt('$.startDateTime'),
        endDateTime: sfn.JsonPath.stringAt('$.endDateTime'),
        channelInfo: sfn.JsonPath.stringAt('$.channelInfo'),
      }),
      subject: 'MediaLive Channel Stopped',
      resultPath: '$.NotificationResult',
    });

    // Create health check lambda
    const healthCheckLambda = new lambda.Function(this, 'HealthCheckFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/health-check'),
      timeout: cdk.Duration.seconds(30),
    });

    // Create health check task
    const checkChannelHealth = new tasks.LambdaInvoke(this, 'Check Channel Health', {
      lambdaFunction: healthCheckLambda,
      payloadResponseOnly: true,
    });

    // Create unhealthy notification task
    const publishUnhealthyNotification = new tasks.SnsPublish(this, 'Publish Unhealthy Notification', {
      topic: this.notificationTopic,
      message: sfn.TaskInput.fromObject({
        status: 'UNHEALTHY',
        channelId: sfn.JsonPath.stringAt('$.mediaChannelId'),
        startDateTime: sfn.JsonPath.stringAt('$.startDateTime'),
        endDateTime: sfn.JsonPath.stringAt('$.endDateTime'),
        details: sfn.JsonPath.stringAt('$.details'),
      }),
      subject: 'MediaLive Channel Health Check Failed',
      resultPath: '$.NotificationResult',
    });

    // Create Choice state for health check result
    const checkHealthStatus = new sfn.Choice(this, 'Check Health Status')
      .when(sfn.Condition.stringEquals('$.status', 'Healthy'), publishStartedNotification)
      .otherwise(publishUnhealthyNotification.next(waitForChannelStart));

    // Modify the existing workflow to include health check
    const checkRunningState = new sfn.Choice(this, 'Get Channel State (Running)')
      .when(sfn.Condition.stringEquals('$.ChannelState.State', 'RUNNING'), checkChannelHealth.next(checkHealthStatus))
      .otherwise(publishStartingNotification);

    const checkStoppedState = new sfn.Choice(this, 'Get Channel State (Stopping)')
      .when(sfn.Condition.stringEquals('$.ChannelState.State', 'IDLE'), publishStoppedNotification)
      .otherwise(waitForChannelStop);

    // Chain the steps together
    const definition = updateWorkflowId.next(startChannel).next(waitForChannelStart).next(checkChannelState).next(checkRunningState);

    publishStartingNotification.next(waitForChannelStart);
    publishStartedNotification.next(waitUntilEndTime);
    waitUntilEndTime.next(stopChannel);
    stopChannel.next(waitForChannelStop);
    waitForChannelStop.next(checkChannelStateForStop);
    checkChannelStateForStop.next(checkStoppedState);

    // Create the state machine
    this.stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.hours(24),
    });

    // Grant the scheduler role permission to invoke Step Functions
    this.schedulerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['states:StartExecution'],
        resources: [this.stateMachine.stateMachineArn],
      }),
    );
  }
}
