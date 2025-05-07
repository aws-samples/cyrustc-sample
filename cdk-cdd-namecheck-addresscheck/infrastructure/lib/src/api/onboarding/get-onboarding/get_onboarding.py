import os
from typing import Dict, Any
from datetime import datetime
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from utilities.api_config import app, logger, tracer, metrics
from data.onboarding_request import OnboardingRequestUtil

# Initialize utilities
onboarding_util = OnboardingRequestUtil(os.environ["ONBOARDING_TABLE_NAME"])

@app.get("/onboarding/<request_id>")
@tracer.capture_method
def get_onboarding(request_id: str) -> Dict[str, Any]:
    """Get onboarding request details by ID
    
    Returns detailed information about a specific onboarding request.
    """
    try:
        # Get onboarding request details
        result = onboarding_util.get_request(request_id)
        
        # Check if request exists
        if not result:
            logger.info("Onboarding request not found", extra={"requestId": request_id})
            raise app.exceptions.NotFoundError("Onboarding request not found")
            
        # Transform item for response
        response = {
            "data": {
                "requestId": result["uniqueId"],
                "email": result["email"],
                "firstName": result["firstName"],
                "middleName": result.get("middleName"),
                "lastName": result["lastName"],
                "dateOfBirth": result["dateOfBirth"],
                "phoneNumber": result["phoneNumber"],
                "address": result["address"],
                "country": result["country"],
                "status": result["status"],
                "analysisId": result["analysisId"],
                "documents": result["documents"],
                "createdAt": result["createdAt"],
                "updatedAt": result["updatedAt"]
            },
            "fetchedAt": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record metric
        metrics.add_metric(
            name="OnboardingRequestRetrieved",
            unit=MetricUnit.Count,
            value=1
        )
        
        logger.info("Retrieved onboarding request", extra={
            "requestId": request_id,
            "status": result["status"]
        })
        
        return response
        
    except Exception as e:
        logger.exception("Error getting onboarding request")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for getting onboarding request details"""
    return app.resolve(event, context) 