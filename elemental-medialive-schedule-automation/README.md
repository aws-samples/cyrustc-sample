# Elemental MediaLive Schedule Automation

This project provides an automated solution for scheduling AWS Elemental MediaLive channels using AWS CDK infrastructure. It enables the automatic starting and stopping of MediaLive channels based on predefined schedules, with health checks and comprehensive notification systems.

## Architecture Overview

The solution implements a serverless architecture that combines several AWS services:

- **DynamoDB**: Stores media channel scheduling information
- **Step Functions**: Orchestrates the workflow for starting/stopping channels
- **EventBridge Scheduler**: Triggers workflows at scheduled times
- **Lambda Functions**: Perform validation, health checks, and stream processing
- **SNS**: Sends notifications about channel status

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   DynamoDB    │────▶│  EventBridge  │────▶│ Step Functions│
│   (Schedule)  │     │   Scheduler   │     │  (Workflow)   │
│               │     │               │     │               │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                                           │
        │ Stream                                    │
        ▼                                           ▼
┌───────────────┐                          ┌───────────────┐     ┌───────────────┐
│  EventBridge  │                          │   MediaLive   │     │      SNS      │
│     Pipe      │                          │   Channel     │────▶│ Notifications │
│               │                          │               │     │               │
└───────┬───────┘                          └───────────────┘     └───────────────┘
        │                                           ▲
        │                                           │
        ▼                                           │
┌───────────────┐                          ┌───────────────┐
│    Lambda     │                          │    Lambda     │
│   Processor   │                          │ Health Check  │
│               │                          │               │
└───────────────┘                          └───────────────┘
```

### Workflow Process

1. Channel schedules are stored in DynamoDB
2. A DynamoDB stream triggers EventBridge Pipe when records change
3. EventBridge Scheduler creates schedules for each channel start time
4. Step Functions orchestrates the channel start/stop sequence:
   - Updates workflow ID in DynamoDB
   - Starts the MediaLive channel
   - Performs health checks on the channel
   - Sends status notifications via SNS
   - Waits until the scheduled end time
   - Stops the channel and sends a final notification

## Key Components

- **MediaWorkflow**: Manages the Step Functions state machine for channel operations
- **MediaRecordWorkflow**: Processes DynamoDB streams and manages schedules
- **MediaSchedulerTable**: DynamoDB table for storing channel schedules
- **Lambda Functions**:
  - **validation**: Validates schedule records format and parameters
  - **health-check**: Verifies MediaLive channel health by checking stream manifests
  - **stream-processor**: Processes DynamoDB streams to create/manage schedules

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18 or later
- AWS CDK v2 installed

## Getting Started

### Install Dependencies

```bash
npm install
```

### Deploy the CDK Stack

```bash
npx cdk deploy --all --require-approval never
```

Or using the npm script:

```bash
npm run deploy
```

## Usage

### Schedule Format

Add records to the DynamoDB table with the following structure:

```json
{
  "mediaChannelId": "123456",
  "startDateTime": "2023-12-01T10:00:00Z",
  "endDateTime": "2023-12-01T11:00:00Z",
  "manifestUrl": "https://example.com/manifest.m3u8"
}
```

Where:

- `mediaChannelId`: The AWS Elemental MediaLive channel ID (numeric)
- `startDateTime`: The ISO8601 formatted start time in UTC
- `endDateTime`: The ISO8601 formatted end time in UTC
- `manifestUrl`: URL to the HLS or DASH manifest for health checks

The system will:

1. Create a schedule to start the channel 10 minutes before the start time
2. Monitor the channel health during operation
3. Stop the channel at the specified end time
4. Send notifications at each stage of the process

## Notifications

Email notifications are sent for the following events:

- Channel starting
- Channel started and healthy
- Channel unhealthy (failed health check)
- Channel stopped

## Development

### Project Structure

```
.
├── bin/                      # CDK app entry point
├── lib/                      # Main CDK constructs
│   ├── constructs/           # Custom constructs for the application
│   └── elemental-medialive-automation-stack.ts  # Main stack definition
├── lambda/                   # Lambda functions
│   ├── health-check/         # Channel health verification
│   ├── stream-processor/     # DynamoDB stream processor
│   └── validation/           # Schedule data validation
└── test/                     # Tests for the CDK infrastructure
```
