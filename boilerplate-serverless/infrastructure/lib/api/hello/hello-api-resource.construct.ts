import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { BaseApiResource } from '../../common/api/base-api-resource.construct';
import { BaseApiResourceProps } from '../../common/api/interfaces';
import { RestApiGateway } from '../rest-api-gateway.construct';

/**
 * Properties for the HelloApiResource construct
 */
export interface HelloApiResourceProps extends BaseApiResourceProps {
  /** DynamoDB table for storing hello world data */
  table: dynamodb.Table;
}

/**
 * API resource for Hello API endpoints
 */
export class HelloApiResource extends BaseApiResource {
  private readonly table: dynamodb.Table;

  constructor(scope: any, id: string, props: HelloApiResourceProps) {
    super(scope, id, props);
    this.table = props.table;
    
    // Initialize after all properties are set
    this.initialize();
  }

  /**
   * Returns the resource name for the API
   */
  protected getResourceName(): string {
    return 'hello';
  }

  /**
   * Initialize the resource with routes and methods
   */
  protected initialize(): void {
    // Create subresources directly with unique logical IDs
    const helloWorldResource = this.resource.addResource('hello-world', {
      defaultMethodOptions: {
        requestParameters: {
          'method.request.querystring.id': true,
        }
      }
    });
    
    const helloWorldProtectedResource = this.resource.addResource('hello-world-protected', {
      defaultMethodOptions: {
        requestParameters: {
          'method.request.querystring.id': true,
        }
      }
    });
    
    // Setup the endpoints
    this.setupHelloWorldEndpoint(helloWorldResource);
    this.setupHelloWorldProtectedEndpoint(helloWorldProtectedResource);
    this.setupHelloWorldPostEndpoint(helloWorldResource);
  }

  /**
   * Setup the hello-world GET endpoint
   */
  private setupHelloWorldEndpoint(resource: apigateway.Resource): void {
    // Create Lambda function
    const helloWorldFunction = this.createLambdaFunction('HelloWorldFunction', {
      entryPath: path.join(__dirname, 'hello-world'),
      environment: {
        HELLO_WORLD_TABLE_NAME: this.table.tableName,
      },
    });

    // Grant permissions
    this.table.grantReadWriteData(helloWorldFunction);

    // Add GET method
    resource.addMethod('GET', 
      new apigateway.LambdaIntegration(helloWorldFunction), {
        requestValidator: this.defaultValidator
      }
    );
  }

  /**
   * Setup the hello-world-protected GET endpoint
   */
  private setupHelloWorldProtectedEndpoint(resource: apigateway.Resource): void {
    // Create Lambda function
    const helloWorldProtectedFunction = this.createLambdaFunction(
      'HelloWorldProtectedFunction',
      {
        entryPath: path.join(__dirname, 'hello-world-protected'),
        environment: {
          HELLO_WORLD_TABLE_NAME: this.table.tableName,
        },
      }
    );

    // Grant permissions
    this.table.grantReadWriteData(helloWorldProtectedFunction);

    // Add method with or without Cognito authorization
    if (this.restApiGateway.cognitoAuthorizer) {
      resource.addMethod('GET', 
        new apigateway.LambdaIntegration(helloWorldProtectedFunction), {
          requestValidator: this.defaultValidator,
          authorizer: this.restApiGateway.cognitoAuthorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO,
        }
      );
    } else {
      resource.addMethod('GET',
        new apigateway.LambdaIntegration(helloWorldProtectedFunction), {
          requestValidator: this.defaultValidator
        }
      );
    }
  }

  /**
   * Setup the hello-world POST endpoint
   */
  private setupHelloWorldPostEndpoint(resource: apigateway.Resource): void {
    // Create Lambda function
    const helloWorldPostFunction = this.createLambdaFunction(
      'HelloWorldPostFunction',
      {
        entryPath: path.join(__dirname, 'hello-world-post'),
        environment: {
          HELLO_WORLD_TABLE_NAME: this.table.tableName,
        },
      }
    );

    // Define request model
    const postRequestModel = this.createRequestModel('HelloWorldPostModel', {
      contentType: 'application/json',
      modelName: 'HelloWorldPostModel',
      schema: {
        required: ['id'],
        properties: {
          id: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'The unique identifier for the hello world item',
          },
          content: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Optional content for the hello world item',
          },
        },
      },
    });

    // Grant permissions
    this.table.grantReadWriteData(helloWorldPostFunction);

    // Add POST method
    resource.addMethod('POST',
      new apigateway.LambdaIntegration(helloWorldPostFunction), {
        requestValidator: this.defaultValidator,
        requestModels: {
          'application/json': postRequestModel
        }
      }
    );
  }
} 