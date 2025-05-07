from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
import os
from data.onboarding_request import OnboardingRequestUtil, OnboardingStatus

logger = Logger()
tracer = Tracer()
onboarding_util = OnboardingRequestUtil(os.environ['ONBOARDING_TABLE_NAME'])

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    """
    Updates onboarding request status to CHECKING
    """
    try:
        logger.info("Received event", extra={"event": event})
        
        # Extract request_id from pk (format: REQUEST#uuid)
        pk = event['pk']
        request_id = pk.split('#')[1]
        status = OnboardingStatus(event['status'])
            
        logger.info("Processing request", extra={"requestId": request_id})
        
        # Update status using utility class
        updated_item = onboarding_util.update_request_status(
            unique_id=request_id,
            status=status
        )
        
        return {
            'requestId': request_id,
            'status': updated_item['status']
        }
        
    except Exception as e:
        logger.exception("Error updating onboarding status")
        raise