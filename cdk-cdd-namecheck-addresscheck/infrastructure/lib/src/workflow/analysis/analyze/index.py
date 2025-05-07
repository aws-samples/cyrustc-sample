import os
import boto3
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from data.analysis import AnalysisUtil

logger = Logger()
tracer = Tracer()

bedrock_runtime = boto3.client('bedrock-runtime')
bedrock_agent = boto3.client('bedrock-agent')
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])
PROMPT_ID = os.environ['PROMPT_ID']
MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"

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

@tracer.capture_method
def retrieve_prompt(prompt_id: str) -> Dict[str, Any]:
    """Retrieve prompt from Bedrock"""
    try:
        response = bedrock_agent.get_prompt(
            promptIdentifier=prompt_id
        )
        variants = response.get('variants', [])
        if variants and 'templateConfiguration' in variants[0]:
            template_config = variants[0]['templateConfiguration']
            if 'text' in template_config:
                prompt_text = template_config['text'].get('text', '')
                return {
                    'name': response.get('name', 'Unknown Prompt'),
                    'promptText': prompt_text
                }
        raise ValueError("No valid prompt template found in response")
    except Exception as e:
        logger.exception(f"Error retrieving prompt {prompt_id}")
        raise

@tracer.capture_method
def prepare_document_content(objects_data: List[Dict[str, Any]]) -> str:
    """Prepare document content for prompt"""
    documents = []
    for i, obj in enumerate(objects_data, 1):
        contents = [item['content'] for item in obj.get('data', [])]
        if contents:
            document_content = "<document-{0}>\n{1}\n</document-{0}>".format(
                i, 
                '\n'.join(contents)
            )
            documents.append(document_content)
    return "\n\n".join(documents)

@tracer.capture_method
def invoke_bedrock(prompt_content: str) -> Dict[str, Any]:
    """Invoke Bedrock with prepared content"""
    try:
        request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ]
        }

        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request)
        )
        
        response_body = json.loads(response['body'].read())
        raw_content = response_body['content'][0]['text']
        
        # Extract both response and thinking content
        response_content, thinking_content = extract_content_from_tags(raw_content)
        
        if not response_content:
            raise ValueError("No response content found in Bedrock response")
        
        return {
            'content': response_content,
            'thinking': thinking_content,  # This might be None if no thinking tag found
            'inputTokens': response_body.get('usage', {}).get('input_tokens', 0),
            'outputTokens': response_body.get('usage', {}).get('output_tokens', 0)
        }
        
    except Exception as e:
        logger.exception("Error invoking Bedrock")
        raise

@tracer.capture_method
def prepare_prompt_variables(analysis: Dict[str, Any]) -> Dict[str, str]:
    """Prepare variables for prompt template"""
    parameters = analysis.get('analysisParameters', {})
    return {
        'input': f"""First Name: {parameters.get('firstName', '')}
Middle Name: {parameters.get('middleName', '')}
Last Name: {parameters.get('lastName', '')}
Address: {parameters.get('address', '')}"""
    }

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for analyzing document content"""
    try:
        analysis_id = event['analysisId']
        
        # Get analysis record
        analysis = analysis_util.get_analysis(analysis_id)
        objects_data = analysis.get('objectsData', [])
        
        # Get prompt from Bedrock
        prompt_response = retrieve_prompt(PROMPT_ID)
        prompt_name = prompt_response.get('name', 'Unknown Prompt')
        prompt_template = prompt_response.get('promptText', '')
        
        logger.info("Retrieved prompt", extra={
            "promptName": prompt_name,
            "promptTemplate": prompt_template
        })
        
        # Prepare document content
        document_content = prepare_document_content(objects_data)
        
        # Prepare variables for prompt template
        variables = prepare_prompt_variables(analysis)
        
        # Replace all variables in the prompt template
        clean_prompt = prompt_template.replace("{{document}}", document_content)
        clean_prompt = clean_prompt.replace("{{input}}", variables['input'])
        
        logger.info("Prepared clean prompt", extra={
            "cleanPrompt": clean_prompt,
            "variables": variables
        })
                
        # Invoke Bedrock
        result = invoke_bedrock(clean_prompt)
        
        # Prepare analysis results
        analysis_result = {
            'analysis': prompt_name,
            'result': result['content'],
            'thinking': result.get('thinking'),  # Include thinking if available
            'inputToken': result['inputTokens'],
            'outputToken': result['outputTokens']
        }
        
        # Update analysis record
        analysis_util.update_analysis(
            analysis_id=analysis_id,
            updates={'analysisResults': [analysis_result]}
        )
        
        logger.info("Analysis completed", extra={
            "analysisId": analysis_id,
            "promptName": prompt_name,
            "inputTokens": result['inputTokens'],
            "outputTokens": result['outputTokens']
        })
        
        return {
            'analysisId': analysis_id,
            'analysisResults': [analysis_result]
        }
        
    except Exception as e:
        logger.exception("Error in analysis handler")
        raise