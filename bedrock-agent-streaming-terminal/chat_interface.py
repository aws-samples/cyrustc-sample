#!/usr/bin/env python3
import boto3
import json
import os
import sys
from datetime import datetime
from botocore.exceptions import ClientError
import logging
import signal
import argparse
import readline
import textwrap
from colorama import init, Fore, Style

# Initialize colorama for cross-platform colored terminal output
init()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("chat_history.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BedrockAgentChatInterface:
    def __init__(self, agent_id=None, agent_alias_id=None, region=None, profile=None, verbose=False, stream_traces=True):
        """
        Initialize the Bedrock Agent Chat Interface.
        
        Args:
            agent_id (str): The unique identifier of the agent
            agent_alias_id (str): The alias of the agent to use
            region (str): AWS region to use (defaults to AWS_REGION env var or boto3 default)
            profile (str): AWS profile to use (defaults to AWS_PROFILE env var or boto3 default)
            verbose (bool): Enable verbose logging
            stream_traces (bool): Whether to stream trace events to the console
        """
        self.agent_id = agent_id
        self.agent_alias_id = agent_alias_id
        self.region = region
        self.profile = profile
        self.session_id = None
        self.history = []
        self.stream_traces = stream_traces
        
        # Set verbose logging if requested
        if verbose:
            logger.setLevel(logging.DEBUG)
        else:
            logger.setLevel(logging.WARNING)
            
        # Create a boto3 session with the specified profile and region
        session_kwargs = {}
        if profile:
            session_kwargs['profile_name'] = profile
        if region:
            session_kwargs['region_name'] = region
            
        session = boto3.Session(**session_kwargs)
        
        # Get the region being used (for logging)
        self.region = region or session.region_name or 'us-east-1'
        
        # Initialize the Bedrock Agent Runtime client
        self.client = session.client('bedrock-agent-runtime')

    def list_available_agents(self):
        """
        Lists available agents directly from Bedrock.
        
        Returns:
            bool: True if agents were successfully listed, False otherwise
        """
        try:
            # Create a bedrock-agent client to list agents
            session = boto3.Session(
                profile_name=self.profile if self.profile else None,
                region_name=self.region if self.region else None
            )
            bedrock_agent_client = session.client('bedrock-agent')
            
            # List all agents
            print(f"{Fore.CYAN}Fetching available agents from {self.region} using profile {self.profile or 'default'}...{Style.RESET_ALL}")
            response = bedrock_agent_client.list_agents()
            agents = response.get('agentSummaries', [])
            
            if not agents:
                print(f"{Fore.RED}No agents found in your account.{Style.RESET_ALL}")
                return False
            
            print(f"\n{Fore.GREEN}Available Agents:{Style.RESET_ALL}")
            
            # Store agents for selection
            self.available_agents = []
            selection_counter = 1
            
            # Track used alias IDs to avoid duplicates
            used_alias_ids = set()
            
            for idx, agent in enumerate(agents, 1):
                agent_id = agent.get('agentId')
                agent_name = agent.get('agentName', 'Unnamed Agent')
                agent_status = agent.get('agentStatus', 'UNKNOWN')
                
                print(f"{Fore.CYAN}[{idx}]{Style.RESET_ALL} {Fore.YELLOW}{agent_name}{Style.RESET_ALL} (Status: {agent_status})")
                print(f"    Agent ID: {agent_id}")
                
                # Only process READY or PREPARED agents for aliases
                if agent_status not in ['READY', 'PREPARED']:
                    print(f"    {Fore.RED}Agent not ready - skipping{Style.RESET_ALL}")
                    continue
                
                # Get agent aliases
                try:
                    alias_response = bedrock_agent_client.list_agent_aliases(
                        agentId=agent_id
                    )
                    aliases = alias_response.get('agentAliasSummaries', [])
                    
                    if not aliases:
                        print(f"    {Fore.YELLOW}No aliases found for this agent{Style.RESET_ALL}")
                        continue
                    
                    # Store agent and its aliases
                    aliases_added = 0
                    for alias_idx, alias in enumerate(aliases, 1):
                        alias_id = alias.get('agentAliasId')
                        alias_name = alias.get('agentAliasName', 'Unnamed Alias')
                        alias_status = alias.get('agentAliasStatus', 'UNKNOWN')
                        
                        # Check if this alias uses DRAFT version
                        is_draft = False
                        routing_config = alias.get('routingConfiguration', [])
                        for route in routing_config:
                            if route.get('agentVersion') == 'DRAFT':
                                is_draft = True
                                break
                        
                        if is_draft:
                            print(f"      {Fore.YELLOW}Alias {alias_name} uses DRAFT version - skipping{Style.RESET_ALL}")
                            continue
                        
                        # Only include READY or PREPARED aliases
                        if alias_status not in ['READY', 'PREPARED']:
                            print(f"      {Fore.YELLOW}Alias {alias_name} status: {alias_status} - skipping{Style.RESET_ALL}")
                            continue
                        
                        # Create a unique identifier for this agent-alias combination
                        agent_alias_key = f"{agent_id}:{alias_id}"
                        
                        # Skip if we've already processed this alias ID
                        if agent_alias_key in used_alias_ids:
                            print(f"      {Fore.YELLOW}Alias {alias_name} (ID: {alias_id}) already listed - skipping duplicate{Style.RESET_ALL}")
                            continue
                            
                        # Mark this alias ID as used
                        used_alias_ids.add(agent_alias_key)
                        
                        self.available_agents.append({
                            'agent_id': agent_id,
                            'agent_name': agent_name,
                            'alias_id': alias_id,
                            'alias_name': alias_name,
                            'selection_index': selection_counter
                        })
                        
                        print(f"    {Fore.GREEN}Alias {alias_idx}:{Style.RESET_ALL} {alias_name} (Status: {alias_status})")
                        print(f"      Alias ID: {alias_id}")
                        print(f"      Selection #: {selection_counter}")
                        
                        selection_counter += 1
                        aliases_added += 1
                    
                    if aliases_added == 0:
                        print(f"    {Fore.YELLOW}No suitable aliases found for this agent (all were DRAFT or skipped){Style.RESET_ALL}")
                
                except Exception as e:
                    logger.debug(f"Error listing aliases for agent {agent_id}: {str(e)}")
                    print(f"    {Fore.RED}Error listing aliases: {str(e)}{Style.RESET_ALL}")
            
            if not self.available_agents:
                print(f"\n{Fore.RED}No ready agents with suitable aliases found.{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}You need at least one agent with a non-DRAFT alias to use this tool.{Style.RESET_ALL}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to list agents: {str(e)}")
            print(f"{Fore.RED}Error listing agents: {str(e)}{Style.RESET_ALL}")
            return False

    def select_agent(self):
        """
        Allows user to select an agent from the available agents.
        
        Returns:
            bool: True if agent was successfully selected, False otherwise
        """
        if not hasattr(self, 'available_agents') or not self.available_agents:
            if not self.list_available_agents():
                return False
        
        while True:
            try:
                choice = input(f"\n{Fore.GREEN}Select an agent (1-{len(self.available_agents)}) or 'q' to quit: {Style.RESET_ALL}")
                
                if choice.lower() == 'q':
                    return False
                
                idx = int(choice) - 1
                if 0 <= idx < len(self.available_agents):
                    selected = self.available_agents[idx]
                    self.agent_id = selected['agent_id']
                    self.agent_alias_id = selected['alias_id']
                    print(f"\n{Fore.GREEN}Selected agent: {selected['agent_name']} (Alias: {selected['alias_name']}){Style.RESET_ALL}")
                    print(f"{Fore.GREEN}Agent ID: {self.agent_id}{Style.RESET_ALL}")
                    print(f"{Fore.GREEN}Alias ID: {self.agent_alias_id}{Style.RESET_ALL}")
                    return True
                else:
                    print(f"{Fore.RED}Invalid selection. Please try again.{Style.RESET_ALL}")
            except ValueError:
                print(f"{Fore.RED}Please enter a valid number.{Style.RESET_ALL}")

    def invoke_agent_streaming(self, prompt):
        """
        Invokes a Bedrock agent with streaming response.
        
        Args:
            prompt (str): The input text/prompt for the agent
            
        Returns:
            dict: Response including completion and session_id
        """
        if not self.agent_id or not self.agent_alias_id:
            print(f"{Fore.RED}No agent selected. Please select an agent first.{Style.RESET_ALL}")
            return None
            
        start_time = datetime.now()
        logger.debug(f"Starting Agent Invocation at {start_time.isoformat()}")
        
        try:
            # Generate a session ID if not provided
            if not self.session_id:
                self.session_id = f"session-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
                logger.debug(f"Created new session ID: {self.session_id}")

            # Prepare the request parameters
            request_params = {
                'agentId': self.agent_id,
                'agentAliasId': self.agent_alias_id,
                'sessionId': self.session_id,
                'inputText': prompt,
                'enableTrace': True,
                'streamingConfigurations': {
                    'streamFinalResponse': True,
                    'applyGuardrailInterval': 1
                }
            }
            
            # Add knowledge base configuration if needed
            # Uncomment and customize as needed
            '''
            request_params['sessionState'] = {
                'knowledgeBaseConfigurations': [
                    {
                        'knowledgeBaseId': 'your-kb-id',
                        'retrievalConfiguration': {
                            'vectorSearchConfiguration': {
                                'numberOfResults': 5,
                                'overrideSearchType': 'HYBRID',
                            }
                        }
                    }
                ]
            }
            '''

            # Invoke the agent
            print(f"\n{Fore.CYAN}Agent is thinking...{Style.RESET_ALL}")
            if self.stream_traces:
                print(f"{Fore.CYAN}Streaming trace events while processing:{Style.RESET_ALL}")
            response = self.client.invoke_agent(**request_params)

            # Process the streaming response
            completion = ""
            processed_chunks = 0
            
            # Store trace events for history
            all_trace_events = []
            
            # Store response chunks to display after all trace events
            all_response_chunks = []
            
            # Timing variables
            last_event_time = start_time
            
            # Stream events as they come in
            for event in response['completion']:
                # Process trace information and display it in real-time
                if 'trace' in event:
                    trace_event = event['trace']
                    
                    # Get current time and calculate elapsed time
                    current_time = datetime.now()
                    elapsed_ms = (current_time - last_event_time).total_seconds() * 1000
                    total_elapsed_ms = (current_time - start_time).total_seconds() * 1000
                    
                    # Format timestamp for display
                    timestamp = current_time.strftime('%H:%M:%S.%f')[:-3]
                    
                    # Extract useful information from the trace event
                    event_type = self._get_trace_event_type(trace_event)
                    event_details = self._extract_trace_details(trace_event)
                    
                    # Only display if trace streaming is enabled
                    if self.stream_traces:
                        print(f"{Fore.YELLOW}[{timestamp}] {Fore.GREEN}{event_type}{Style.RESET_ALL}: {event_details} {Fore.CYAN}(+{elapsed_ms:.1f}ms, total: {total_elapsed_ms:.1f}ms){Style.RESET_ALL}")
                    
                    # Store trace event for history with timing information
                    all_trace_events.append({
                        'timestamp': timestamp,
                        'elapsed_ms': elapsed_ms,
                        'total_ms': total_elapsed_ms,
                        'event_type': event_type,
                        'trace_data': trace_event
                    })
                    
                    # Update last event time for next calculation
                    last_event_time = current_time
                
                # Store response chunks but don't display them yet
                elif 'chunk' in event:
                    all_response_chunks.append(event['chunk'])
            
            # After all events have been processed, display the response
            if all_response_chunks:
                print(f"\n{Fore.GREEN}Agent Response:{Style.RESET_ALL}\n")
                
                # Process all response chunks
                for chunk in all_response_chunks:
                    if 'bytes' in chunk:
                        chunk_text = chunk['bytes'].decode()
                        completion += chunk_text
                        processed_chunks += 1
                        
                        sys.stdout.write(chunk_text)
                        sys.stdout.flush()
            
            # Print a newline after the response
            sys.stdout.write("\n\n")
            sys.stdout.flush()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            # Print total time taken
            print(f"{Fore.CYAN}Total time: {duration.total_seconds():.2f} seconds{Style.RESET_ALL}")
            
            logger.debug(f"Completed Agent Invocation in {duration.total_seconds():.2f} seconds")
            logger.debug(f"Processed {len(all_response_chunks)} chunks and {len(all_trace_events)} trace events")

            # Store the interaction in history
            self.history.append({
                'timestamp': datetime.now().isoformat(),
                'prompt': prompt,
                'response': completion,
                'trace_events': all_trace_events,
                'total_duration_seconds': duration.total_seconds()
            })

            return {
                'completion': completion,
                'session_id': self.session_id,
                'trace_events': all_trace_events,
                'timing': {
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'duration_seconds': duration.total_seconds()
                }
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            print(f"\n{Fore.RED}Error: {error_code} - {error_message}{Style.RESET_ALL}")
            logger.error(f"ClientError: {error_code} - {error_message}")
            return None
        except Exception as e:
            print(f"\n{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
            logger.error(f"Unexpected error: {str(e)}")
            return None

    def _get_trace_event_type(self, trace_event):
        """
        Extract the type of trace event.
        
        Args:
            trace_event (dict): The trace event data
            
        Returns:
            str: The type of trace event
        """
        # Check if it's an orchestration trace
        if 'trace' in trace_event and 'orchestrationTrace' in trace_event['trace']:
            orchestration = trace_event['trace']['orchestrationTrace']
            
            # Model invocation
            if 'modelInvocationInput' in orchestration:
                return "MODEL_INVOCATION_INPUT"
            elif 'modelInvocationOutput' in orchestration:
                return "MODEL_INVOCATION_OUTPUT"
            elif 'rationale' in orchestration:
                return "RATIONALE"
            elif 'observation' in orchestration:
                observation = orchestration['observation']
                if 'knowledgeBaseLookupOutput' in observation:
                    return "KNOWLEDGE_BASE_LOOKUP"
                elif 'agentCollaboratorInvocationOutput' in observation:
                    return "AGENT_COLLABORATION"
                return observation.get('type', "OBSERVATION")
            elif 'invocationInput' in orchestration:
                invocation = orchestration['invocationInput']
                if 'agentCollaboratorInvocationInput' in invocation:
                    return "AGENT_COLLABORATION_REQUEST"
                elif 'knowledgeBaseLookupInput' in invocation:
                    return "KNOWLEDGE_BASE_QUERY"
                return "INVOCATION"
            elif 'finalResponse' in orchestration:
                return "FINAL_RESPONSE"
                
        # Default if we couldn't determine a more specific type
        return "TRACE_EVENT"
    
    def _extract_trace_details(self, trace_event):
        """
        Extract meaningful details from the trace event for display.
        
        Args:
            trace_event (dict): The trace event data
            
        Returns:
            str: Formatted details about the trace event
        """
        details = []
        
        # Check agent information
        if 'agentId' in trace_event:
            details.append(f"Agent: {trace_event['agentId']} (Alias: {trace_event.get('agentAliasId', 'N/A')})")
        
        # Check if there's a collaborator 
        if 'collaboratorName' in trace_event:
            details.append(f"Collaborator: {trace_event['collaboratorName']}")
            
        # Check if it's an orchestration trace
        if 'trace' in trace_event and 'orchestrationTrace' in trace_event['trace']:
            orchestration = trace_event['trace']['orchestrationTrace']
            
            # Model invocation
            if 'modelInvocationInput' in orchestration:
                model_input = orchestration['modelInvocationInput']
                if 'inferenceConfiguration' in model_input:
                    config = model_input['inferenceConfiguration']
                    details.append(f"Temperature: {config.get('temperature', 'N/A')}, MaxLength: {config.get('maximumLength', 'N/A')}")
                
            # Knowledge base lookup
            elif 'observation' in orchestration and 'knowledgeBaseLookupOutput' in orchestration['observation']:
                kb_output = orchestration['observation']['knowledgeBaseLookupOutput']
                if 'retrievedReferences' in kb_output:
                    references = kb_output['retrievedReferences']
                    details.append(f"Retrieved {len(references)} knowledge base references")
                    
            # Agent collaboration
            elif 'invocationInput' in orchestration and 'agentCollaboratorInvocationInput' in orchestration['invocationInput']:
                collab_input = orchestration['invocationInput']['agentCollaboratorInvocationInput']
                details.append(f"Collaborating with: {collab_input.get('agentCollaboratorName', 'N/A')}")
                
            # Knowledge base query
            elif 'invocationInput' in orchestration and 'knowledgeBaseLookupInput' in orchestration['invocationInput']:
                kb_input = orchestration['invocationInput']['knowledgeBaseLookupInput']
                details.append(f"Querying KB: {kb_input.get('knowledgeBaseId', 'N/A')}")
                
            # Rationale
            elif 'rationale' in orchestration and 'text' in orchestration['rationale']:
                rationale_text = orchestration['rationale']['text']
                if len(rationale_text) > 100:
                    rationale_text = rationale_text[:97] + "..."
                details.append(f"Thinking: {rationale_text}")
                
            # Final response (usually just indicates completion)
            elif 'finalResponse' in orchestration:
                details.append("Generating final response")
        
        return " | ".join(details) if details else "No details available"

    def save_chat_history(self, filename=None):
        """
        Saves the chat history to a file.
        
        Args:
            filename (str, optional): The filename to save to
        """
        if not self.history:
            print(f"{Fore.YELLOW}No chat history to save.{Style.RESET_ALL}")
            return
            
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
            filename = f"chat_history_{timestamp}.json"
            
        try:
            with open(filename, 'w') as f:
                json.dump(self.history, f, indent=2)
            print(f"\n{Fore.GREEN}Chat history saved to {filename}{Style.RESET_ALL}")
        except Exception as e:
            print(f"\n{Fore.RED}Failed to save chat history: {str(e)}{Style.RESET_ALL}")

    def run_interactive_chat(self):
        """
        Runs an interactive chat session with the agent.
        """
        print(f"\n{Fore.GREEN}==== Bedrock Agent Chat Interface ===={Style.RESET_ALL}")
        print(f"{Fore.CYAN}Type 'quit', 'exit', or use Ctrl+C to end the chat.{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Type 'save' to save the chat history.{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Type 'agent' to select a different agent.{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Type 'help' to see these commands again.{Style.RESET_ALL}")
        
        # Setup signal handler for graceful exit
        signal.signal(signal.SIGINT, self._signal_handler)
        
        try:
            while True:
                # Check if an agent is selected
                if not self.agent_id or not self.agent_alias_id:
                    if not self.select_agent():
                        print(f"\n{Fore.YELLOW}Exiting as no agent was selected.{Style.RESET_ALL}")
                        break
                
                # Get user input
                try:
                    prompt = input(f"\n{Fore.YELLOW}You:{Style.RESET_ALL} ")
                except EOFError:
                    break
                
                # Check for special commands
                prompt = prompt.strip()
                if not prompt:
                    continue
                    
                if prompt.lower() in ['quit', 'exit', 'q']:
                    break
                    
                elif prompt.lower() == 'save':
                    self.save_chat_history()
                    continue
                    
                elif prompt.lower() == 'agent':
                    self.select_agent()
                    continue
                    
                elif prompt.lower() == 'help':
                    print(f"\n{Fore.CYAN}Available commands:{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}- quit/exit: End the chat session{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}- save: Save the chat history{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}- agent: Select a different agent{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}- help: Show this help message{Style.RESET_ALL}")
                    continue
                
                # Invoke the agent
                self.invoke_agent_streaming(prompt)
                
        except Exception as e:
            logger.error(f"Error in interactive chat: {str(e)}")
            print(f"\n{Fore.RED}An error occurred: {str(e)}{Style.RESET_ALL}")
        
        finally:
            # Save history before exiting
            if self.history:
                save_history = input(f"\n{Fore.CYAN}Save chat history before exiting? (y/n): {Style.RESET_ALL}")
                if save_history.lower() == 'y':
                    self.save_chat_history()
                    
            print(f"\n{Fore.GREEN}Thank you for using Bedrock Agent Chat Interface!{Style.RESET_ALL}")

    def _signal_handler(self, sig, frame):
        """
        Handles keyboard interrupts gracefully.
        """
        print(f"\n\n{Fore.YELLOW}Keyboard interrupt detected. Exiting...{Style.RESET_ALL}")
        
        # Save history before exiting if there's any
        if self.history:
            save_history = input(f"\n{Fore.CYAN}Save chat history before exiting? (y/n): {Style.RESET_ALL}")
            if save_history.lower() == 'y':
                self.save_chat_history()
                
        sys.exit(0)

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Bedrock Agent Chat Interface')
    parser.add_argument('--agent-id', help='The unique identifier of the agent')
    parser.add_argument('--agent-alias-id', help='The alias ID of the agent')
    parser.add_argument('--region', help='AWS region (defaults to AWS_REGION env var or boto3 default)')
    parser.add_argument('--profile', help='AWS profile (defaults to AWS_PROFILE env var or boto3 default)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    parser.add_argument('--no-traces', action='store_true', help='Disable streaming trace events')
    args = parser.parse_args()
    
    # Initialize the chat interface
    chat = BedrockAgentChatInterface(
        agent_id=args.agent_id,
        agent_alias_id=args.agent_alias_id,
        region=args.region,
        profile=args.profile,
        verbose=args.verbose,
        stream_traces=not args.no_traces
    )
    
    # If agent ID and alias ID weren't provided, list available agents
    if not (args.agent_id and args.agent_alias_id):
        chat.list_available_agents()
    
    # Run the interactive chat
    chat.run_interactive_chat()

if __name__ == "__main__":
    main() 