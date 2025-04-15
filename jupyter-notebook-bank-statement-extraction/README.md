# Bank Statement Data Extraction with AWS Bedrock

This project demonstrates how to extract structured transaction data from bank statements using AWS Bedrock and Claude 3.5 Sonnet. The solution uses a Jupyter notebook to process PDF bank statements, extract text and images, and then leverage generative AI to parse and structure the financial data.

## Architecture Overview

The solution implements a multi-step process:

- **PDF Processing**: Convert PDF bank statements to high-quality images
- **Text Extraction**: Extract raw text from PDFs using pdfminer
- **Image Analysis**: Process images with AWS Bedrock and Claude 3.5 Sonnet
- **Data Extraction**: Parse financial transactions from the AI-generated content
- **Output Generation**: Create structured CSV output of transaction data

### Workflow

1. PDF bank statement is loaded and converted to high-resolution images
2. Each page is processed individually through AWS Bedrock
3. Claude 3.5 Sonnet analyzes the document and extracts structured content
4. A second AI pass categorizes and formats transaction data
5. Results are compiled into a standardized CSV format

## Prerequisites

- Python 3.8+
- Jupyter Notebook environment
- AWS account with Bedrock access
- Configured AWS credentials with Bedrock permissions
- Poppler library for PDF processing

## Required Libraries

- pdf2image
- boto3
- pillow
- PyMuPDF
- PyPDF2
- pdfminer.six

## Getting Started

### Environment Setup

```bash
# Install Poppler (required for pdf2image)
conda install -c conda-forge poppler -y

# Install Python dependencies
pip install pdf2image boto3 pillow PyMuPDF PyPDF2 pdfminer.six
```

### Running the Notebook

1. Place your bank statement PDF in the same directory as the notebook
2. Update the `pdf_path` variable to point to your PDF file
3. Configure your AWS credentials and region
4. Run the notebook cells sequentially

## Features

- **Multi-page Support**: Process bank statements with any number of pages
- **High-resolution Image Processing**: Enhances document readability for AI analysis
- **Structured Data Extraction**: Extracts key transaction details:
  - Currency
  - Transaction date
  - Transaction type (credit/debit)
  - Transaction category
  - Amount
  - Transaction details
  - Page number
- **CSV Output**: Generates standardized CSV output for further analysis

## Transaction Categorization

The solution categorizes transactions into the following types:

- Bank Opening
- Bank Closing
- Deposits
- Withdrawal
- Bank Fee & Other Charges
- Revenues
- Expenses
- Dividend Received
- Interest Received

## Limitations and Considerations

- Processing large PDFs may require significant memory resources
- AWS Bedrock usage incurs costs based on token consumption
- The solution works best with clearly formatted bank statements
- Multi-language support is available but may require additional validation
- Processing time increases linearly with the number of pages
