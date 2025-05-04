import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { BaseStepFunction } from './base-step-function';
import { StepFunctionProps } from '../interfaces/step-function.interface';
import {
  IEventBridgeEventSource,
  EventBridgeRuleOptions,
} from '../interfaces/eventbridge-event-source.interface';

/**
 * Properties for EventBridge Step Functions
 */
export interface EventBridgeStepFunctionProps extends StepFunctionProps {
  /**
   * Whether to automatically set up the EventBridge rule when constructed
   */
  autoSetupEventBridgeRule?: boolean;
  
  /**
   * The EventBridge pattern to use (required if autoSetupEventBridgeRule is true)
   */
  eventPattern?: events.EventPattern;
  
  /**
   * Configuration options for the EventBridge rule
   */
  eventBridgeRuleOptions?: EventBridgeRuleOptions;
}

/**
 * Base class for Step Functions that can be triggered by EventBridge events
 */
export abstract class EventBridgeStepFunction extends BaseStepFunction implements IEventBridgeEventSource {
  constructor(scope: Construct, id: string, props: EventBridgeStepFunctionProps) {
    super(scope, id, props);
    
    // Automatically set up EventBridge rule if configured
    if (props.autoSetupEventBridgeRule && props.eventPattern) {
      this.setupEventBridgeRule(props.eventPattern, props.eventBridgeRuleOptions);
    }
  }
  
  /**
   * Set up an EventBridge rule to trigger the Step Function
   * 
   * @param pattern The event pattern to match
   * @param options Configuration options for the event rule
   * @returns The created EventBridge rule
   */
  public setupEventBridgeRule(pattern: events.EventPattern, options?: EventBridgeRuleOptions): events.Rule {
    // Generate rule name with optional suffix
    const ruleName = options?.ruleSuffix 
      ? `${this.stateMachineName}-${options.ruleSuffix}`
      : `${this.stateMachineName}-rule`;
    
    // Create the rule
    const rule = new events.Rule(this, 'EventRule', {
      ruleName,
      description: options?.description ?? `Rule for triggering ${this.stateMachineName}`,
      eventPattern: pattern,
    });
    
    // Create the target with optional input transformation
    let targetProps = {};
    
    // Handle input transformation if provided
    if (options?.transformation) {
      if (options.transformation.inputTemplate) {
        targetProps = {
          ...targetProps,
          input: events.RuleTargetInput.fromText(options.transformation.inputTemplate),
        };
      }
    }
    
    // Add the target to the rule
    rule.addTarget(new targets.SfnStateMachine(this.stateMachine, targetProps));
    
    return rule;
  }
} 