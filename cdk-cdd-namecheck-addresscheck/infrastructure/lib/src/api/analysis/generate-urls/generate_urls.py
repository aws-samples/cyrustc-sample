import os
import uuid
import boto3
from typing import List, Dict, Any
from datetime import datetime
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from utilities.api_config import app, logger, tracer, metrics
from utilities.exceptions import ValidationError
from utilities.validation import validate_analysis_id

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ['BUCKET_NAME']

@tracer.capture_method
def generate_presigned_url(bucket: str, key: str) -> str:
    """Generate a presigned URL for uploading a file to S3."""
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ContentType': 'application/pdf'
            },
            ExpiresIn=3600
        )
        return url
    except Exception as e:
        logger.exception("Error generating presigned URL")
        raise

@app.post("/analyses/<analysis_id>/upload-urls")
@tracer.capture_method
def generate_urls(analysis_id: str) -> Dict[str, Any]:
    """Generate presigned URLs for S3 uploads
    
    Args:
        analysis_id: Analysis ID from path parameter
    """
    try:
        # Validate analysis ID
        validation_error = validate_analysis_id(analysis_id)
        if validation_error:
            raise ValidationError(validation_error)
            
        # Parse request body
        body = app.current_event.json_body
        file_count = body.get('fileCount')
        
        if not file_count or not isinstance(file_count, int):
            raise ValidationError('Missing or invalid fileCount')
        
        if file_count < 1:
            raise ValidationError('fileCount must be at least 1')

        # Record metric
        metrics.add_metric(name="PresignedUrlsRequested", unit=MetricUnit.Count, value=file_count)

        # Generate presigned URLs
        urls: List[Dict[str, str]] = []
        for _ in range(file_count):
            file_id = str(uuid.uuid4())
            key = f"{analysis_id}/{file_id}.pdf"
            presigned_url = generate_presigned_url(BUCKET_NAME, key)
            urls.append({
                'url': presigned_url,
                'key': key
            })

        response = {
            'urls': urls,
            'expiresIn': 3600,
            'generatedAt': datetime.utcnow().isoformat() + 'Z'
        }

        logger.info("Generated presigned URLs", extra={
            "analysisId": analysis_id,
            "urlCount": len(urls)
        })

        return response

    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        metrics.add_metric(name="ValidationErrors", unit=MetricUnit.Count, value=1)
        raise
    except Exception as e:
        logger.exception("Error generating presigned URLs")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for generating presigned URLs"""
    return app.resolve(event, context)