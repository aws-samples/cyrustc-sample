import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiStack } from "./stacks/api-stack";
import { StorageStack } from "./stacks/storage-stack";
import { SecurityStack } from "./stacks/security-stack";
import { WorkflowStack } from "./stacks/workflow-stack";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Storage Stack
    const storageStack = new StorageStack(this, "StorageStack", {
      env: props?.env,
    });

    // Create API Stack with storage stack reference
    const apiStack = new ApiStack(this, "ApiStack", {
      stageName: "prod",
      storageStack: storageStack,
      env: props?.env,
    });

    // Create Workflow Stack with storage stack reference
    const workflowStack = new WorkflowStack(this, "WorkflowStack", {
      storageStack: storageStack,
      env: props?.env,
    });

    // Create Security Stack
    const securityStack = new SecurityStack(this, "SecurityStack", {
      apiId: apiStack.api.restApiId,
      apiArn: apiStack.api.arnForExecuteApi(),
      stageName: "prod",
      env: props?.env,
    });

    // Add dependencies
    securityStack.addDependency(apiStack);
    workflowStack.addDependency(storageStack);
  }
}
