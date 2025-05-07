from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
import os
from data.analysis import AnalysisUtil
from datetime import datetime, timezone

logger = Logger()
tracer = Tracer()

analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Logs the completion of analysis workflow
    """
    try:
        logger.info("Received event", extra={"event": event})
        
        analysis_id = event.get('analysisId')
        status = event.get('status')
        onboarding_id = event['onboardingId']

        if not analysis_id:
            raise ValueError("Missing analysisId")
            
        logger.info(f"Analysis {analysis_id} Completed", extra={
            "analysisId": analysis_id,
            "status": status
        })
        
        return {
            'analysisId': analysis_id,
            'status': status,
            'onboardingId': onboarding_id,
            'completedAt': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.exception("Error in log completion handler")
        raise