import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

/**
 * Configuration options for EventBridge event source
 */
export interface EventBridgeRuleOptions {
  /**
   * Name suffix for the EventBridge rule
   */
  ruleSuffix?: string;
  
  /**
   * Description for the EventBridge rule
   */
  description?: string;
  
  /**
   * Input transformation options
   */
  transformation?: {
    /**
     * Input path for events
     */
    inputPath?: string;
    
    /**
     * Input template for transforming events
     */
    inputTemplate?: string;
  };
}

/**
 * Interface for Step Functions that can be triggered by EventBridge events
 */
export interface IEventBridgeEventSource {
  /**
   * Set up an EventBridge rule to trigger the Step Function
   * 
   * @param pattern The event pattern to match
   * @param options Configuration options for the event rule
   * @returns The created EventBridge rule
   */
  setupEventBridgeRule(pattern: events.EventPattern, options?: EventBridgeRuleOptions): events.Rule;
} 