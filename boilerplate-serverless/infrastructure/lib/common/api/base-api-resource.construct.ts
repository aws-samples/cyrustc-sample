import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BaseApiResourceProps, ApiMethodOptions, ApiModelOptions } from './interfaces';
import { LambdaPythonFunction } from '../lambda-python.construct';
import { RestApiGateway } from '../../api/rest-api-gateway.construct';

/**
 * Base class for API resource constructs
 * Provides common functionality for creating API resources and methods
 */
export abstract class BaseApiResource extends Construct {
  /** The API Gateway instance */
  protected api: apigateway.RestApi;
  /** The Lambda layer with common dependencies */
  protected layer: lambda.LayerVersion;
  /** The API resource for this endpoint */
  protected resource: apigateway.Resource;
  /** Common request validator for all methods */
  protected defaultValidator: apigateway.RequestValidator;
  /** The REST API Gateway construct */
  protected restApiGateway: RestApiGateway;

  /**
   * Creates a new API resource
   * @param scope Parent construct
   * @param id Construct ID
   * @param props Configuration properties
   */
  constructor(scope: Construct, id: string, props: BaseApiResourceProps) {
    super(scope, id);
    
    this.restApiGateway = props.api;
    this.api = props.api.api;
    this.layer = props.layer;
    
    // Create API resource
    const parentResource = props.parentResource || this.api.root;
    this.resource = parentResource.addResource(this.getResourceName());
    
    // Create default request validator
    this.defaultValidator = new apigateway.RequestValidator(this, `${id}Validator`, {
      restApi: this.api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });
    
    // NOTE: initialize() is no longer called here automatically
    // Subclasses should call this.initialize() at the end of their constructor
  }
  
  /**
   * Returns the name of the API resource
   */
  protected abstract getResourceName(): string;
  
  /**
   * Initializes the resource with routes and methods
   * This should be called by the subclass constructor after all properties are set
   */
  protected abstract initialize(): void;
  
  /**
   * Creates a Lambda function for the API
   * @param id Function ID
   * @param options Function configuration
   * @returns The created Lambda function
   */
  protected createLambdaFunction(id: string, options: { 
    entryPath: string, 
    environment?: Record<string, string>,
    timeout?: cdk.Duration,
    memorySize?: number
  }): LambdaPythonFunction {
    return new LambdaPythonFunction(this, id, {
      entry: options.entryPath,
      layer: this.layer,
      environment: options.environment || {},
      timeout: options.timeout,
      memorySize: options.memorySize
    });
  }
  
  /**
   * Creates a request model for validation
   * @param id Model ID
   * @param options Model configuration
   * @returns The created model
   */
  protected createRequestModel(id: string, options: ApiModelOptions): apigateway.Model {
    return this.api.addModel(id, {
      contentType: options.contentType,
      modelName: options.modelName,
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: options.schema.required || [],
        properties: options.schema.properties
      }
    });
  }
} 