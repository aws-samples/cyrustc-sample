from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from aws_lambda_powertools.utilities.typing import LambdaContext
from datetime import datetime

logger = Logger()
tracer = Tracer()
app = APIGatewayRestResolver()

@app.post("/hello/hello-world")
@tracer.capture_method
def post_hello_world():
    """
    Handle POST request to /hello/hello-world
    Validates the request body and echoes it back in the response
    """
    # Get the request body
    body = app.current_event.json_body
    
    # Additional validation in Lambda (API Gateway already validated the 'id' field)
    if 'id' not in body:
        raise BadRequestError("Missing required field: id")
    
    if not isinstance(body['id'], str):
        raise BadRequestError("Field 'id' must be a string")
    
    # Optional content validation
    if 'content' in body and not isinstance(body['content'], str):
        raise BadRequestError("Field 'content' must be a string if provided")
    
    # Log the request
    logger.info(f"Received POST request with body: {body}")
    
    current_time = datetime.utcnow().isoformat()
    
    # Return the same request body in the response with metadata
    return {
        "meta": {
            "fetchedAt": current_time
        },
        "item": body
    }

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context) 