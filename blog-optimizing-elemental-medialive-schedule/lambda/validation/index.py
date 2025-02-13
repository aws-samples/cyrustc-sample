import json
import re
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from urllib.parse import urlparse

def is_valid_iso8601(date_string: str) -> bool:
    """Validate ISO8601 datetime format"""
    try:
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False

def is_valid_channel_id(channel_id: str) -> bool:
    """Validate channel ID format (numeric only)"""
    return bool(re.match(r'^\d+$', channel_id))

def is_valid_manifest_url(url: str) -> bool:
    """Validate manifest URL format"""
    try:
        # Check if URL starts with http/https
        parsed = urlparse(url)
        if parsed.scheme not in ['http', 'https']:
            return False
        
        # Check if URL ends with .mpd or .m3u8
        return url.lower().endswith(('.mpd', '.m3u8'))
    except:
        return False

def validate_record(record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate the DynamoDB record
    Returns: (is_valid, error_message)
    """
    try:
        # Check required fields
        required_fields = ['mediaChannelId', 'startDateTime', 'endDateTime', 'manifestUrl']
        for field in required_fields:
            if not record.get(field):
                return False, f"Missing required field: {field}"

        # Extract values
        channel_id = record['mediaChannelId']
        start_time = record['startDateTime']
        end_time = record['endDateTime']
        manifest_url = record['manifestUrl']
        
        # Validate channel ID
        if not is_valid_channel_id(channel_id):
            return False, f"Invalid mediaChannelId format: {channel_id}. Must contain only numbers"
        
        # Validate datetime formats
        if not is_valid_iso8601(start_time):
            return False, f"Invalid startDateTime format: {start_time}. Must be ISO8601"
        
        if not is_valid_iso8601(end_time):
            return False, f"Invalid endDateTime format: {end_time}. Must be ISO8601"

        # Validate manifest URL
        if not is_valid_manifest_url(manifest_url):
            return False, f"Invalid manifestUrl format: {manifest_url}. Must start with http(s) and end with .mpd or .m3u8"
        
        return True, None

    except Exception as e:
        return False, f"Validation error: {str(e)}"

def create_schedule_name(record: Dict[str, str]) -> str:
    """
    Create a scheduler-friendly name by replacing invalid characters
    Only alphanumeric characters, hyphens, underscores, and periods are allowed
    """
    # Replace '+' with '-plus-' and ':' with '-'
    start_time = record['startDateTime'].replace('+', '-plus-').replace(':', '-')
    return f"media-{record['mediaChannelId']}-{start_time}"

def create_schedule_expression(date_string: str) -> str:
    """
    Create a valid schedule expression for EventBridge Scheduler
    Format should be: at(YYYY-MM-DDTHH:mm:ss)
    """
    # Convert to datetime to standardize format
    dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    # Format in UTC without timezone info
    return f"at({dt.strftime('%Y-%m-%dT%H:%M:%S')})"

def handler(event, context):
    """
    Lambda handler for validating media channel records
    Input event structure:
    {
        "eventName": "INSERT/MODIFY/REMOVE",
        "dynamodb": {
            "NewImage": { ... },
            "OldImage": { ... }
        }
    }
    """
    try:
        print(f"Processing event: {json.dumps(event)}")

        # Extract record data based on event type
        if event['eventName'] in ['INSERT', 'MODIFY']:
            dynamo_record = event['dynamodb']['NewImage']
        else:
            dynamo_record = event['dynamodb']['OldImage']

        # Convert DynamoDB format to plain dictionary
        record = {
            'mediaChannelId': dynamo_record['mediaChannelId']['S'],
            'startDateTime': dynamo_record['startDateTime']['S'],
            'endDateTime': dynamo_record['endDateTime']['S'],
        }
        
        # Add manifestUrl if it exists
        if 'manifestUrl' in dynamo_record:
            record['manifestUrl'] = dynamo_record['manifestUrl']['S']

        # Validate the record
        is_valid, error_message = validate_record(record)
        
        if not is_valid:
            print(f"Validation failed: {error_message}")
            return {
                'isValid': False,
                'error': error_message,
                'record': record  # Always include the record, even for errors
            }

        # Generate schedule name with valid characters
        schedule_name = create_schedule_name(record)
        
        # Create schedule expression in correct format
        schedule_expression = create_schedule_expression(record['startDateTime'])
        
        # Prepare the workflow input
        workflow_input = {
            'mediaChannelId': record['mediaChannelId'],
            'startDateTime': record['startDateTime'],
            'endDateTime': record['endDateTime'],
            'manifestUrl': record.get('manifestUrl', '')  # Use get() with default
        }

        return {
            'isValid': True,
            'record': record,
            'scheduleName': schedule_name,
            'scheduleExpression': schedule_expression,
            'workflowInput': json.dumps(workflow_input)
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        # Extract basic record info even in case of errors
        try:
            dynamo_record = event['dynamodb']['NewImage' if event['eventName'] != 'REMOVE' else 'OldImage']
            record = {
                'mediaChannelId': dynamo_record['mediaChannelId']['S'],
                'startDateTime': dynamo_record['startDateTime']['S'],
                'endDateTime': dynamo_record['endDateTime']['S'],
            }
        except:
            record = {}  # Fallback empty record if we can't extract data
            
        return {
            'isValid': False,
            'error': f"Processing error: {str(e)}",
            'record': record  # Include whatever record data we could extract
        } 