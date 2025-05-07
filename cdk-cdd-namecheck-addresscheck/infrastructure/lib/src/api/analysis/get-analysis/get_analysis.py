import os
from typing import Dict, Any
from datetime import datetime
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler.api_gateway import Response
from utilities.api_config import app, logger, tracer, metrics
from data.analysis import AnalysisUtil

# Initialize utilities
analysis_util = AnalysisUtil(os.environ["ANALYSIS_TABLE_NAME"])

@app.get("/analyses/<analysis_id>")
@tracer.capture_method
def get_analysis(analysis_id: str) -> Dict[str, Any]:
    """Get analysis details by ID
    
    Returns detailed information about a specific analysis.
    """
    try:
        # Get analysis details using correct key structure
        result = analysis_util.get_analysis(analysis_id)
        
        # Check if analysis exists
        if not result:
            logger.info("Analysis not found", extra={"analysisId": analysis_id})
            return Response(
                status_code=404,
                content_type="application/json",
                body={"message": "Analysis not found"}
            )
            
        # Transform item for response
        response = {
            "data": {
                "analysisId": result["analysisId"],
                "description": result["description"],
                "documentType": result["documentType"],
                "objectsData": result["objectsData"],
                "chatHistory": result["chatHistory"],
                "status": result["status"],
                "createdAt": result["createdAt"],
                "lastUpdatedAt": result["lastUpdatedAt"],
                "analysisParameters": result.get("analysisParameters", {}),
                "analysisResults": result.get("analysisResults", {})
            },
            "fetchedAt": datetime.utcnow().isoformat() + "Z"
        }
        
        # Record metric
        metrics.add_metric(
            name="AnalysisRetrieved",
            unit=MetricUnit.Count,
            value=1
        )
        
        logger.info("Retrieved analysis", extra={
            "analysisId": analysis_id,
            "status": result["status"]
        })
        
        return Response(
            status_code=200,
            content_type="application/json",
            body=response
        )
        
    except Exception as e:
        logger.exception("Error getting analysis")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        return Response(
            status_code=500,
            content_type="application/json",
            body={"message": "Internal server error"}
        )

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for getting analysis details"""
    return app.resolve(event, context) 