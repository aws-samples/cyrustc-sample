import os
import uuid
from typing import Dict, Any
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from utilities.api_config import app, logger, tracer, metrics
from data.analysis import AnalysisUtil, DocumentType
from utilities.types import AnalysisStatus
from utilities.exceptions import ValidationError

# Initialize utilities
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@app.post("/analyses")
@tracer.capture_method
def create_analysis_id() -> Dict[str, Any]:
    """Create a new analysis ID
    
    Returns the created analysis ID and initial metadata.
    """
    try:
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Create analysis item with default values
        analysis_item = analysis_util.create_analysis_item(
            analysis_id=analysis_id,
            description="",  # Default empty description
            document_type=DocumentType.MIXED,  # Default document type
            objects_data=[],
            chat_history=[],
            status=AnalysisStatus.CREATED  # Using CREATED from the enum
        )
        
        # Store in DynamoDB
        result = analysis_util.create_analysis(analysis_item)
        
        # Record metric
        metrics.add_metric(name="AnalysisCreated", unit=MetricUnit.Count, value=1)
        
        logger.info("Analysis created", extra={
            "analysisId": analysis_id
        })
        
        return {
            "analysisId": analysis_id,
            "status": AnalysisStatus.CREATED,
            "createdAt": result['createdAt']
        }
        
    except Exception as e:
        logger.exception("Error in create_analysis_id")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for the create analysis ID endpoint"""
    return app.resolve(event, context) 