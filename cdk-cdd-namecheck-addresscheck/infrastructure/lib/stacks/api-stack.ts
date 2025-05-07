import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { RestApi } from "../constructs/api/gateway/rest-api";
import { ListAnalysesFunction } from "../constructs/api/functions/analysis/list-analyses";
import { CreateAnalysisIdFunction } from "../constructs/api/functions/analysis/create-analysis-id";
import { GenerateUrlsFunction } from "../constructs/api/functions/analysis/generate-urls";
import { StartAnalysisFunction } from "../constructs/api/functions/analysis/start-analysis";
import { GetAnalysisFunction } from "../constructs/api/functions/analysis/get-analysis";
import { CreateOnboardingFunction } from "../constructs/api/functions/onboarding/create-onboarding";
import { ListOnboardingFunction } from "../constructs/api/functions/onboarding/list-onboarding";
import { GetOnboardingFunction } from "../constructs/api/functions/onboarding/get-onboarding";
import { StorageStack } from "./storage-stack";
import * as path from "path";
import { GetDocumentUrlFunction } from "../constructs/api/functions/analysis/get-document-url";
import { GenerateEmailLambda } from "../constructs/api/functions/onboarding/generate-email";

interface ApiStackProps extends cdk.StackProps {
  stageName: string;
  storageStack: StorageStack;
}

