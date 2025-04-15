# Bedrock Agent Streaming Terminal

This project provides an interactive terminal interface for Amazon Bedrock Agents with real-time streaming responses and trace visualization. The solution helps you to quickly visualize and prototype with Bedrock Agents for experimentation, as well as troubleshoot to trace the events (even in multi-agent collaboration mode) and monitor latency.

![Bedrock Agent Streaming Terminal Demo](./readme/process.gif)

## Key Benefits

- **Rapid Prototyping**: Quickly test and iterate on Bedrock Agents without building a full UI
- **Real-time Trace Visualization**: See exactly how your agent processes requests step-by-step
- **Performance Monitoring**: Track latency and processing time for each step of agent execution
- **Multi-agent Debugging**: Troubleshoot complex multi-agent collaboration scenarios
- **Detailed Logging**: Generate JSON-formatted logs for future review and analytics

## Architecture Overview

The solution implements an interactive chat interface for Amazon Bedrock Agent Runtime that:

- Automatically discovers available agents in your AWS account
- Provides an interactive terminal-based chat experience
- Displays streaming responses in real-time
- Visualizes agent trace events with timing information
- Supports multiple agents with easy switching
- Saves chat history for later analysis

### Workflow

1. Available agents are discovered directly from your AWS account
2. User selects an agent from the available options
3. User enters prompts in an interactive terminal session
4. Agent responses and trace events are streamed in real-time
5. Chat history is maintained and can be saved to a JSON file

## Prerequisites

- Python 3.7+
- AWS account with Bedrock access
- Configured AWS credentials with appropriate permissions
- At least one Amazon Bedrock Agent created and deployed

## Required Libraries

- boto3
- colorama

## Getting Started

### Environment Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Configure AWS credentials (if not already configured)
aws configure
```

### Running the Chat Interface

```bash
# Basic usage (uses default AWS credentials)
python chat_interface.py

# With specific agent
python chat_interface.py --agent-id YOUR_AGENT_ID --agent-alias-id YOUR_ALIAS_ID

# With custom AWS region and profile
python chat_interface.py --region us-east-1 --profile your-profile

# With verbose logging
python chat_interface.py --verbose

# Without trace event streaming
python chat_interface.py --no-traces
```

## Features

- **Auto-Discovery**: Automatically finds all available agents in your AWS account
- **Interactive Terminal Interface**: User-friendly command-line chat experience
- **Streaming Responses**: View agent responses as they are generated
- **Trace Visualization**: See the agent's thought process in real-time
- **Multiple Agent Support**: Switch between different agents without restarting
- **Color-Coded Output**: Enhanced readability with colorama formatting
- **Chat History**: Save conversations to JSON files for later analysis
- **Command System**: Built-in commands for help, agent selection, and more

## Available Commands

During the chat session, you can use the following commands:

- `quit` or `exit`: End the chat session
- `save`: Save the current chat history to a JSON file
- `agent`: Select a different agent from the available configurations
- `help`: Display available commands

## Configuration Options

The script supports several command-line arguments:

```
usage: chat_interface.py [-h] [--agent-id AGENT_ID] [--agent-alias-id AGENT_ALIAS_ID]
                        [--region REGION] [--profile PROFILE] [--verbose] [--no-traces]

Bedrock Agent Chat Interface

optional arguments:
  -h, --help            show this help message and exit
  --agent-id AGENT_ID   The unique identifier of the agent
  --agent-alias-id AGENT_ALIAS_ID
                        The alias ID of the agent
  --region REGION       AWS region (defaults to AWS_REGION env var or boto3 default)
  --profile PROFILE     AWS profile (defaults to AWS_PROFILE env var or boto3 default)
  --verbose             Enable verbose logging
  --no-traces           Disable streaming trace events
```

## AWS Credentials

The application uses AWS credentials in the following order of precedence:

1. Command line arguments (`--profile` and `--region`)
2. Environment variables (`AWS_PROFILE`, `AWS_REGION`, etc.)
3. AWS credentials file (`~/.aws/credentials`)
4. IAM role (if running on an EC2 instance with an IAM role)

## Trace Event Types

The interface visualizes various trace events including:

- **MODEL_INVOCATION_INPUT**: Agent sending a prompt to the foundation model
- **MODEL_INVOCATION_OUTPUT**: Response received from the foundation model
- **KNOWLEDGE_BASE_QUERY**: Agent querying a knowledge base
- **KNOWLEDGE_BASE_LOOKUP**: Results from knowledge base retrieval
- **RATIONALE**: Agent's reasoning process
- **AGENT_COLLABORATION**: Interaction with other agents
- **FINAL_RESPONSE**: Generation of the final response

## Limitations and Considerations

- AWS credentials must have appropriate permissions for Bedrock
- Performance may vary based on agent complexity and knowledge base size
- Terminal color support depends on the operating system and terminal emulator
- The interface is designed for terminal environments and doesn't provide a GUI
