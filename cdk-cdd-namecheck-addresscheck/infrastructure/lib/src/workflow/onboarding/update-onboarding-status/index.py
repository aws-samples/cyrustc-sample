import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from data.onboarding_request import OnboardingRequestUtil, OnboardingStatus

logger = Logger()
tracer = Tracer()

onboarding_util = OnboardingRequestUtil(os.environ['ONBOARDING_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for updating onboarding status"""
    try:
        onboarding_id = event['onboardingId']
        
        # Update onboarding status to READY_TO_CHECK using dedicated status update method
        onboarding_util.update_request_status(
            unique_id=onboarding_id,
            status=OnboardingStatus.READY_TO_CHECK
        )
        
        logger.info("Updated onboarding status", extra={
            "onboardingId": onboarding_id,
            "status": OnboardingStatus.READY_TO_CHECK.value
        })
        
        return {
            'onboardingId': onboarding_id,
            'status': OnboardingStatus.READY_TO_CHECK.value
        }
        
    except Exception as e:
        logger.exception("Error updating onboarding status")
        raise 