export class ApiStack extends cdk.Stack {
  public readonly api: cdk.aws_apigateway.RestApi;
  private readonly apiLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create Lambda Layer for API functions
    this.apiLayer = new lambda.LayerVersion(this, "ApiLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/layer/"), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            "bash",
            "-c",
            [
              "pip install -r python/requirements.txt -t /asset-output/python",
              "cp -r python/utilities /asset-output/python/",
              "cp -r python/data /asset-output/python/",
            ].join(" && "),
          ],
        },
      }),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: "Common utilities for API Lambda functions",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create REST API
    const restApi = new RestApi(this, "RestApi", {
      stageName: props.stageName,
    });
    this.api = restApi.api;

    // Create onboarding functions
    const listOnboardingFunction = new ListOnboardingFunction(
      this,
      "ListOnboarding",
      {
        tableName: props.storageStack.onboardingRequestTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    const getOnboardingFunction = new GetOnboardingFunction(
      this,
      "GetOnboarding",
      {
        tableName: props.storageStack.onboardingRequestTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      "RequestValidator",
      {
        restApi: this.api,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Create model for onboarding request
    const createOnboardingModel = this.api.addModel("CreateOnboardingModel", {
      contentType: "application/json",
      modelName: "CreateOnboardingRequest",
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: [
          "email",
          "firstName",
          "lastName",
          "dateOfBirth",
          "phoneNumber",
          "address",
          "country",
          "documents",
        ],
        properties: {
          email: {
            type: apigateway.JsonSchemaType.STRING,
            format: "email",
          },
          firstName: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          middleName: {
            type: apigateway.JsonSchemaType.STRING,
          },
          lastName: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          dateOfBirth: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date",
          },
          phoneNumber: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          address: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          country: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 2,
            maxLength: 2,
          },
          documents: {
            type: apigateway.JsonSchemaType.ARRAY,
            minItems: 1,
            items: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
        },
      },
    });

    // Create resources
    const analysesResource = this.api.root.addResource("analyses");
    const analysisResource = analysesResource.addResource("{analysis_id}");
    const uploadUrlsResource = analysisResource.addResource("upload-urls");
    const startResource = analysisResource.addResource("start");

    // Create onboarding resources
    const onboardingResource = this.api.root.addResource("onboarding");
    const onboardingRequestResource =
      onboardingResource.addResource("{request_id}");

    // Create Lambda functions
    const listAnalysesFunction = new ListAnalysesFunction(
      this,
      "ListAnalyses",
      {
        tableName: props.storageStack.analysisTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    const getAnalysisFunction = new GetAnalysisFunction(this, "GetAnalysis", {
      tableName: props.storageStack.analysisTable.tableName,
      commonLayer: this.apiLayer,
    });

    const createAnalysisIdFunction = new CreateAnalysisIdFunction(
      this,
      "CreateAnalysisId",
      {
        tableName: props.storageStack.analysisTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    const generateUrlsFunction = new GenerateUrlsFunction(
      this,
      "GenerateUrls",
      {
        tableName: props.storageStack.analysisTable.tableName,
        bucketName: props.storageStack.documentBucket.bucketName,
        commonLayer: this.apiLayer,
      }
    );

    const startAnalysisFunction = new StartAnalysisFunction(
      this,
      "StartAnalysis",
      {
        tableName: props.storageStack.analysisTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    // Create onboarding function
    const createOnboardingFunction = new CreateOnboardingFunction(
      this,
      "CreateOnboardingFunction",
      {
        tableName: props.storageStack.onboardingRequestTable.tableName,
        commonLayer: this.apiLayer,
      }
    );

    // Grant permissions
    props.storageStack.analysisTable.grantReadData(
      listAnalysesFunction.function
    );
    props.storageStack.analysisTable.grantReadData(
      getAnalysisFunction.function
    );
    props.storageStack.analysisTable.grantWriteData(
      createAnalysisIdFunction.function
    );
    props.storageStack.analysisTable.grantReadData(
      generateUrlsFunction.function
    );
    props.storageStack.analysisTable.grantReadWriteData(
      startAnalysisFunction.function
    );
    props.storageStack.documentBucket.grantWrite(generateUrlsFunction.function);
    props.storageStack.onboardingRequestTable.grantWriteData(
      createOnboardingFunction.function
    );

    // Grant permissions for onboarding functions
    props.storageStack.onboardingRequestTable.grantReadData(
      listOnboardingFunction.function
    );
    props.storageStack.onboardingRequestTable.grantReadData(
      getOnboardingFunction.function
    );

    // Add methods to resources
    analysesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listAnalysesFunction.function, {
        proxy: true,
      })
    );

    // Add GET method for single analysis
    analysisResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAnalysisFunction.function, {
        proxy: true,
      }),
      {
        requestParameters: {
          "method.request.path.analysis_id": true,
        },
      }
    );

    analysesResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createAnalysisIdFunction.function, {
        proxy: true,
      })
    );

    uploadUrlsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(generateUrlsFunction.function, {
        proxy: true,
      })
    );

    startResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(startAnalysisFunction.function, {
        proxy: true,
      })
    );

    // Add onboarding methods
    onboardingResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listOnboardingFunction.function, {
        proxy: true,
      }),
      {
        requestParameters: {
          "method.request.querystring.limit": false,
          "method.request.querystring.nextToken": false,
        },
      }
    );

    onboardingRequestResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getOnboardingFunction.function, {
        proxy: true,
      }),
      {
        requestParameters: {
          "method.request.path.request_id": true,
        },
      }
    );

    // Add existing POST method for onboarding
    onboardingResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createOnboardingFunction.function),
      {
        requestValidator: requestValidator,
        requestModels: {
          "application/json": createOnboardingModel,
        },
      }
    );

    // Add stack outputs
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "API Gateway URL",
    });

    // Add API endpoint to generate a pre-signed URL for reading PDFs from the document bucket
    const getDocumentUrlFunction = new GetDocumentUrlFunction(
      this,
      "GetDocumentUrlFunction",
      {
        bucketName: props.storageStack.documentBucket.bucketName,
        commonLayer: this.apiLayer,
      }
    );

    const documents = this.api.root.addResource("documents");
    const getUrl = documents.addResource("get-url");
    getUrl.addMethod(
      "POST",
      new apigateway.LambdaIntegration(getDocumentUrlFunction.function),
      {
        operationName: "GetDocumentUrl",
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );

    // Create generate email function
    const generateEmailFunction = new GenerateEmailLambda(
      this,
      "GenerateEmail",
      {
        commonLayer: this.apiLayer,
      }
    );

    // Create the /onboarding/email/generate endpoint
    const emailResource = onboardingResource.addResource("email");
    const generateResource = emailResource.addResource("generate");

    generateResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(generateEmailFunction.function, {
        proxy: true,
      }),
      {
        operationName: "GenerateOnboardingEmail",
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": apigateway.Model.EMPTY_MODEL,
            },
          },
          {
            statusCode: "400",
            responseModels: {
              "application/json": apigateway.Model.ERROR_MODEL,
            },
          },
          {
            statusCode: "500",
            responseModels: {
              "application/json": apigateway.Model.ERROR_MODEL,
            },
          },
        ],
      }
    );
  }
}
