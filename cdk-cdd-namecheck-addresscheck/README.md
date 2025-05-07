# cdk-cdd-namecheck-addresscheck

> **⚠️ WARNING**: This project is provided for demonstration purposes only. It is not intended for direct production use without thorough review and modification. Use with extra care and ensure independent security and architecture review before deploying in any production environment.

This project is a showcase implementation of an AI-powered identity verification system for financial services using AWS CDK. It demonstrates how generative AI can streamline the verification of customer-submitted documents (such as identity cards and address proof) against the information provided in online forms, reducing manual effort for back-office operations teams.

## Business Problem

In many financial and business applications, customers must:

1. Fill out online forms with personal information
2. Submit supporting documents (ID cards, utility bills, etc.) as proof
3. Wait for manual verification by back-office staff

This traditional verification process creates significant operational challenges. Back-office teams spend countless hours manually comparing document information against submitted form data, leading to inefficiencies and potential human errors. As customer bases grow, these manual processes become increasingly difficult to scale without proportionally increasing staff. Additionally, the extended verification times frustrate customers who must wait for approval before accessing services, negatively impacting their experience and satisfaction.

## Demo Overview

This showcase demonstrates how generative AI can pre-vet submitted documents against form data, highlighting discrepancies and allowing operations staff to focus only on exceptions that require human judgment.

The showcase implements a distributed architecture with three main components:

- **Backend Infrastructure**:

  - AWS CDK-defined serverless architecture
  - DynamoDB tables for data persistence
  - Step Functions workflows for document processing
  - Lambda functions for API implementation
  - S3 buckets for secure document storage
  - AI-powered document analysis and verification

- **Operational Frontend**:

  - React-based admin interface for back-office staff
  - Built with AWS Cloudscape Design System
  - AI-assisted verification results visualization
  - Highlights discrepancies between documents and form data
  - Approval/rejection workflow
  - AI-generated email templates for customer communication

- **Public Customer Website**:
  - Example Next.js/React-based customer-facing interface
  - Multi-step onboarding process

### Key AI Features

- **Document Information Extraction**:

  - Extracts name, address, and other key information from uploaded documents
  - Supports various document formats (ID cards, utility bills, bank statements)
  - Handles different document layouts and formats

- **Cross-Verification**:

  - Compares extracted document information with customer-provided form data
  - Identifies discrepancies and potential issues
  - Provides confidence scores for verification results

- **Automated Communication**:
  - Generates contextual email templates for clarification requests
  - Tailors communication based on specific verification issues
  - Reduces time spent on routine customer correspondence

## System Architecture

- **Data Storage**:

  - DynamoDB tables with optimized access patterns
  - S3 for document storage with server-side encryption
  - Proper partitioning for high-throughput scenarios

- **Processing Pipeline**:

  - Step Functions for orchestrating verification workflows
  - Lambda functions for business logic
  - EventBridge for event-driven architecture
  - AI-powered document analysis and verification

- **API Layer**:
  - REST API with comprehensive endpoints
  - Secure authentication and authorization
  - Proper error handling and validation
  - Swagger/OpenAPI documentation

## Prerequisites

- Node.js >= 14.x
- AWS CDK >= 2.x
- AWS CLI configured with appropriate credentials
- Python 3.11 for Lambda functions
- Docker for local development

## Project Structure

```
.
├── infrastructure/           # CDK infrastructure code
│   ├── bin/                  # CDK app entry point
│   ├── lib/                  # CDK constructs and stacks
│   │   ├── config/           # Environment configuration
│   │   ├── constructs/       # Reusable CDK constructs
│   │   ├── src/              # Lambda source code
│   │   ├── stacks/           # CDK stack definitions
│   │   └── types/            # TypeScript type definitions
│   ├── test/                 # Infrastructure tests
│   └── swagger.yaml          # API definition
├── frontend/                 # Operational frontend (React)
│   ├── src/                  # Frontend source code
│   │   ├── modules/          # Feature modules
│   │   │   ├── analysis/     # Analysis module
│   │   │   ├── core/         # Core components
│   │   │   └── onboarding/   # Onboarding module
│   │   └── App.tsx           # Main application component
│   └── public/               # Static assets
└── public-website/           # Customer-facing website (Next.js)
    ├── app/                  # Next.js app directory
    │   ├── sign-up/          # Sign-up flow pages
    │   └── page.tsx          # Home page
    └── src/                  # Source code
        └── modules/          # Feature modules
            ├── auth/         # Authentication module
            ├── core/         # Core components
            └── home/         # Home page components
```

## Getting Started

### Initialize the Project

```bash
# Clone the repository
git clone https://github.com/your-org/cdk-cdd-namecheck-addresscheck.git
cd cdk-cdd-namecheck-addresscheck
```

