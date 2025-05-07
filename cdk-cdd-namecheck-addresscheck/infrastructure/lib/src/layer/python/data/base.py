from typing import Dict, Any, Optional
from aws_lambda_powertools import Logger, Tracer

# Initialize powertools
logger = Logger()
tracer = Tracer()

class BaseDataUtil:
    """Base class for data utilities with common functionality"""

    def __init__(self, table_name: str):
        """Initialize BaseDataUtil with DynamoDB table name
        
        Args:
            table_name: Name of the DynamoDB table
        """
        import boto3
        self.table = boto3.resource('dynamodb').Table(table_name)
    
    @tracer.capture_method
    def get_item(
        self, 
        pk: str, 
        sk: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get an item from DynamoDB
        
        Args:
            pk: Partition key
            sk: Sort key (optional)
            
        Returns:
            Item if found, None otherwise
        """
        try:
            key = {'pk': pk}
            if sk:
                key['sk'] = sk
                
            response = self.table.get_item(Key=key)
            return response.get('Item')
            
        except Exception as e:
            logger.exception("Error getting item from DynamoDB")
            raise
    
    @tracer.capture_method
    def put_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Put an item into DynamoDB
        
        Args:
            item: Item to put
            
        Returns:
            The item that was put
        """
        try:
            self.table.put_item(Item=item)
            return item
            
        except Exception as e:
            logger.exception("Error putting item to DynamoDB")
            raise
    
    @tracer.capture_method
    def update_item(
        self,
        pk: str,
        sk: Optional[str],
        updates: Dict[str, Any],
        condition_expression: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an item in DynamoDB
        
        Args:
            pk: Partition key
            sk: Sort key (optional)
            updates: Dictionary of updates to apply
            condition_expression: Optional condition expression
            
        Returns:
            Updated item
        """
        try:
            # Build key
            key = {'pk': pk}
            if sk:
                key['sk'] = sk
            
            # Build update expression
            update_expr = 'SET ' + ', '.join(f'#{k} = :{k}' for k in updates.keys())
            expr_names = {f'#{k}': k for k in updates.keys()}
            expr_values = {f':{k}': v for k, v in updates.items()}
            
            # Build update parameters
            update_params = {
                'Key': key,
                'UpdateExpression': update_expr,
                'ExpressionAttributeNames': expr_names,
                'ExpressionAttributeValues': expr_values,
                'ReturnValues': 'ALL_NEW'
            }
            
            if condition_expression:
                update_params['ConditionExpression'] = condition_expression
            
            response = self.table.update_item(**update_params)
            return response['Attributes']
            
        except Exception as e:
            logger.exception("Error updating item in DynamoDB")
            raise 