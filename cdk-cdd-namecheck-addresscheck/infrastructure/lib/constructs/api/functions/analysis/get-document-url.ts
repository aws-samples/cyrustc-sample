import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PythonLambda } from "../../../common/lambda/python-lambda";
import * as path from "path";

interface GetDocumentUrlFunctionProps {
  bucketName: string;
  commonLayer: cdk.aws_lambda.ILayerVersion;
}

export class GetDocumentUrlFunction extends Construct {
  public readonly function: cdk.aws_lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: GetDocumentUrlFunctionProps
  ) {
    super(scope, id);

    const lambda = new PythonLambda(this, "Function", {
      name: "get-document-url",
      entry: path.join(
        __dirname,
        "../../../../src/api/analysis/get-document-url"
      ),
      handler: "get_document_url.lambda_handler",
      description: "Generates pre-signed URL for reading documents",
      environment: {
        BUCKET_NAME: props.bucketName,
      },
      layers: [props.commonLayer],
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:GetObject"],
          resources: [`arn:aws:s3:::${props.bucketName}/*`],
        }),
      ],
    });

    this.function = lambda.function;
  }
}
