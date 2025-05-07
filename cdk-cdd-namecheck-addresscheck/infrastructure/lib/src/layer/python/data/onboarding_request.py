from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.validation import validate
from datetime import datetime
from typing import Optional, TypedDict, List, Dict, Any
from enum import Enum
import boto3
import uuid
from utilities.exceptions import OnboardingRequestNotFoundException, ValidationError
import json

# Initialize powertools
logger = Logger()
tracer = Tracer()

class OnboardingStatus(str, Enum):
    NEW = "NEW"
    CHECKING = "CHECKING"
    READY_TO_CHECK = "READY_TO_CHECK"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CLARIFICATION = "CLARIFICATION"

class OnboardingRequestData(TypedDict):
    email: str
    firstName: str
    middleName: Optional[str]
    lastName: str
    dateOfBirth: str
    phoneNumber: str
    address: str
    country: str
    analysisId: str
    documents: List[str]

class OnboardingRequestItem(OnboardingRequestData):
    pk: str
    uniqueId: str
    status: OnboardingStatus
    createdAt: str
    updatedAt: str

class OnboardingRequestUtil:
    """Utility class for handling Onboarding Request operations in DynamoDB"""

    def __init__(self, table_name: str):
        """Initialize OnboardingRequestUtil with DynamoDB table name
        
        Args:
            table_name: Name of the DynamoDB table
        """
        self.table = boto3.resource('dynamodb').Table(table_name)
    
    @tracer.capture_method
    def create_request_item(self, request_data: OnboardingRequestData) -> OnboardingRequestItem:
        """Create a new onboarding request item with the correct structure"""
        try:
            unique_id = str(uuid.uuid4())
            timestamp = datetime.utcnow()
            timestamp_str = timestamp.isoformat() + 'Z'
            
            # Initialize empty documents array if not provided
            if 'documents' not in request_data:
                request_data['documents'] = []
            
            request_item: OnboardingRequestItem = {
                'pk': f'REQUEST#{unique_id}',
                'uniqueId': unique_id,
                'status': OnboardingStatus.NEW,
                'createdAt': timestamp_str,
                'updatedAt': timestamp_str,
                **request_data
            }
            
            logger.info("Created onboarding request item", extra={
                "uniqueId": unique_id,
                "analysisId": request_data.get('analysisId'),
                "documentCount": len(request_data.get('documents', []))
            })
            return request_item
            
        except Exception as e:
            logger.exception("Failed to create onboarding request item")
            raise
    
    @tracer.capture_method
    def create_request(self, request_data: OnboardingRequestData) -> OnboardingRequestItem:
        """Create a new onboarding request record in DynamoDB"""
        try:
            request_item = self.create_request_item(request_data)
            self.table.put_item(Item=request_item)
            logger.info("Onboarding request created", extra={"uniqueId": request_item["uniqueId"]})
            return request_item
        except Exception as e:
            logger.exception("Failed to create onboarding request")
            raise
    
    @tracer.capture_method
    def get_request(self, unique_id: str) -> OnboardingRequestItem:
        """Get an onboarding request by ID"""
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'REQUEST#{unique_id}'
                }
            )
            
            item = response.get('Item')
            if not item:
                logger.warning("Onboarding request not found", extra={"uniqueId": unique_id})
                raise OnboardingRequestNotFoundException(f"Onboarding request not found: {unique_id}")
                
            return item
            
        except Exception as e:
            logger.exception("Failed to get onboarding request")
            raise
    
    @tracer.capture_method
    def update_request_status(
        self, 
        unique_id: str, 
        status: OnboardingStatus
    ) -> OnboardingRequestItem:
        """Update an onboarding request status"""
        try:
            # Validate status
            if not isinstance(status, OnboardingStatus):
                raise ValidationError(f"Invalid status: {status}")
            
            response = self.table.update_item(
                Key={
                    'pk': f'REQUEST#{unique_id}'
                },
                UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': status,
                    ':updatedAt': datetime.utcnow().isoformat() + 'Z'
                },
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info("Onboarding request status updated", extra={
                "uniqueId": unique_id,
                "status": status
            })
            
            return response['Attributes']
            
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            logger.warning("Onboarding request not found for update", extra={"uniqueId": unique_id})
            raise OnboardingRequestNotFoundException(f"Onboarding request not found: {unique_id}")
        except Exception as e:
            logger.exception("Failed to update onboarding request status")
            raise

    @tracer.capture_method
    def update_request(
        self, 
        unique_id: str, 
        updates: dict
    ) -> OnboardingRequestItem:
        """Update onboarding request fields"""
        try:
            # Validate status if included
            if 'status' in updates:
                if not isinstance(updates['status'], OnboardingStatus):
                    raise ValidationError(f"Invalid status: {updates['status']}")
            
            update_expr = 'SET ' + ', '.join(f'#{k} = :{k}' for k in updates.keys())
            update_expr += ', updatedAt = :updatedAt'
            
            expr_names = {f'#{k}': k for k in updates.keys()}
            expr_values = {f':{k}': v for k, v in updates.items()}
            expr_values[':updatedAt'] = datetime.utcnow().isoformat() + 'Z'
            
            response = self.table.update_item(
                Key={
                    'pk': f'REQUEST#{unique_id}'
                },
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info("Onboarding request updated", extra={
                "uniqueId": unique_id,
                "updates": updates
            })
            
            return response['Attributes']
            
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            logger.warning("Onboarding request not found for update", extra={"uniqueId": unique_id})
            raise OnboardingRequestNotFoundException(f"Onboarding request not found: {unique_id}")
        except Exception as e:
            logger.exception("Failed to update onboarding request")
            raise

    @tracer.capture_method
    def list_requests(
        self,
        limit: int = 50,
        next_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """List onboarding requests with pagination, sorted by creation date"""
        try:
            # Prepare scan parameters
            params = {
                'TableName': self.table.name,
                'Limit': limit,
                # 'ProjectionExpression': "uniqueId, email, firstName, country, createdAt",
            }

            if next_token:
                try:
                    params['ExclusiveStartKey'] = json.loads(next_token)
                except Exception:
                    raise ValidationError("Invalid next token")

            # Scan the table
            response = self.table.scan(**params)

            # Transform items for response
            result = {
                'items': response.get('Items', []),
                'fetchedAt': datetime.utcnow().isoformat() + 'Z'
            }

            # Add nextToken if there are more items
            if 'LastEvaluatedKey' in response:
                result['nextToken'] = json.dumps(response['LastEvaluatedKey'])

            logger.info("Listed onboarding requests", extra={
                'itemCount': len(result['items']),
                'hasNextToken': 'nextToken' in result
            })

            return result

        except Exception as e:
            logger.exception("Failed to list onboarding requests")
            raise