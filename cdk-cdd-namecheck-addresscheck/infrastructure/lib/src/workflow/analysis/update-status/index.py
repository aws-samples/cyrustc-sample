import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from data.analysis import AnalysisUtil, AnalysisStatus

logger = Logger()
tracer = Tracer()

analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for updating analysis status"""
    try:
        analysis_id = event['analysisId']
        status = AnalysisStatus(event['status'])
        
        updates = {'status': status}
        
        # Include objectsData if provided
        if 'objectsData' in event:
            updates['objectsData'] = event['objectsData']
        
        result = analysis_util.update_analysis(analysis_id, updates)
        
        logger.info("Analysis status updated", extra={
            "analysisId": analysis_id,
            "status": status
        })
        
        return {
            'analysisId': analysis_id,
            'status': status,
            'objectsData': result.get('objectsData', [])
        }
        
    except Exception as e:
        logger.exception("Error updating analysis status")
        raise 