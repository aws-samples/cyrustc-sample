import os
import boto3
import json
import fitz  # PyMuPDF
import io
import base64
from PIL import Image
from typing import Dict, Any, Tuple
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from data.analysis import AnalysisUtil

logger = Logger()
tracer = Tracer()

s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock-runtime')
bedrock_agent = boto3.client('bedrock-agent')
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])

BUCKET_NAME = os.environ['BUCKET_NAME']
MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
PROMPT_ID = "arn:aws:bedrock:us-west-2:694900249028:prompt/BRWZQENLG9"

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
def process_pdf_page(pdf_document: fitz.Document, page_num: int) -> Tuple[str, str]:
    """Process a PDF page to extract text and enhanced image"""
    try:
        # Get text content
        page = pdf_document.load_page(page_num - 1)  # PyMuPDF uses 0-based indexing
        text_content = page.get_text()
        
        # Get enhanced image
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)  # 2x enlargement
        
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=100)
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return text_content, img_str
        
    except Exception as e:
        logger.exception(f"Error processing page {page_num}")
        raise

@tracer.capture_method
def get_page_content(bucket: str, key: str, page_number: int) -> Tuple[str, str]:
    """Get content from a specific page of a PDF"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        pdf_content = response['Body'].read()
        
        # Use memory buffer to avoid disk I/O
        with fitz.open(stream=pdf_content, filetype="pdf") as pdf_document:
            return process_pdf_page(pdf_document, page_number)
            
    except Exception as e:
        logger.exception(f"Error extracting content from page {page_number} of {key}")
        raise

@tracer.capture_method(capture_response=False)
def extract_page_content(text_content: str, image_content: str, page_num: int, total_pages: int) -> Dict[str, Any]:
    """Extract structured content from a page using Bedrock"""
    try:
        # Retrieve prompt from Bedrock Agent
        prompt_text = retrieve_prompt()
        
        request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_content
                            }
                        }
                    ]
                }
            ]
        }

        response = bedrock_client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request)
        )

        response_body = json.loads(response['body'].read())
        extracted_content = response_body['content'][0]['text']
        
        # Get token counts from Bedrock response
        input_tokens = response_body.get('usage', {}).get('input_tokens', 0)
        output_tokens = response_body.get('usage', {}).get('output_tokens', 0)

        return {
            'content': extracted_content,
            'tokenInput': input_tokens,
            'tokenOutput': output_tokens
        }

    except Exception as e:
        logger.exception(f"Error extracting content for page {page_num} using Bedrock")
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for extracting content from a single page"""
    try:
        analysis_id = event['analysisId']
        object_key = event['objectKey']
        page_number = event['pageNumber']
        total_pages = event['totalPages']
        
        # Get page content from PDF
        text_content, image_content = get_page_content(BUCKET_NAME, object_key, page_number)
        
        # Extract content using Bedrock
        result = extract_page_content(text_content, image_content, page_number, total_pages)
        
        logger.info(f"Processed page {page_number}", extra={
            "analysisId": analysis_id,
            "objectKey": object_key,
            "page": page_number,
            "tokenInput": result['tokenInput'],
            "tokenOutput": result['tokenOutput']
        })
        
        # Update analysis with processed page
        analysis_util.update_page_content(
            analysis_id=analysis_id,
            object_key=object_key,
            page_number=page_number,
            content=result['content'],
            token_input=result['tokenInput'],
            token_output=result['tokenOutput']
        )
        
        return {
            'analysisId': analysis_id,
            'objectKey': object_key,
            'pageNumber': page_number,
            'content': result['content'],
            'tokenInput': result['tokenInput'],
            'tokenOutput': result['tokenOutput']
        }
        
    except Exception as e:
        logger.exception("Error processing page content")
        raise