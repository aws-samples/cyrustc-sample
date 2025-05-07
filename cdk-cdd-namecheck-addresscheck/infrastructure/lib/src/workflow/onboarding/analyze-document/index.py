from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
import os
from data.onboarding_request import OnboardingRequestUtil
from data.analysis import AnalysisUtil, AnalysisStatus
from utilities.types import AnalysisItem

logger = Logger()
tracer = Tracer()
onboarding_util = OnboardingRequestUtil(os.environ['ONBOARDING_TABLE_NAME'])
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Updates analysis status to STARTED and objectsData for the onboarding request
    """
    try:
        logger.info("Received event", extra={"event": event})
        
        # Get request_id and task token from the event
        request_id = event['requestId']
        task_token = event['taskToken']
            
        logger.info("Analyzing document", extra={"requestId": request_id})
        
        # Get onboarding request to find analysisId and documents
        onboarding_request = onboarding_util.get_request(request_id)
        analysis_id = onboarding_request.get('analysisId')
        documents = onboarding_request.get('documents', [])
        
        if not analysis_id:
            raise ValueError(f"No analysisId found for request {request_id}")
            
        if not documents:
            raise ValueError(f"No documents found for request {request_id}")
            
        # Construct objectsData from documents
        objects_data = [{'object': doc, 'data': []} for doc in documents]
        
        # Construct analysisParameters from onboarding request
        analysis_parameters = {
            'firstName': onboarding_request.get('firstName'),
            'middleName': onboarding_request.get('middleName'),
            'lastName': onboarding_request.get('lastName'),
            'address': onboarding_request.get('address'),
            'onboardingId': request_id  # Include onboardingId in analysisParameters
        }
        
        # Update analysis with all required fields
        updates = {
            'objectsData': objects_data,
            'status': AnalysisStatus.STARTED,
            'taskToken': task_token,  # Store task token with analysis
            'analysisParameters': analysis_parameters
        }
        
        updated_analysis: AnalysisItem = analysis_util.update_analysis(
            analysis_id=analysis_id,
            updates=updates
        )
        
        return {
            "analysisId": analysis_id,
            "onboardingId": request_id,
            "taskToken": task_token
        }
        
    except Exception as e:
        logger.exception("Error analyzing document")
        raise