from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
import os
import json
import boto3
from data.analysis import AnalysisUtil

logger = Logger()
tracer = Tracer()

sfn_client = boto3.client('stepfunctions')
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Callback function for analysis completion
    """
    try:
        logger.info("Received event", extra={"event": event})
        
        analysis_id = event['analysisId']
        status = event['status']
        
        # Get the analysis to retrieve the task token and onboardingId
        analysis = analysis_util.get_analysis(analysis_id)
        if not analysis:
            raise ValueError(f"Analysis not found: {analysis_id}")
            
        task_token = analysis.get('taskToken')
        if not task_token:
            raise ValueError(f"No task token found for analysis: {analysis_id}")
            
        # Get onboardingId from analysisParameters
        analysis_parameters = analysis.get('analysisParameters', {})
        onboarding_id = analysis_parameters.get('onboardingId')
        if not onboarding_id:
            raise ValueError(f"No onboardingId found in analysisParameters for analysis: {analysis_id}")
            
        # Send task success with both analysis status and onboardingId
        sfn_client.send_task_success(
            taskToken=task_token,
            output=json.dumps({
                'analysisId': analysis_id,
                'status': status,
                'onboardingId': onboarding_id
            })
        )
        
        logger.info("Successfully sent task success", extra={
            "analysisId": analysis_id,
            "status": status,
            "onboardingId": onboarding_id
        })
        
        return {
            'statusCode': 200,
            'body': 'Success'
        }
        
    except Exception as e:
        logger.exception("Error in callback handler")
        raise