### Deployment Steps

Follow these steps in the correct order to deploy the application:

1. **Configure Amazon Bedrock Prompts**

   First, manually add the required prompts to Amazon Bedrock Prompt Management (see the "Configure Amazon Bedrock Prompts" section below for details).

2. **Build the Frontend Applications**

   ```bash
   # Build the operational frontend
   cd frontend
   npm install
   npm run build

   # Build the public website
   cd ../public-website
   npm install
   npm run build
   ```

3. **Deploy the Infrastructure**

   ```bash
   # Install dependencies and deploy the CDK infrastructure
   cd ../infrastructure
   npm install
   cdk deploy --all
   ```

   After deployment, CDK will output:

   - API Gateway endpoints
   - S3 bucket names
   - DynamoDB table names
   - CloudFront distribution domains

### Configure Amazon Bedrock Prompts

This project requires three prompts to be manually added to Amazon Bedrock Prompt Management:

1. **Prompt: "convert-document-page-to-markdown"**

   ```
   You are an expert financial document analyst with exceptional attention to detail and proficiency in multiple languages. I will present you with a document from a financial institution, which may be one page of a multi-page statement. This document may contain text in multiple languages. Your task is to meticulously examine every single element of this document and then reproduce its content in markdown format. Absolute precision and completeness are crucial. No detail is too small to reproduce, regardless of the language it's presented in. Approach this task as if overlooking even the tiniest piece of information could have significant consequences. Pay attention to:
   1. The main body of text
   2. Any headers or footers
   3. All corners of the document, especially the top right corner
   4. Any tables, charts, or graphs
   5. Footnotes or fine print
   6. Logos, watermarks, or other branding elements
   7. Date stamps or page numbers
   8. Account numbers or other identifying information
   As you analyze the document:
   - Create a mental map of its layout and content.
   - Identify all languages present in the document.
   - Translate any non-English text you encounter, providing both the original text and its English translation.
   - Note any discrepancies or differences in information presented in different languages.
   When reproducing the document content:
   1. Output the document in markdown format.
   2. Keep rows and columns aligned for all tables, even if they break across pages.
   3. To retain all headers and table content, they cannot be omitted
   4. Do not include any preface or explanation; output the document content directly.
   For multi-page documents:
   - Note any page numbers or indications of continuity.
   - Ensure tables that span multiple pages are reproduced in full, maintaining their structure.
   ```

2. **Prompt: "seek-clarification"**

   ```
   You are a customer service representative for a financial institution seeking clarification to a customer who has encountered issues with their online application form to open an online wallet account. The issues may include discrepancies between the information provided in the application and the documents submitted. Your task is to compose an email content to the customer. The specific discrepancies or issues is provided in the "issue" XML tag later. Begin by acknowledging the customer's concerns, express understanding of the importance of accurate information, and conclude with an invitation for further communication to clarify and resolve the discrepancies. Maintain a tone that is respectful and reassuring, emphasizing your commitment to assisting them effectively.

   Your undersigned should be "Onboarding Analyst" and the Instution Name should be "PayBanana".

   Thinking step by step and output your thinking processing in "thinking" XML tag. Then, output your generated email content in "response" XML tag.

   <issue>
   {{issue}}
   </issue>
   ```

