import os
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler.api_gateway import Response
from aws_lambda_powertools.utilities.validation import validate
from aws_lambda_powertools.utilities.validation.exceptions import SchemaValidationError
from utilities.api_config import app, logger, tracer, metrics
import boto3

# Initialize S3 client
s3_client = boto3.client('s3')

request_schema = {
    "type": "object",
    "properties": {
        "objectKey": {"type": "string", "minLength": 1}
    },
    "required": ["objectKey"],
    "additionalProperties": False
}

@app.post("/documents/get-url")
@tracer.capture_method
def get_document_url() -> Dict[str, Any]:
    """Generate a pre-signed URL for reading a document from S3"""
    try:
        # Validate request body
        body = app.current_event.json_body
        validate(event=body, schema=request_schema)
        
        object_key = body["objectKey"]
        logger.info("Generating pre-signed URL", extra={"objectKey": object_key})
        
        # Generate pre-signed URL valid for 60 seconds
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': os.environ['BUCKET_NAME'],
                'Key': object_key
            },
            ExpiresIn=60
        )
        
        # Record metric
        metrics.add_metric(
            name="PresignedUrlGenerated",
            unit=MetricUnit.Count,
            value=1
        )
        
        return Response(
            status_code=200,
            content_type="application/json",
            body={
                "url": url,
                "expiresIn": 60
            }
        )
        
    except SchemaValidationError as e:
        logger.warning("Invalid request body", extra={"error": str(e)})
        metrics.add_metric(name="ValidationErrors", unit=MetricUnit.Count, value=1)
        return Response(
            status_code=400,
            content_type="application/json",
            body={
                "message": "Invalid request body",
                "error": str(e)
            }
        )
        
    except Exception as e:
        logger.exception("Error generating pre-signed URL")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        return Response(
            status_code=500,
            content_type="application/json",
            body={
                "message": "Error generating pre-signed URL",
                "error": str(e)
            }
        )

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for generating pre-signed URLs"""
    return app.resolve(event, context) 