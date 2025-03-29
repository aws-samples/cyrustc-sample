# DeepSeek Coder Deployment

This repository contains the configuration files needed to deploy the DeepSeek Coder model on a Kubernetes cluster with GPU support.

## Prerequisites

- Kubernetes cluster with GPU nodes (g4dn instances)
- Karpenter configured with a GPU nodepool
- NVIDIA device plugin installed on the cluster

## Deployment Files

- `llm_model.tf`: Terraform configuration for the DeepSeek Coder model deployment

## Deployment Instructions

1. Initialize Terraform:
   ```
   terraform init
   ```

2. Apply the Terraform configuration:
   ```
   terraform apply
   ```

3. Monitor the deployment:
   ```
   kubectl get pods -n llm
   ```

## Model Information

- **Model**: TheBloke/deepseek-coder-6.7b-instruct-GPTQ
- **Source**: Hugging Face
- **Serving Framework**: vLLM
- **Hardware Requirements**: NVIDIA GPU with at least 16GB memory (g4dn instances)

## Configuration Notes

- The deployment uses half-precision (float16) to optimize memory usage
- The model requires the `--trust-remote-code` flag to load properly
- The pod is configured with node selectors to target GPU nodes
- Liveness and readiness probes are set with a 300-second delay to allow for model loading
- GPU memory utilization is set to 0.9 (90%)

## Usage

You can interact with the model using the OpenAI-compatible API in two ways:

### Internal Cluster Access

For services within the Kubernetes cluster:

```bash
curl -X POST http://llm-service.llm.svc.cluster.local/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "TheBloke/deepseek-coder-6.7b-instruct-GPTQ",
    "prompt": "Write a Python function to calculate the Fibonacci sequence",
    "max_tokens": 250
  }'
```

### External Load Balancer Access

For external access via the load balancer:

```bash
curl -X POST "http://<LOAD_BALANCER_URL>/v1/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "TheBloke/deepseek-coder-6.7b-instruct-GPTQ",
    "prompt": "Write a Python function to calculate the Fibonacci sequence",
    "max_tokens": 250
  }'
```

### Chat Completions API

The model also supports the chat completions API format:

```bash
curl -X POST "http://<LOAD_BALANCER_URL>/v1/chat/completions" \
  -H "Content-Type: application/json" \
  --data '{
    "model": "TheBloke/deepseek-coder-6.7b-instruct-GPTQ",
    "messages": [
      {
        "role": "user",
        "content": "Write a Python function to calculate the first n numbers in the Fibonacci sequence"
      }
    ]
  }'
```

## Troubleshooting

If the pod fails to start, check:
1. GPU availability in the cluster
2. Node selector matches available nodes
3. Memory requirements for the model
4. CUDA compatibility with the GPU

## Hardware Details

The deployment is currently running on a g4dn.metal instance with:
- 8 NVIDIA T4 GPUs (16GB memory each)
- 96 vCPUs
- 384GB RAM
