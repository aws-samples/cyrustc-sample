import os
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.validation import validate
from utilities.api_config import app, logger, tracer, metrics
from data.onboarding_request import OnboardingRequestUtil

# Initialize utilities
onboarding_util = OnboardingRequestUtil(os.environ["ONBOARDING_TABLE_NAME"])

# JSON Schema for request validation
REQUEST_SCHEMA = {
    "type": "object",
    "properties": {
        "queryStringParameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]?$|^100$"
                },
                "nextToken": {
                    "type": "string"
                }
            }
        }
    }
}

@app.get("/onboarding")
@tracer.capture_method
def list_onboarding() -> Dict[str, Any]:
    """List onboarding requests with pagination
    
    Returns a paginated list of onboarding requests sorted by creation date.
    """
    try:
        # Get and validate query parameters
        params = app.current_event.query_string_parameters or {}
        validate(event={"queryStringParameters": params}, schema=REQUEST_SCHEMA)
        
        # Parse parameters
        limit = int(params.get("limit", "50"))
        next_token = params.get("nextToken")
        
        # Get onboarding requests
        result = onboarding_util.list_requests(limit, next_token)
        
        # Transform items for response
        items = [{
            "requestId": item["uniqueId"],
            "firstName": item["firstName"],
            "email": item["email"],
            "country": item["country"],
            "status": item.get("status", "PENDING"),
            "createdAt": item["createdAt"],
            "lastUpdatedAt": item.get("updatedAt", item["createdAt"]),
            "assignedTo": item.get("assignedTo")
        } for item in result["items"]]
        
        # Prepare response
        response = {
            "items": items,
            "fetchedAt": result["fetchedAt"]
        }
        
        # Add nextToken if present
        if "nextToken" in result:
            response["nextToken"] = result["nextToken"]
            
        # Record metric
        metrics.add_metric(
            name="OnboardingRequestsListed",
            unit=MetricUnit.Count,
            value=len(items)
        )
        
        logger.info("Listed onboarding requests", extra={
            "itemCount": len(items),
            "hasNextToken": "nextToken" in response
        })
        
        return response
        
    except Exception as e:
        logger.exception("Error in list_onboarding")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for the list onboarding requests endpoint"""
    return app.resolve(event, context) 