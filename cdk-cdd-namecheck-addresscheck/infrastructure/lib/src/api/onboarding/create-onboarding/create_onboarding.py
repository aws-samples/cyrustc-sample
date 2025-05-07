import os
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.validation import validate
from utilities.api_config import app, logger, tracer, metrics
from data.onboarding_request import OnboardingRequestUtil, OnboardingRequestData
from utilities.exceptions import ValidationError

# Initialize utilities
onboarding_util = OnboardingRequestUtil(os.environ["ONBOARDING_TABLE_NAME"])

# JSON Schema for request validation
REQUEST_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema",
    "type": "object",
    "required": [
        "email",
        "firstName",
        "lastName",
        "dateOfBirth",
        "phoneNumber",
        "address",
        "country",
        "analysisId",
        "documents"
    ],
    "properties": {
        "email": {
            "type": "string",
            "format": "email",
            "maxLength": 255
        },
        "firstName": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
        },
        "middleName": {
            "type": "string",
            "maxLength": 100
        },
        "lastName": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
        },
        "dateOfBirth": {
            "type": "string",
            "format": "date"
        },
        "phoneNumber": {
            "type": "string",
            "minLength": 1,
            "maxLength": 20
        },
        "address": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500
        },
        "country": {
            "type": "string",
            "minLength": 2,
            "maxLength": 2,
            "pattern": "^[A-Z]{2}$"
        },
        "analysisId": {
            "type": "string",
            "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",  # UUID v4 pattern
            "minLength": 36,
            "maxLength": 36
        },
        "documents": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "string",
                "minLength": 1
            }
        }
    },
    "additionalProperties": False
}

@app.post("/onboarding")
@tracer.capture_method
def create_onboarding() -> Dict[str, Any]:
    """Create a new onboarding request
    
    Returns the created onboarding request ID and initial metadata.
    """
    try:
        # Get request data from the app context and validate
        data = app.current_event.json_body
        validate(event=data, schema=REQUEST_SCHEMA)
        
        # Create request data
        request_data: OnboardingRequestData = {
            "email": data["email"],
            "firstName": data["firstName"],
            "middleName": data.get("middleName"),
            "lastName": data["lastName"],
            "dateOfBirth": data["dateOfBirth"],
            "phoneNumber": data["phoneNumber"],
            "address": data["address"],
            "country": data["country"].upper(),
            "analysisId": data["analysisId"],
            "documents": data["documents"]
        }
        
        # Create onboarding request
        created_request = onboarding_util.create_request(request_data)
        
        # Record metric
        metrics.add_metric(name="OnboardingRequestCreated", unit=MetricUnit.Count, value=1)
        
        logger.info("Onboarding request created", extra={
            "uniqueId": created_request["uniqueId"],
            "analysisId": created_request["analysisId"],
            "documentCount": len(created_request["documents"])
        })
        
        # Return response data
        return {
            "uniqueId": created_request["uniqueId"],
            "status": created_request["status"],
            "analysisId": created_request["analysisId"],
            "documents": created_request["documents"],
            "createdAt": created_request["createdAt"]
        }
        
    except Exception as e:
        logger.exception("Error in create_onboarding")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for the create onboarding request endpoint"""
    return app.resolve(event, context)