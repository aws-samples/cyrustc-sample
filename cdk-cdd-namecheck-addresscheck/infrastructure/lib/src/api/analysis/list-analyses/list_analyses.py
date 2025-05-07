import os
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from utilities.api_config import app, logger, tracer, metrics
from data.analysis import AnalysisUtil
from utilities.exceptions import ValidationError

# Initialize utilities
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@app.get("/analyses")
@tracer.capture_method
def list_analyses() -> Dict[str, Any]:
    """List analyses with pagination
    
    Returns a paginated list of analyses with selected fields and pagination token.
    """
    try:
        # Get query parameters
        query_params = app.current_event.query_string_parameters or {}
        next_token = query_params.get('nextToken')
        
        # Validate and parse limit
        limit = 50  # default
        if 'limit' in query_params:
            try:
                limit = int(query_params['limit'])
                if not 1 <= limit <= 100:
                    raise ValidationError("Limit must be between 1 and 100")
            except ValueError:
                raise ValidationError("Invalid limit value")
        
        # Record metric for request
        metrics.add_metric(name="ListAnalysesRequested", unit=MetricUnit.Count, value=1)
        
        # Get analyses with pagination
        result = analysis_util.list_analyses(limit=limit, next_token=next_token)
        
        # Record metrics
        metrics.add_metric(
            name="AnalysesReturned",
            unit=MetricUnit.Count,
            value=len(result['items'])
        )
        
        logger.info("Successfully listed analyses", extra={
            "itemCount": len(result['items']),
            "hasNextToken": 'nextToken' in result
        })
        
        return result
        
    except ValidationError as e:
        logger.warning("Validation error in list_analyses", extra={"error": str(e)})
        metrics.add_metric(name="ValidationErrors", unit=MetricUnit.Count, value=1)
        raise
    except Exception as e:
        logger.exception("Error in list_analyses")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for the list analyses endpoint"""
    return app.resolve(event, context) 