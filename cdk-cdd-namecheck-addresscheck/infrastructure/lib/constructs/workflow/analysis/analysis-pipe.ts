import * as cdk from "aws-cdk-lib";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface AnalysisPipeProps {
  table: cdk.aws_dynamodb.ITable;
  stateMachine: cdk.aws_stepfunctions.IStateMachine;
}

export class AnalysisPipe extends Construct {
  constructor(scope: Construct, id: string, props: AnalysisPipeProps) {
    super(scope, id);

    // Create role for the pipe
    const pipeRole = new iam.Role(this, "PipeRole", {
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
      description:
        "Role for EventBridge Pipe to process DynamoDB Stream events",
    });

    // Grant permissions to read from DynamoDB stream
    props.table.grantStreamRead(pipeRole);

    // Grant permissions to start execution of Step Function
    props.stateMachine.grantStartExecution(pipeRole);

    // Create the pipe
    new pipes.CfnPipe(this, "Pipe", {
      name: "AnalysisStatusPipe",
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
                      S: ["STARTED"],
                    },
                    sk: {
                      S: ["METADATA"],
                    },
                  },
                  OldImage: {
                    status: {
                      S: ["CREATED"],
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
