import os
import boto3
import PyPDF2
from io import BytesIO
from typing import Dict, Any, List
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from data.analysis import AnalysisUtil

logger = Logger()
tracer = Tracer()

s3_client = boto3.client('s3')
analysis_util = AnalysisUtil(os.environ['ANALYSIS_TABLE_NAME'])
BUCKET_NAME = os.environ['BUCKET_NAME']

@tracer.capture_method
def extract_pdf_metadata(bucket: str, key: str) -> Dict[str, Any]:
    """Extract metadata from PDF file in S3"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        pdf_content = response['Body'].read()
        
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        num_pages = len(pdf_reader.pages)
        
        # Create page tasks for this object
        page_tasks = []
        for page_num in range(1, num_pages + 1):
            page_tasks.append({
                'objectKey': key,
                'pageNumber': page_num,
                'totalPages': num_pages
            })
        
        return {
            'object': key,
            'numberOfPages': num_pages,
            'pageTasks': page_tasks  # Tasks for this object's pages
        }
        
    except Exception as e:
        logger.exception(f"Error extracting PDF metadata from {key}")
        raise

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for extracting PDF metadata"""
    try:
        analysis_id = event['analysisId']
        objects_data = event['objectsData']
        
        # Extract metadata from each PDF
        processed_objects = []
        page_tasks = []  # Collect all page tasks
        
        for obj_data in objects_data:
            key = obj_data['object']
            metadata = extract_pdf_metadata(BUCKET_NAME, key)
            processed_objects.append({
                'object': metadata['object'],
                'numberOfPages': metadata['numberOfPages'],
                'data': []  # Initialize empty data array for pages
            })
            
            # Add this object's page tasks to the overall list
            for page_num in range(1, metadata['numberOfPages'] + 1):
                page_tasks.append({
                    'objectKey': key,
                    'pageNumber': page_num,
                    'totalPages': metadata['numberOfPages']
                })
        
        # Update analysis with metadata
        analysis_util.update_analysis(
            analysis_id=analysis_id,
            updates={'objectsData': processed_objects}
        )
        
        logger.info("PDF metadata extracted", extra={
            "analysisId": analysis_id,
            "objectCount": len(processed_objects),
            "totalPageTasks": len(page_tasks)
        })
        
        return {
            'analysisId': analysis_id,
            'objectsData': processed_objects,
            'pageTasks': page_tasks  # All tasks for Map state
        }
        
    except Exception as e:
        logger.exception("Error in PDF metadata extraction")
        raise