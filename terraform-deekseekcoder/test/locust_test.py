from locust import HttpUser, task, between
import json
import time

class LLMUser(HttpUser):
    wait_time = between(1, 3)  # Wait between 1-3 seconds between tasks
    
    @task
    def query_llm(self):
        # Payload for the LLM request
        payload = {
            "model": "TheBloke/deepseek-coder-6.7b-instruct-GPTQ",
            "messages": [
                {
                    "role": "user",
                    "content": "Write a Python function to calculate the first 10 numbers in the Fibonacci sequence"
                }
            ]
        }
        
        # Record start time to calculate tokens per second
        start_time = time.time()
        
        # Send request to the LLM service
        with self.client.post("/v1/chat/completions", 
                             json=payload, 
                             catch_response=True) as response:
            if response.status_code == 200:
                # Parse response to extract token information
                try:
                    response_data = response.json()
                    tokens_generated = response_data.get('usage', {}).get('completion_tokens', 0)
                    duration = time.time() - start_time
                    tokens_per_second = tokens_generated / duration
                    
                    # Log metrics for this request
                    print(f"Request completed: {tokens_generated} tokens in {duration:.2f}s ({tokens_per_second:.2f} tokens/sec)")
                    
                    # Add custom metrics to Locust's statistics using events
                    self.environment.events.request.fire(
                        request_type="LLM_METRICS",
                        name="tokens_per_second",
                        response_time=duration * 1000,  # Convert to milliseconds
                        response_length=tokens_generated,
                        exception=None,
                        context={}
                    )
                    
                    response.success()
                except Exception as e:
                    error_msg = f"Error processing response: {str(e)}"
                    print(error_msg)
                    response.failure(error_msg)
            else:
                error_msg = f"Failed with status code: {response.status_code}"
                try:
                    error_msg += f", Response: {response.text}"
                except:
                    pass
                print(error_msg)
                response.failure(error_msg)
