from aws_lambda_powertools import Logger, Tracer
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
import boto3
from utilities.exceptions import PromptNotFoundException, ValidationError
from utilities.types import PromptItem

# Initialize powertools
logger = Logger()
tracer = Tracer()

class PromptType(str, Enum):
    SYSTEM = "SYSTEM"
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    FUNCTION = "FUNCTION"

class PromptUtil:
    """Utility class for handling Prompt operations in DynamoDB"""

    def __init__(self, table_name: str):
        """Initialize PromptUtil with DynamoDB table name"""
        self.table = boto3.resource('dynamodb').Table(table_name)
    
    @tracer.capture_method
    def create_prompt(
        self,
        prompt_id: str,
        content: str,
        prompt_type: PromptType,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PromptItem:
        """Create a new prompt item"""
        try:
            timestamp = datetime.utcnow().isoformat() + 'Z'
            
            prompt_item: PromptItem = {
                'pk': prompt_id,
                'type': prompt_type,
                'content': content,
                'metadata': metadata or {},
                'createdAt': timestamp,
                'lastUpdatedAt': timestamp
            }
            
            self.table.put_item(Item=prompt_item)
            logger.info("Created prompt", extra={"promptId": prompt_id})
            return prompt_item
            
        except Exception as e:
            logger.exception("Failed to create prompt")
            raise
    
    @tracer.capture_method
    def get_prompt(self, prompt_id: str) -> PromptItem:
        """Get a prompt by ID"""
        try:
            response = self.table.get_item(
                Key={'pk': prompt_id}
            )
            
            item = response.get('Item')
            if not item:
                logger.warning("Prompt not found", extra={"promptId": prompt_id})
                raise PromptNotFoundException(f"Prompt not found: {prompt_id}")
                
            return item
            
        except Exception as e:
            logger.exception("Failed to get prompt")
            raise
    
    @tracer.capture_method
    def update_prompt(
        self, 
        prompt_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PromptItem:
        """Update a prompt"""
        try:
            update_expr = 'SET content = :content, lastUpdatedAt = :lastUpdatedAt'
            expr_values = {
                ':content': content,
                ':lastUpdatedAt': datetime.utcnow().isoformat() + 'Z'
            }
            
            if metadata is not None:
                update_expr += ', metadata = :metadata'
                expr_values[':metadata'] = metadata
            
            response = self.table.update_item(
                Key={'pk': prompt_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info("Updated prompt", extra={
                "promptId": prompt_id
            })
            
            return response['Attributes']
            
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            logger.warning("Prompt not found for update", extra={"promptId": prompt_id})
            raise PromptNotFoundException(f"Prompt not found: {prompt_id}")
        except Exception as e:
            logger.exception("Failed to update prompt")
            raise
    
    @tracer.capture_method
    def list_prompts_by_type(
        self, 
        prompt_type: PromptType,
        limit: int = 50,
        next_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """List prompts by type using GSI"""
        try:
            params = {
                'IndexName': 'typeIndex',
                'KeyConditionExpression': '#type = :type',
                'ExpressionAttributeNames': {
                    '#type': 'type'
                },
                'ExpressionAttributeValues': {
                    ':type': prompt_type
                },
                'Limit': limit
            }
            
            if next_token:
                params['ExclusiveStartKey'] = {
                    'pk': next_token
                }
            
            response = self.table.query(**params)
            
            result = {
                'items': response.get('Items', []),
                'fetchedAt': datetime.utcnow().isoformat() + 'Z'
            }
            
            if 'LastEvaluatedKey' in response:
                result['nextToken'] = response['LastEvaluatedKey']['pk']
            
            logger.info("Listed prompts by type", extra={
                "type": prompt_type,
                "itemCount": len(result['items'])
            })
            
            return result
            
        except Exception as e:
            logger.exception("Failed to list prompts")
            raise 