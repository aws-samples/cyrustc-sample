import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { IStepFunction, StepFunctionProps } from '../interfaces/step-function.interface';
import { DynamoDBStack } from '../../../lib/stacks/dynamodb.stack';

/**
 * Base class for all Step Functions
 */
export abstract class BaseStepFunction extends Construct implements IStepFunction {
  /**
   * The underlying Step Function state machine
   */
  public readonly stateMachine: sfn.StateMachine;
  
  /**
   * The name of the state machine
   */
  public readonly stateMachineName: string;
  
  /**
   * The Lambda layer to use for functions
   */
  protected readonly layer: lambda.LayerVersion;
  
  /**
   * Reference to the DynamoDB stack
   */
  protected readonly dynamodbStack: DynamoDBStack;
  
  constructor(scope: Construct, id: string, props: StepFunctionProps) {
    super(scope, id);
    
    // Store common properties
    this.layer = props.layer;
    this.dynamodbStack = props.dynamodbStack;
    
    // Generate state machine name
    this.stateMachineName = `${props.prefix}-${this.node.id.toLowerCase()}-${props.environment}`;
    
    // Create CloudWatch log group for state machine execution logs
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/vendedlogs/states/${this.stateMachineName}`,
      retention: props.environment === 'prod' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });
    
    // Create dependencies (Lambda functions, etc.) before creating the workflow
    this.createDependencies();
    
    // Create workflow definition
    const workflowDefinition = this.createWorkflowDefinition();
    
    // Create state machine with workflow definition
    this.stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      stateMachineName: this.stateMachineName,
      definitionBody: sfn.DefinitionBody.fromChainable(workflowDefinition),
      tracingEnabled: props.tracingEnabled ?? true,
      stateMachineType: props.stateMachineType ?? sfn.StateMachineType.STANDARD,
      logs: {
        destination: logGroup,
        level: props.logLevel ?? sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });
    
    // Apply tags
    this.applyTags(props);
    
    // Setup event sources and additional resources
    this.setupResources();
  }
  
  /**
   * Create dependencies required for the workflow
   * This is called before creating the workflow definition
   * Implementations should override this to create Lambda functions and other dependencies
   */
  protected createDependencies(): void {
    // Base implementation does nothing
  }
  
  /**
   * Create the workflow definition for the Step Function
   * This must be implemented by derived classes
   * 
   * @returns The Step Function workflow definition
   */
  protected abstract createWorkflowDefinition(): sfn.IChainable;
  
  /**
   * Setup additional resources after the state machine is created
   * Implementations can override this to set up event sources, etc.
   */
  protected setupResources(): void {
    // Base implementation does nothing
  }
  
  /**
   * Apply standard and custom tags to the state machine
   * 
   * @param props Step Function properties
   */
  private applyTags(props: StepFunctionProps): void {
    // Apply standard tags
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Service', 'StepFunction');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    
    // Apply custom tags
    if (props.tags) {
      for (const [key, value] of Object.entries(props.tags)) {
        cdk.Tags.of(this).add(key, value);
      }
    }
  }
} 