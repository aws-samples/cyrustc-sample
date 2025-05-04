import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RestApiGateway } from '../../lib/api/rest-api-gateway.construct';

/**
 * Base props for all API construct implementations
 */
export interface BaseApiResourceProps {
  /** The parent API Gateway */
  api: RestApiGateway;
  /** Common Lambda layer with shared dependencies */
  layer: lambda.LayerVersion;
  /** Optional parent resource path */
  parentResource?: apigateway.Resource;
}

/**
 * Options for API method configuration
 */
export interface ApiMethodOptions {
  /** Lambda function to handle the request */
  lambdaFunction: lambda.Function;
  /** Optional request validator */
  requestValidator?: apigateway.RequestValidator;
  /** Optional request models for validation */
  requestModels?: {
    [contentType: string]: apigateway.Model;
  };
  /** Optional request parameters */
  requestParameters?: {
    [parameter: string]: boolean;
  };
  /** Optional authorizer for protected endpoints */
  authorizer?: apigateway.IAuthorizer;
  /** Optional authorization type */
  authorizationType?: apigateway.AuthorizationType;
}

/**
 * Schema for API request models
 */
export interface ApiModelSchema {
  /** Required properties */
  required?: string[];
  /** Property definitions */
  properties: {
    [name: string]: {
      type: apigateway.JsonSchemaType;
      description?: string;
    };
  };
}

/**
 * Options for creating an API model
 */
export interface ApiModelOptions {
  /** Model name */
  modelName: string;
  /** Content type */
  contentType: string;
  /** Schema definition */
  schema: ApiModelSchema;
}

/**
 * Properties for Lambda function creation
 */
export interface LambdaFunctionOptions {
  /** Path to the Lambda function code */
  entryPath: string;
  /** Environment variables */
  environment?: Record<string, string>;
  /** Function timeout in seconds */
  timeout?: number;
  /** Function memory size in MB */
  memorySize?: number;
} 