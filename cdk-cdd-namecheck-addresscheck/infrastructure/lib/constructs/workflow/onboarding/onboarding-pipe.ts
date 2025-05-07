import * as cdk from "aws-cdk-lib";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface OnboardingPipeProps {
  table: cdk.aws_dynamodb.ITable;
  stateMachine: cdk.aws_stepfunctions.IStateMachine;
}

export class OnboardingPipe extends Construct {
  constructor(scope: Construct, id: string, props: OnboardingPipeProps) {
    super(scope, id);

    // Create role for the pipe
    const pipeRole = new iam.Role(this, "PipeRole", {
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
      description: "Role for EventBridge Pipe to process onboarding requests",
    });

    // Grant permissions
    props.table.grantStreamRead(pipeRole);
    props.stateMachine.grantStartExecution(pipeRole);

    // Create the pipe
    new pipes.CfnPipe(this, "Pipe", {
      name: "OnboardingRequestPipe",
      roleArn: pipeRole.roleArn,
      source: props.table.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: "LATEST",
          batchSize: 1,
        },
        filterCriteria: {
          filters: [
            {
              pattern: JSON.stringify({
                dynamodb: {
                  NewImage: {
                    status: {
                      S: ["NEW"],
                    },
                  },
                },
              }),
            },
          ],
        },
      },
      target: props.stateMachine.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: "FIRE_AND_FORGET",
        },
      },
    });
  }
}
