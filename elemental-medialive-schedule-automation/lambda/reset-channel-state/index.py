import json
import boto3
from botocore.exceptions import ClientError

def handler(event, context):
    """
    Reset MediaPackage V2 channel state using channel info from MediaLive
    
    Expected input from Step Function:
    {
        "channelInfo": {
            "Destinations": [
                {
                    "MediaPackageSettings": [
                        {
                            "ChannelGroup": "test",
                            "ChannelName": "testchannel"
                        }
                    ]
                }
            ]
        },
        ...other event data
    }
    """
    try:
        print(f"Processing reset channel state event: {json.dumps(event)}")
        
        # Extract MediaPackage settings from channelInfo
        channel_info = event.get('channelInfo', {})
        destinations = channel_info.get('Destinations', [])
        
        if not destinations:
            print("No destinations found in channelInfo, skipping reset")
            return {
                'resetChannelResult': None,
                'status': 'SKIPPED',
                'message': "No destinations found in MediaLive channel info",
                **event
            }
        
        # Get the first destination's MediaPackage settings
        media_package_settings = destinations[0].get('MediaPackageSettings', [])
        
        if not media_package_settings:
            print("No MediaPackage settings found, skipping reset")
            return {
                'resetChannelResult': None,
                'status': 'SKIPPED',
                'message': "No MediaPackage settings found in channel destinations",
                **event
            }
        
        # Extract channel group and name from first MediaPackage setting
        mp_setting = media_package_settings[0]
        channel_group_name = mp_setting.get('ChannelGroup')
        channel_name = mp_setting.get('ChannelName')
        
        if not channel_group_name or not channel_name:
            print(f"Missing MediaPackage channel info: group={channel_group_name}, name={channel_name}")
            return {
                'resetChannelResult': None,
                'status': 'SKIPPED',
                'message': f"Missing MediaPackage channel info: group={channel_group_name}, name={channel_name}",
                **event
            }
        
        # Initialize MediaPackage V2 client
        mediapackagev2 = boto3.client('mediapackagev2')
        
        # Reset the channel state
        response = mediapackagev2.reset_channel_state(
            ChannelGroupName=channel_group_name,
            ChannelName=channel_name
        )
        
        print(f"Successfully reset channel state for {channel_name} in group {channel_group_name}")
        print(f"Reset response: {json.dumps(response, default=str)}")
        
        # Convert datetime objects to strings for JSON serialization
        serializable_response = json.loads(json.dumps(response, default=str))
        
        return {
            'resetChannelResult': serializable_response,
            'status': 'SUCCESS',
            'message': f"Channel {channel_name} state reset successfully",
            **event
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        print(f"AWS API Error resetting channel state: {error_code} - {error_message}")
        
        return {
            'resetChannelResult': None,
            'status': 'ERROR',
            'message': f"Failed to reset channel state: {error_message}",
            'errorCode': error_code,
            **event
        }
        
    except Exception as e:
        print(f"Unexpected error resetting channel state: {str(e)}")
        
        return {
            'resetChannelResult': None,
            'status': 'ERROR', 
            'message': f"Unexpected error: {str(e)}",
            **event
        }