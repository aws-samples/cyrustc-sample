from jsonschema import validate, ValidationError
from typing import Optional
import re

ANALYSIS_ID_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            "description": "Analysis ID must be a valid UUID"
        }
    },
    "required": ["id"]
}

def validate_analysis_id(analysis_id: str) -> Optional[str]:
    """Validates analysis ID format (UUID)
    
    Args:
        analysis_id: The analysis ID to validate
        
    Returns:
        Optional[str]: Error message if invalid, None if valid
    """
    if not analysis_id:
        return "Analysis ID is required"
        
    # UUID format validation
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    if not uuid_pattern.match(analysis_id):
        return "Analysis ID must be a valid UUID"
    
    return None

def validate_path_parameter(param: str) -> bool:
    """Validate that a path parameter exists and matches expected format.
    
    Args:
        param: The path parameter to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not param:
        return False
        
    # Use the same validation as validate_analysis_id but return boolean
    validation_error = validate_analysis_id(param)
    return validation_error is None 