3. **Prompt: "verify-name-address"**

   ```
    You are an expert financial data analyst with a keen eye for detail. I will provide you with a markdown-formatted representation of a financial document. Your task is to carefully analyze this content and answer the following questions that can be found in "task" XML tag:
    <task>
    1. Find out the name and the address of the recipient from this document?
    2. Given that the customer inputs their name and address in the online application, please verify if the information are consistent and match between the online application and the document. The input in the online application can be found in the "input" XML tag
    </task>

    Additional guideline for name could be found in "guideline-name" XML tag. Additional guideline for address could be found in "guideline-address" XML tag.

    <guideline-name>
    1. Read the user's provided name:
      - First Name: [User's First Name]
      - Middle Name: [User's Middle Name]
      - Last Name: [User's Last Name]

    2. Recognize the name of the recipient from the document

    3. Normalize both names by:
      - Converting to lowercase
      - Trimming whitespace

    ### Examples for Clarity

    #### Example 1: Western Name
    - **User Input**:
      - First Name: John
      - Middle Name: Michael
      - Last Name: Smith
    - **Financial Document Name**: John M. Smith
    - **Expected Result**: Match (considering abbreviation)

    #### Example 2: Chinese Name (Simple Match)
    - **User Input**:
      - First Name: Wei
      - Last Name: Zhang
    - **Financial Document Name**: Zhang Wei
    - **Expected Result**: Match

    #### Example 3: Chinese Name with Nickname
    - **User Input**:
      - First Name: Ka Man
      - Last Name: Lee
    - **Financial Document Name**: Lee Ka Man John
    - **Expected Result**: No Match (nickname 'John' is required for a match)

    #### Example 4: Western Name with Nickname
    - **User Input**:
      - First Name: William
      - Middle Name: James
      - Last Name: Brown
    - **Financial Document Name**: Will Brown
    - **Expected Result**: No Match (nickname 'Will' without middle name)

    #### Example 5: Chinese Name with Missing Middle Name
    - **User Input**:
      - First Name: Ming
      - Last Name: Li
    - **Financial Document Name**: Li Ming Zhang
    - **Expected Result**: No Match (additional name 'Zhang' is unexpected)

    #### Example 6: Western Name with Variations
    - **User Input**:
      - First Name: Elizabeth
      - Middle Name: Anne
      - Last Name: Taylor
    - **Financial Document Name**: Liz Taylor
    - **Expected Result**: No Match (nickname 'Liz' does not correspond to full name)

    Please ensure to handle variations and possible nicknames appropriately to maximize accuracy.
    </guideline-name>

    <guideline-address>
    1. Read the user's provided address:
      - Address: [User's Address]

    2. Read the address from the financial document:
      - Document Address: [Address as it appears on the document]

    3. Normalize both addresses by:
      - Converting to lowercase
      - Trimming whitespace
      - Standardizing common abbreviations (e.g., "St." to "Street")

    4. Split the addresses into their components for comparison:
      - Identify and separate components such as street number, street name, apartment/flat number, city, state/province, postal code, and country.

    5. Perform the comparison:
      - Match each component of the user input address with the corresponding component of the document address.
      - Return "Match" if all components correspond correctly, otherwise return "No Match."
      - If it is No Match, explain the reason why it is not match in order to reasonate your decision

    ### Examples for Address Verification

    #### Example 1: Exact Match (Residential)
    - **User Input**:
      - Address: 123 Main St, Apt 4B, New York, NY 10001
    - **Financial Document Address**: 123 Main Street, Apartment 4B, New York, NY 10001
    - **Expected Result**: Match (standardized abbreviations)

    #### Example 2: Different Formats
    - **User Input**:
      - Address: 456 Elm Ave, Los Angeles, CA 90001
    - **Financial Document Address**: 456 Elm Avenue, Los Angeles, California, 90001
    - **Expected Result**: Match (abbreviations and full names considered)

    #### Example 3: Missing Components
    - **User Input**:
      - Address: 789 Pine St, Seattle, WA
    - **Financial Document Address**: 789 Pine Street, Seattle, WA 98101
    - **Expected Result**: No Match (missing postal code)

    #### Example 4: International Address Format
    - **User Input**:
      - Address: 123號, 大街, 香港
    - **Financial Document Address**: 123號, 大街, 香港, 999077
    - **Expected Result**: No Match (missing postal code)

    #### Example 5: Abbreviations and Variations
    - **User Input**:
      - Address: 321 Oak St.
    - **Financial Document Address**: 321 Oak Street
    - **Expected Result**: Match (abbreviations handled)

    #### Example 6: Commercial Building with Multiple Occupants
    - **User Input**:
      - Address: Shop 3A-1, 3/F, Golden Plaza, 123 Nathan Road, Mong Kok, Kowloon
    - **Financial Document Address**: Shop 3A-1, Third Floor, Golden Plaza, 123 Nathan Road, Mong Kok, Kowloon
    - **Expected Result**: Match (floor number variations accepted)

    #### Example 7: Shared Commercial Space
    - **User Input**:
      - Address: Unit 5, 25/F (Sharing with ABC Trading Co.), Dragon Centre, 37 Yen Chow Street, Sham Shui Po
    - **Financial Document Address**: Unit 5, 25/F, Dragon Centre, 37 Yen Chow Street, Sham Shui Po
    - **Expected Result**: Match (additional occupant information is supplementary)

    #### Example 8: Multiple Shops in Single Unit
    - **User Input**:
      - Address: Shop B2-G3 (Inside Modern Mall), G/F, 188 Des Voeux Road Central, Hong Kong
    - **Financial Document Address**: Shop B2-G3, Ground Floor, Modern Mall, 188 Des Voeux Road Central, Hong Kong
    - **Expected Result**: Match (mall location variations accepted)

    #### Example 9: Office Building with Suite Numbers
    - **User Input**:
      - Address: Suite 1234-5, 12/F, Central Plaza, 18 Harbour Road, Wan Chai
    - **Financial Document Address**: Room 1234-5, 12th Floor, Central Plaza, 18 Harbour Road, Wan Chai, Hong Kong
    - **Expected Result**: Match (suite/room variations accepted)

    #### Example 10: Commercial Complex with Store Location
    - **User Input**:
      - Address: Store 23A (Next to Main Elevator), 2/F, Metro City Plaza, 1 Wan Fung Street, Fanling
    - **Financial Document Address**: Shop 23A, Second Floor, Metro City Plaza, 1 Wan Fung Street, Fanling
    - **Expected Result**: Match (location description is supplementary)

    #### Example 11: Missing District Information
    - **User Input**:
      - Address: Shop 5, G/F, Lee Building, 789 Canton Road
    - **Financial Document Address**: Shop 5, Ground Floor, Lee Building, 789 Canton Road, Tsim Sha Tsui
    - **Expected Result**: No Match (missing district)

    #### Example 12: Floor Unit vs Entire Floor
    - **User Input**:
      - Address: ABC Shop, 20A, 20/F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Financial Document Address**: ABC Shop, 20/F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Expected Result**: No Match (unit designation '20A' indicates a subdivision of the floor, not entire floor)

    #### Example 13: Company Name Security Check
    - **User Input**:
      - Address: 20/F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Financial Document Address**: ABC Shop, 20/F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Expected Result**: No Match (missing company name could indicate potential fraud attempt)

    #### Example 14: Floor Number vs Flat Letter Designation
    - **User Input**:
      - Address: ABC Shop, 20/F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Financial Document Address**: ABC Shop, 20F, Tower 15, 15 Jaffe Rd, Causeway Bay, Hong Kong
    - **Expected Result**: No Match (20/F indicates 20th floor, while 20F indicates Flat F on 20th floor)

    ### Comprehensive Verification Rules

    1. **Basic Components**:
      - All critical components must be present and match:
        * Unit/shop number
        * Floor number
        * Building name
        * Street number
        * Street name
        * District
        * Postal code (if applicable)

    2. **Floor/Unit Designation**:
      - Forward slash significance:
        * "20/F" = Twentieth Floor
        * "20F" = Flat F on twentieth floor
        * "F/20" = Flat F on twentieth floor
      - Must differentiate between:
        * Entire floor designation (e.g., "20/F")
        * Unit designation (e.g., "20A, 20/F")
        * Flat designation (e.g., "20F")

    3. **Floor Indicators**:
      Accept variations:
      - "G/F" = "Ground Floor" = "GF"
      - "1/F" = "First Floor" = "1st Floor"
      - Must include forward slash for floor numbers

    4. **Company/Business Names**:
      - Must be present in both addresses if included in either
      - Must match exactly
      - Missing company names trigger No Match result

    5. **Supplementary Information**:
      - Location descriptions in parentheses are optional
      - Shared space information is supplementary
      - Building amenity references are optional

    6. **Security Checks**:
      - Verify unit vs. entire floor designation
      - Check company name consistency
      - Flag missing critical components
      - Monitor for potential address hijacking

    7. **Format Standardization**:
      - Convert all inputs to consistent format
      - Standardize abbreviations
      - Normalize spacing and punctuation
      - Handle multiple language variations

    8. **District/Area Verification**:
      - Must be present if specified in either address
      - Must match exactly when provided
      - Consider local district naming conventions

    9. **Building-Specific Rules**:
      - Verify against known building layout
      - Consider multiple occupancy scenarios
      - Check for valid floor/unit combinations

    10. **Risk Assessment**:
        Flag for manual review:
        - Inconsistent company names
        - Floor/unit designation mismatches
        - Missing critical components
        - Unusual format variations

    11. **International Considerations**:
        - Handle multiple address formats
        - Consider country-specific conventions
        - Support multilingual addresses

    12. **Documentation Requirements**:
        Additional verification needed for:
        - Changes in floor designation
        - Company name modifications
        - Unit vs. floor occupancy changes

    Please ensure to handle variations in address formats and common abbreviations appropriately to maximize accuracy.
    </guideline-address>

    Think step-by-step and output your thinking process in "thinking" XML tag.

    Return your answer in json format. example response format can be found in example-response tag. Wrap your response with "response" XML tag.
    <example>
    <example-response>
    {
      "document": {
        "name": "name of the recipient retrieved from document",
        "address": "address of the recipient from document"
        },
      "analysis": {
        "name": {
          "match": boolean,
          "reason": "reason if it is match or not match"
        },
        "address": {
          "match": boolean,
          "reason": "reason if it is match or not match"
        }
      }

    }
    </example-response>
    </example>

    <document>
    {{document}}
    </document>

    <input>
    {{input}}
    </input>
   ```

   Note: The full guidelines for name and address matching are extensive. Please refer to the project documentation for complete prompt details.

### Run the Applications

After deployment, you can run the applications locally for development or via the deployed cloudefront site:

#### Operational Frontend

```bash
cd frontend
npm install
npm start
```

#### Public Website

```bash
cd public-website
npm install
npm run dev
```
