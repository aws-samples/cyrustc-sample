from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.validation import validate
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
import boto3
from utilities.exceptions import AnalysisNotFoundException, ValidationError
from utilities.types import AnalysisItem, ObjectData, ChatMessage, AnalysisStatus
from boto3.dynamodb.conditions import Key

# Initialize powertools
logger = Logger()
tracer = Tracer()

class DocumentType(str, Enum):
    MIXED = "MIXED"
    BANK_STATEMENT = "BANK_STATEMENT"
    ANNUAL_REPORT = "ANNUAL_REPORT"

class AnalysisUtil:
    """Utility class for handling Analysis operations in DynamoDB"""

    def __init__(self, table_name: str):
        """Initialize AnalysisUtil with DynamoDB table name
        
        Args:
            table_name: Name of the DynamoDB table
        """
        self.table = boto3.resource('dynamodb').Table(table_name)
    
    @tracer.capture_method
    def create_analysis_item(
        self,
        analysis_id: str,
        description: str,
        document_type: DocumentType,
        objects_data: List[ObjectData],
        chat_history: List[ChatMessage],
        status: AnalysisStatus
    ) -> AnalysisItem:
        """Create a new analysis item with the correct structure"""
        try:
            timestamp = datetime.utcnow()
            timestamp_str = timestamp.isoformat() + 'Z'
            year_month = timestamp.strftime("%Y-%m")
            
            analysis_item: AnalysisItem = {
                'pk': f'ID#{analysis_id}',
                'sk': 'METADATA',
                'analysisId': analysis_id,
                'description': description,
                'documentType': document_type,
                'objectsData': objects_data,
                'chatHistory': chat_history,
                'status': status,
                'yearMonth': year_month,
                'createdAt': timestamp_str,
                'lastUpdatedAt': timestamp_str
            }
            
            logger.info("Created analysis item", extra={"analysisId": analysis_id})
            return analysis_item
            
        except Exception as e:
            logger.exception("Failed to create analysis item")
            raise
    
    @tracer.capture_method
    def create_analysis(self, analysis_item: AnalysisItem) -> AnalysisItem:
        """Create a new analysis record in DynamoDB"""
        try:
            self.table.put_item(Item=analysis_item)
            logger.info("Analysis created", extra={"analysisId": analysis_item["analysisId"]})
            return analysis_item
        except Exception as e:
            logger.exception("Failed to create analysis")
            raise
    
    @tracer.capture_method
    def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis by ID"""
        try:
            response = self.table.get_item(
                Key={
                    "pk": f"ID#{analysis_id}",
                    "sk": "METADATA"
                }
            )
            return response.get("Item")
        except Exception as e:
            logger.exception("Error getting analysis")
            raise
    
    @tracer.capture_method
    def update_analysis(
        self, 
        analysis_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an analysis record"""
        try:
            # Validate status if included
            if 'status' in updates:
                if not isinstance(updates['status'], AnalysisStatus):
                    raise ValidationError(f"Invalid status: {updates['status']}")
            
            update_expr = 'SET ' + ', '.join(f'#{k} = :{k}' for k in updates.keys())
            update_expr += ', lastUpdatedAt = :lastUpdatedAt'
            
            expr_names = {f'#{k}': k for k in updates.keys()}
            expr_values = {f':{k}': v for k, v in updates.items()}
            expr_values[':lastUpdatedAt'] = datetime.utcnow().isoformat() + 'Z'
            
            response = self.table.update_item(
                Key={
                    'pk': f'ID#{analysis_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info("Analysis updated", extra={
                "analysisId": analysis_id,
                "updates": updates
            })
            
            return response['Attributes']
            
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            logger.warning("Analysis not found for update", extra={"analysisId": analysis_id})
            raise AnalysisNotFoundException(f"Analysis not found: {analysis_id}")
        except Exception as e:
            logger.exception("Failed to update analysis")
            raise

    @tracer.capture_method
    def list_analyses(
        self, 
        limit: int = 50, 
        next_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """List analyses with pagination using the createdAtIndex GSI"""
        try:
            current_year_month = datetime.utcnow().strftime("%Y-%m")
            
            params = {
                'IndexName': 'createdAtIndex',
                'KeyConditionExpression': 'yearMonth = :ym',
                'ExpressionAttributeValues': {
                    ':ym': current_year_month
                },
                'Limit': limit,
                'ScanIndexForward': False  # Sort descending
            }
            
            if next_token:
                try:
                    params['ExclusiveStartKey'] = json.loads(
                        base64.b64decode(next_token.encode()).decode()
                    )
                except Exception:
                    raise ValidationError("Invalid next token")
            
            # Query current month
            response = self.table.query(**params)
            items = response.get('Items', [])
            
            # Query previous month if needed
            if len(items) < limit and 'LastEvaluatedKey' not in response:
                previous_month = self._get_previous_month(current_year_month)
                params['ExpressionAttributeValues'] = {':ym': previous_month}
                
                prev_response = self.table.query(**params)
                items.extend(prev_response.get('Items', [])[:limit - len(items)])
                
                if 'LastEvaluatedKey' in prev_response and len(items) == limit:
                    response['LastEvaluatedKey'] = prev_response['LastEvaluatedKey']
            
            result = {
                'items': items[:limit],
                'fetchedAt': datetime.utcnow().isoformat() + 'Z'
            }
            
            if 'LastEvaluatedKey' in response:
                result['nextToken'] = base64.b64encode(
                    json.dumps(response['LastEvaluatedKey']).encode()
                ).decode()
            
            logger.info("Listed analyses", extra={
                "itemCount": len(items),
                "hasNextToken": 'nextToken' in result
            })
            
            return result
            
        except Exception as e:
            logger.exception("Failed to list analyses")
            raise

    def _get_previous_month(self, year_month: str) -> str:
        """Helper to get the previous month in YYYY-MM format"""
        year, month = map(int, year_month.split('-'))
        if month == 1:
            return f"{year-1}-12"
        return f"{year}-{month-1:02d}" 

    @tracer.capture_method
    def update_page_content(
        self,
        analysis_id: str,
        object_key: str,
        page_number: int,
        content: str,
        token_input: int,
        token_output: int
    ) -> Dict[str, Any]:
        """Updates a specific page's content in an analysis"""
        try:
            # Get current analysis
            analysis = self.get_analysis(analysis_id)
            
            # Find the object
            for obj in analysis.get('objectsData', []):
                if obj['object'] == object_key:
                    # Initialize data array if not exists
                    if 'data' not in obj:
                        obj['data'] = []
                    
                    # Find or create page entry
                    page_entry = None
                    for page in obj['data']:
                        if page.get('page') == page_number:
                            page_entry = page
                            break
                    
                    if not page_entry:
                        page_entry = {'page': page_number}
                        obj['data'].append(page_entry)
                    
                    # Update page content and tokens
                    page_entry['content'] = content
                    page_entry['tokenInput'] = token_input
                    page_entry['tokenOutput'] = token_output
                    
                    # Update object level token counts
                    obj['tokenInput'] = sum(
                        p.get('tokenInput', 0) 
                        for p in obj['data']
                    )
                    obj['tokenOutput'] = sum(
                        p.get('tokenOutput', 0) 
                        for p in obj['data']
                    )
                    
                    # Update the analysis
                    return self.update_analysis(
                        analysis_id=analysis_id,
                        updates={'objectsData': analysis['objectsData']}
                    )
            
            raise ValidationError(f"Object {object_key} not found")
            
        except Exception as e:
            logger.exception(
                "Error updating page content",
                extra={
                    "analysisId": analysis_id,
                    "objectKey": object_key,
                    "page": page_number
                }
            )
            raise

    @tracer.capture_method
    def update_status(self, unique_id: str, status: AnalysisStatus) -> AnalysisItem:
        """
        Updates the status of an analysis
        """
        now = datetime.utcnow().isoformat() + 'Z'
        
        response = self.table.update_item(
            Key={
                'pk': f'ID#{unique_id}',
                'sk': 'METADATA'
            },
            UpdateExpression='SET #status = :status, lastUpdatedAt = :lastUpdatedAt',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': status,
                ':lastUpdatedAt': now
            },
            ReturnValues='ALL_NEW'
        )
        
        return response['Attributes']