import os
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from utilities.api_config import app, logger, tracer, metrics
from data.analysis import AnalysisUtil, AnalysisStatus
from utilities.exceptions import ValidationError, AnalysisNotFoundException

# Initialize utilities
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@app.post("/analyses/<analysis_id>/start")
@tracer.capture_method
def start_analysis(analysis_id: str) -> Dict[str, Any]:
    """Start the analysis by updating its status
    
    Updates the analysis status to STARTED, which will trigger
    the analysis workflow via EventBridge.
    
    Args:
        analysis_id: Analysis ID from path parameter
    """
    try:
        # Get request body
        body = app.current_event.json_body
        if not body or 'objectKeys' not in body:
            raise ValidationError('Missing objectKeys in request body')
            
        object_keys = body['objectKeys']
        if not isinstance(object_keys, list) or not object_keys:
            raise ValidationError('objectKeys must be a non-empty array')
        
        # Get analysis and verify status
        analysis = analysis_util.get_analysis(analysis_id)
        
        if analysis['status'] != AnalysisStatus.PENDING:
            raise ValidationError(f"Analysis cannot be started in status: {analysis['status']}")
        
        # Create objects data structure
        objects_data = [{'object': key, 'data': []} for key in object_keys]
        
        # Update the analysis
        updates = {
            'objectsData': objects_data,
            'status': AnalysisStatus.STARTED
        }
        
        result = analysis_util.update_analysis(analysis_id, updates)
        
        # Record metrics
        metrics.add_metric(name="AnalysisStarted", unit=MetricUnit.Count, value=1)
        
        logger.info("Analysis status updated to STARTED", extra={
            "analysisId": analysis_id,
            "objectCount": len(object_keys)
        })
        
        return {
            "data": result,
            "updatedAt": result['lastUpdatedAt']
        }
        
    except ValidationError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        metrics.add_metric(name="ValidationErrors", unit=MetricUnit.Count, value=1)
        raise
    except AnalysisNotFoundException as e:
        logger.warning("Analysis not found", extra={"error": str(e)})
        metrics.add_metric(name="NotFoundErrors", unit=MetricUnit.Count, value=1)
        raise
    except Exception as e:
        logger.exception("Error starting analysis")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for starting analysis"""
    return app.resolve(event, context) 