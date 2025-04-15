# KMS Key Protection Utility

This utility automatically identifies and protects important AWS KMS keys that have been accidentally scheduled for deletion. It scans all KMS keys in your account, identifies those marked for deletion, and automatically cancels the deletion process for keys tagged as important.

## Key Benefits

- **Prevent Accidental Key Deletion**: Automatically cancel deletion of important KMS keys
- **Batch Processing**: Handle hundreds or thousands of KMS keys efficiently
- **Customizable Protection**: Define which keys are important through tagging
- **Detailed Reporting**: Comprehensive logs of all operations and decisions
- **Safety First**: Default dry-run mode prevents accidental changes

## Architecture Overview

The solution consists of a Node.js script that:

1. Retrieves all KMS keys in the specified AWS region
2. Identifies keys scheduled for deletion
3. Checks if these keys have the "important" tag
4. Cancels deletion for tagged keys (if not in dry-run mode)
5. Provides detailed reporting of actions taken

## Prerequisites

- AWS Account with access to KMS
- Node.js 14.x or later
- npm package manager
- IAM permissions to list, describe, and modify KMS keys

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## IAM Permissions

The script requires the following IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReviewPendingDeletionKeyPolicy",
      "Effect": "Allow",
      "Action": [
        "kms:ListKeys",
        "kms:DescribeKey",
        "kms:CancelKeyDeletion",
        "kms:ListResourceTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## Configuration

### AWS Credentials

The script uses the standard AWS SDK credential resolution:

1. AWS IAM Role (if running on AWS services like EC2, Lambda, etc.)
2. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
3. Shared credentials file (~/.aws/credentials)
4. AWS config file (~/.aws/config)

### Script Configuration

Edit the `index.js` file to modify these settings:

- `region`: AWS region to scan (default: ap-east-1)
- `dryRunMode`: Set to `false` to enable actual cancellation of key deletions (default: `true`)

### Important Tag Definition

By default, keys with the following tag are considered important:

- Tag Key: `cust_important`
- Tag Value: `yes`

You can modify the `checkIfImportantTagExists()` function in `index.js` to customize this logic.

## Usage

Run the script with:

```bash
node index.js
```

Or using npm:

```bash
npm start
```

## How It Works

1. The script lists all KMS keys in the specified region
2. For each key, it checks if the key is scheduled for deletion
3. If a key is scheduled for deletion, it checks for the important tag
4. If the important tag exists, it cancels the deletion (unless in dry-run mode)
5. It provides a detailed report of all actions taken

## Example Logs

### When there are no keys marked for deletion

```bash
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): Getting All Keys from AWS KMS
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): Retrieved 1 keys
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): Begin to retrieve each key's status
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf] Check if it is pending for deletion: false
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): Found 0 marked as pending deletion. List of pending deletion keys: NA
Thu Jul 27 2023 12:35:11 GMT+0800 (China Standard Time): No pending deletion key. Job exits
```

### When there is one key marked for deletion with the important tag

```bash
Thu Jul 27 2023 12:29:31 GMT+0800 (China Standard Time): Getting All Keys from AWS KMS
Thu Jul 27 2023 12:29:31 GMT+0800 (China Standard Time): Retrieved 1 keys
Thu Jul 27 2023 12:29:31 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:31 GMT+0800 (China Standard Time): Begin to retrieve each key's status
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Begin to retrieve each key's status
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf] Check if it is pending for deletion: true
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Found 1 marked as pending deletion. List of pending deletion keys: 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Going to fetch tags for these deleted keys
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf] Fetching tags
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf is still important: true. Tags retrieved [{"TagKey":"cust_important","TagValue":"yes"}]
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): 1 key(s) require(s) to cancel deletion: 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): [cancelDeletionKey] Requesting to cancel deletion
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): [cancelDeletionKey] Requested to cancel deletion
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Job completed.
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Examined keys: 1
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Marked for deletion: 1
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Cancelled deletion: 1
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Marked for deletion:
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): - 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): Cancelled deletion:
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): - 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 12:29:44 GMT+0800 (China Standard Time): ---------------------------------------
```

### When there are multiple keys with mixed tag status

```bash
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): Getting All Keys from AWS KMS
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): Retrieved 803 keys
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): Begin to retrieve each key's status
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf] Check if it is pending for deletion: true
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [01206f51-febb-40ce-b528-60f4c3376de8] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [019a4f6f-a5f5-4b9c-9b1e-6a20f7a7ebb1] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [01ecbef4-ddde-4a82-91e4-0f1685030dfb] Check if it is pending for deletion: true
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [02683c6f-59d3-43b3-8794-43deda7f7eef] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [02c8be57-1191-4139-a659-f6e335c19772] Check if it is pending for deletion: true
Thu Jul 27 2023 13:14:23 GMT+0800 (China Standard Time): [030cb9dc-20b8-4e1b-bcca-1d7898678dab] Check if it is pending for deletion: true
Thu Jul 27 2023 13:14:24 GMT+0800 (China Standard Time): [0320bfa4-0870-400c-8ec5-579b79770f77] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:24 GMT+0800 (China Standard Time): [0439d7e7-dc71-4d05-a5f0-18330da6266c] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:24 GMT+0800 (China Standard Time): [04e00736-fe1c-40f8-903e-79833ad17c74] Check if it is pending for deletion: false
Thu Jul 27 2023 13:14:24 GMT+0800 (China Standard Time): [05275a53-5471-43be-848c-92727b6d7154] Check if it is pending for deletion: false
.... removed for brevity ....
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Found 6 marked as pending deletion. List of pending deletion keys: 00a4b714-0534-4244-8837-6ea232efccaf,01ecbef4-ddde-4a82-91e4-0f1685030dfb,02c8be57-1191-4139-a659-f6e335c19772,0320bfa4-0870-400c-8ec5-579b79770f77,0439d7e7-dc71-4d05-a5f0-18330da6266c,04e00736-fe1c-40f8-903e-79833ad17c74
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Going to fetch tags for these deleted keys
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [00a4b714-0534-4244-8837-6ea232efccaf is still important: false . Tags retrieved []
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [01ecbef4-ddde-4a82-91e4-0f1685030dfb] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [01ecbef4-ddde-4a82-91e4-0f1685030dfb is still important: false . Tags retrieved []
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [02c8be57-1191-4139-a659-f6e335c19772] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [02c8be57-1191-4139-a659-f6e335c19772 is still important: true ****. Tags retrieved [{"TagKey":"cust_important","TagValue":"yes"}]
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0320bfa4-0870-400c-8ec5-579b79770f77] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0320bfa4-0870-400c-8ec5-579b79770f77 is still important: true ****. Tags retrieved [{"TagKey":"cust_important","TagValue":"yes"}]
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0439d7e7-dc71-4d05-a5f0-18330da6266c] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0439d7e7-dc71-4d05-a5f0-18330da6266c is still important: true ****. Tags retrieved [{"TagKey":"cust_important","TagValue":"yes"}]
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [04e00736-fe1c-40f8-903e-79833ad17c74] Fetching tags
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [04e00736-fe1c-40f8-903e-79833ad17c74 is still important: true ****. Tags retrieved [{"TagKey":"cust_important","TagValue":"yes"}]
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): 4 key(s) require(s) to cancel deletion: 02c8be57-1191-4139-a659-f6e335c19772,0320bfa4-0870-400c-8ec5-579b79770f77,0439d7e7-dc71-4d05-a5f0-18330da6266c,04e00736-fe1c-40f8-903e-79833ad17c74
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [02c8be57-1191-4139-a659-f6e335c19772] Requesting to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [02c8be57-1191-4139-a659-f6e335c19772] Requested to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0320bfa4-0870-400c-8ec5-579b79770f77] Requesting to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0320bfa4-0870-400c-8ec5-579b79770f77] Requested to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0439d7e7-dc71-4d05-a5f0-18330da6266c] Requesting to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [0439d7e7-dc71-4d05-a5f0-18330da6266c] Requested to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [04e00736-fe1c-40f8-903e-79833ad17c74] Requesting to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): [04e00736-fe1c-40f8-903e-79833ad17c74] Requested to cancel deletion
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Job completed.
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Examined keys: 803
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Marked for deletion: 6
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Cancelled deletion: 4
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Retained for deletion (i.e. keep for deletion scheduling, will be deleted): 2
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): ---------------------------------------
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Marked for deletion:
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 01ecbef4-ddde-4a82-91e4-0f1685030dfb
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 02c8be57-1191-4139-a659-f6e335c19772
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 0320bfa4-0870-400c-8ec5-579b79770f77
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 0439d7e7-dc71-4d05-a5f0-18330da6266c
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 04e00736-fe1c-40f8-903e-79833ad17c74
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Cancelled deletion:
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 02c8be57-1191-4139-a659-f6e335c19772
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 0320bfa4-0870-400c-8ec5-579b79770f77
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 0439d7e7-dc71-4d05-a5f0-18330da6266c
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 04e00736-fe1c-40f8-903e-79833ad17c74
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): Retained for deletion (i.e. keep for deletion scheduling, will be deleted):
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 00a4b714-0534-4244-8837-6ea232efccaf
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): - 01ecbef4-ddde-4a82-91e4-0f1685030dfb
Thu Jul 27 2023 13:16:36 GMT+0800 (China Standard Time): ---------------------------------------
```

## Deployment Options

This utility can be deployed in several ways:

1. **Local Execution**: Run manually or via scheduled tasks on a workstation
2. **EC2 Instance**: Deploy on an EC2 instance with appropriate IAM role
3. **Lambda Function**: Convert to a Lambda function triggered on a schedule
4. **ECS Task**: Run as a scheduled ECS task

## Security Considerations

- **IAM Permissions**: Use the least privilege principle when assigning permissions
- **Logging**: Consider sending logs to CloudWatch for audit purposes
- **Notifications**: Add SNS notifications for cancelled deletions
- **Encryption**: Ensure AWS credentials are properly secured
- **Monitoring**: Track execution success/failure with CloudWatch metrics

## AWS API Rate Limits

This script respects AWS KMS API rate limits:

- ListKeys: 500 tps
- ListResourceTags: 2000 tps
- DescribeKey: 2000 tps
- CancelKeyDeletion: 5 tps

## Customization

### Adding Custom Tag Logic

To modify which keys are considered important, edit the `checkIfImportantTagExists` function in `index.js`:

```javascript
const checkIfImportantTagExists = (tags) => {
  // Customize this logic to match your tagging strategy
  return tags.some(
    (tag) => tag.TagKey === "cust_important" && tag.TagValue === "yes",
  );
};
```

### Adding Notifications

You can add SNS notifications by integrating the AWS SDK SNS client:

```javascript
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sendNotification = async (message, subject) => {
  const snsClient = new SNSClient({ region });
  const params = {
    TopicArn: "your-sns-topic-arn",
    Message: message,
    Subject: subject,
  };
  return snsClient.send(new PublishCommand(params));
};
```
