import os
import boto3
import re
from typing import Dict, Any, Tuple, Optional
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.validation import validate
from utilities.api_config import app, logger, tracer, metrics
import json

# Initialize Bedrock clients
bedrock_client = boto3.client('bedrock-runtime')
bedrock_agent = boto3.client('bedrock-agent')

MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
PROMPT_ID = "arn:aws:bedrock:us-west-2:694900249028:prompt/FNOCOGP9HZ"

# JSON Schema for request validation
REQUEST_SCHEMA = {
    "type": "object",
    "properties": {
        "issue": {"type": "string", "minLength": 1}
    },
    "required": ["issue"],
    "additionalProperties": False
}

@tracer.capture_method
def retrieve_prompt() -> str:
    """Retrieve prompt from Bedrock"""
    try:
        response = bedrock_agent.get_prompt(
            promptIdentifier=PROMPT_ID
        )
        # Get the prompt text from the first variant's template configuration
        variants = response.get('variants', [])
        if variants and 'templateConfiguration' in variants[0]:
            template_config = variants[0]['templateConfiguration']
            if 'text' in template_config:
                return template_config['text'].get('text', '')
        raise ValueError("No valid prompt template found in response")
    except Exception as e:
        logger.exception(f"Error retrieving prompt {PROMPT_ID}")
        raise

@tracer.capture_method
def extract_content_from_tags(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract content from response and thinking tags"""
    try:
        # Extract response content
        response_pattern = r'<response>(.*?)</response>'
        response_match = re.search(response_pattern, text, re.DOTALL)
        response_content = response_match.group(1).strip() if response_match else None

        # Extract thinking content
        thinking_pattern = r'<thinking>(.*?)</thinking>'
        thinking_match = re.search(thinking_pattern, text, re.DOTALL)
        thinking_content = thinking_match.group(1).strip() if thinking_match else None

        return response_content, thinking_content
    except Exception as e:
        logger.exception("Error extracting tagged content")
        raise

@app.post("/onboarding/email/generate")
@tracer.capture_method
def generate_email() -> Dict[str, Any]:
    """Generate email content based on issue description
    
    Returns the generated email content, thinking process, and token usage information.
    """
    try:
        # Get request data from the app context and validate
        data = app.current_event.json_body
        validate(event=data, schema=REQUEST_SCHEMA)
        
        issue = data["issue"]
        logger.info("Generating email content", extra={"issue": issue})
        
        # Retrieve prompt template and replace variable
        prompt_template = retrieve_prompt()
        prompt = prompt_template.replace("{{issue}}", issue)
        
        # Prepare request for Bedrock
        request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        # Invoke Bedrock model
        response = bedrock_client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request)
        )

        response_body = json.loads(response['body'].read())
        full_content = response_body['content'][0]['text']
        
        # Extract thinking and response content
        response_content, thinking_content = extract_content_from_tags(full_content)
        
        if not response_content:
            raise ValueError("No response content found in Bedrock response")
        
        # Get token counts from Bedrock response
        input_tokens = response_body.get('usage', {}).get('input_tokens', 0)
        output_tokens = response_body.get('usage', {}).get('output_tokens', 0)
        
        # Record metric
        metrics.add_metric(name="EmailContentGenerated", unit=MetricUnit.Count, value=1)
        
        return {
            "content": response_content,
            "thinking": thinking_content or "",  # Return empty string if thinking is None
            "inputToken": input_tokens,
            "outputToken": output_tokens
        }
        
    except Exception as e:
        logger.exception("Error generating email content")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for the generate email content endpoint"""
    return app.resolve(event, context) 