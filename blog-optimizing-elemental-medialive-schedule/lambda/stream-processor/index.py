import os
import json
import boto3
import uuid
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional

scheduler = boto3.client('scheduler')
dynamodb = boto3.client('dynamodb')
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']
SCHEDULER_ROLE_ARN = os.environ['SCHEDULER_ROLE_ARN']
TABLE_NAME = os.environ['TABLE_NAME']
SCHEDULER_GROUP_NAME = os.environ['SCHEDULER_GROUP_NAME']

def is_valid_iso8601(date_string: str) -> bool:
    """Validate ISO8601 datetime format"""
    try:
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False

def is_valid_channel_id(channel_id: str) -> bool:
    """Validate channel ID (must be numbers only)"""
    return bool(re.match(r'^\d+$', channel_id))

def validate_record(record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate the DynamoDB record
    Returns: (is_valid, error_message)
    """
    new_image = record['dynamodb']['NewImage']
    
    # Check if required fields exist
    required_fields = ['mediaChannelId', 'startDateTime', 'endDateTime']
    for field in required_fields:
        if field not in new_image:
            return False, f"Missing required field: {field}"
    
    # Extract values
    channel_id = new_image['mediaChannelId']['S']
    start_time = new_image['startDateTime']['S']
    end_time = new_image['endDateTime']['S']
    
    # Validate channel ID
    if not is_valid_channel_id(channel_id):
        return False, f"Invalid mediaChannelId format: {channel_id}. Must contain only numbers"
    
    # Validate datetime formats
    if not is_valid_iso8601(start_time):
        return False, f"Invalid startDateTime format: {start_time}. Must be ISO8601"
    
    if not is_valid_iso8601(end_time):
        return False, f"Invalid endDateTime format: {end_time}. Must be ISO8601"
    
    return True, None

def update_record_with_scheduler_arn(channel_id: str, start_time: str, scheduler_arn: str) -> None:
    """Update DynamoDB record with the scheduler ARN"""
    try:
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={
                'mediaChannelId': {'S': channel_id},
                'startDateTime': {'S': start_time}
            },
            UpdateExpression='SET schedulerArn = :scheduler_arn',
            ExpressionAttributeValues={
                ':scheduler_arn': {'S': scheduler_arn}
            }
        )
        print(f"Updated DynamoDB record with scheduler ARN: {scheduler_arn}")
    except Exception as e:
        print(f"Error updating DynamoDB record: {str(e)}")
        raise

def update_record_status(channel_id: str, start_time: str, status: str, remarks: str) -> None:
    """Update DynamoDB record status and remarks"""
    try:
        current_time = datetime.utcnow().isoformat() + 'Z'
        remarks_with_timestamp = f"{current_time} - {remarks}"
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={
                'mediaChannelId': {'S': channel_id},
                'startDateTime': {'S': start_time}
            },
            UpdateExpression='SET #status = :status, remarks = :remarks',
            ExpressionAttributeNames={
                '#status': 'status'  # status is a reserved word in DynamoDB
            },
            ExpressionAttributeValues={
                ':status': {'S': status},
                ':remarks': {'S': remarks_with_timestamp}
            }
        )
        print(f"Updated record status to {status} with remarks: {remarks_with_timestamp}")
    except Exception as e:
        print(f"Error updating record status: {str(e)}")
        raise

def create_schedule(record: Dict[str, Any]) -> None:
    """Create an EventBridge schedule for the new record"""
    new_image = record['dynamodb']['NewImage']
    
    # Extract values from DynamoDB record
    channel_id = new_image['mediaChannelId']['S']
    start_time = new_image['startDateTime']['S']
    
    # Validate record first
    is_valid, error_message = validate_record(record)
    if not is_valid:
        update_record_status(channel_id, start_time, "Error", f"Validation failure: {error_message}")
        return
    
    # Parse the start time and subtract 10 minutes
    start_datetime = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    schedule_time = start_datetime - timedelta(minutes=10)
    schedule_time_str = schedule_time.strftime('%Y-%m-%dT%H:%M:%S')
    
    # Create unique schedule name
    schedule_name = f"media-schedule-{channel_id}-{uuid.uuid4()}"
    
    # Create the schedule
    try:
        response = scheduler.create_schedule(
            Name=schedule_name,
            GroupName=SCHEDULER_GROUP_NAME,
            ScheduleExpression=f"at({schedule_time_str})",
            FlexibleTimeWindow={
                'Mode': 'OFF'
            },
            Target={
                'Arn': STATE_MACHINE_ARN,
                'RoleArn': SCHEDULER_ROLE_ARN,
                'Input': json.dumps({
                    'mediaChannelId': channel_id,
                    'startDateTime': start_time,
                    'endDateTime': new_image['endDateTime']['S'],
                    'scheduledTime': schedule_time_str,
                })
            },
            Description=f"Schedule for media channel {channel_id} (10 minutes before start time)",
            ActionAfterCompletion='DELETE'
        )
        
        print(f"Created schedule: {schedule_name} for {schedule_time_str}")
        
        # Update DynamoDB record with scheduler ARN and status
        scheduler_arn = response['ScheduleArn']
        update_record_with_scheduler_arn(channel_id, start_time, scheduler_arn)
        update_record_status(channel_id, start_time, "Pending", "Schedule created successfully")
        
        return response
    except Exception as e:
        error_message = f"Error creating schedule: {str(e)}"
        update_record_status(channel_id, start_time, "Error", error_message)
        raise

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Process DynamoDB Stream events"""
    try:
        for record in event['Records']:
            # Skip if this is not a DynamoDB event
            if record['eventSource'] != 'aws:dynamodb':
                continue

            # Get the event type
            event_name = record['eventName']

            if event_name == 'INSERT':
                print("Processing new record")
                create_schedule(record)
                
            elif event_name == 'MODIFY':
                print("Record modified - logging only")
                print(f"Modified record: {json.dumps(record['dynamodb']['NewImage'])}")
                
            elif event_name == 'REMOVE':
                print("Record deleted - logging only")
                print(f"Deleted record: {json.dumps(record['dynamodb']['OldImage'])}")

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed DynamoDB stream events')
        }

    except Exception as e:
        print(f"Error processing stream records: {str(e)}")
        raise 