import json
import os
import boto3
from datetime import datetime
import logging
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize powertools
logger = Logger()
tracer = Tracer()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event, context):
    """
    Simple hello world Lambda function for Step Function.
    
    Args:
        event: The processed event from EventBridge Pipe
              Format: {
                "recordId": "RECORD_PK_VALUE",
                "operation": "INSERT|MODIFY|REMOVE",
                "timestamp": "ISO_TIMESTAMP",
                "tableName": "TABLE_ARN"
              }
        context: Lambda context
        
    Returns:
        dict: Response with success flag and message
    """
    logger.info("Hello World Lambda function invoked")
    
    try:
        # Log the incoming event
        logger.info("Event received", extra={"event": event})
        
        # Get environment variables
        environment = os.environ.get("ENVIRONMENT", "dev")
        table_name = os.environ.get("HELLO_WORLD_TABLE", "")
        
        # Get the table
        table = dynamodb.Table(table_name) if table_name else None
        
        # Extract data from the transformed event
        record_id = event.get("recordId", "unknown-id")
        operation = event.get("operation", "unknown")
        timestamp = event.get("timestamp", datetime.now().isoformat())
        
        # Construct message
        message = f"Hello World from {environment} environment! Processing {operation} operation for record {record_id}"
        
        # Optional: Get the actual record from DynamoDB for additional processing
        record_details = "Not retrieved"
        if table and record_id != "unknown-id":
            try:
                # Get the actual item from DynamoDB using the primary key
                response = table.get_item(Key={"pk": record_id})
                if "Item" in response:
                    record_details = f"Record exists with attributes: {list(response['Item'].keys())}"
                    
                    # You could update the record here to indicate processing
                    table.update_item(
                        Key={"pk": record_id},
                        UpdateExpression="SET processed_at = :time",
                        ExpressionAttributeValues={
                            ":time": datetime.now().isoformat()
                        }
                    )
            except Exception as db_error:
                logger.warning(f"Could not retrieve record details: {str(db_error)}")
        
        # Return successful response
        return {
            "success": True,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "record_id": record_id,
            "operation": operation,
            "record_details": record_details
        }
        
    except Exception as e:
        # Log the error
        logger.exception("Error in hello world Lambda")
        
        # Return failure response
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        } 