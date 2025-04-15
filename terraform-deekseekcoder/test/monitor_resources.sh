#!/bin/bash

# This script monitors CPU, memory, and GPU usage during performance tests
# It requires nvidia-smi for GPU monitoring

# Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "nvidia-smi not found. This script requires NVIDIA drivers to be installed."
    exit 1
fi

# Create output directory
mkdir -p monitoring_results

# Get timestamp for filenames
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Start monitoring in background
echo "Starting resource monitoring..."

# Monitor CPU and memory usage
top -b -d 2 > monitoring_results/cpu_mem_${TIMESTAMP}.log &
TOP_PID=$!

# Monitor GPU usage
(
    echo "Time,GPU ID,GPU Util %,Memory Used,Memory Total"
    while true; do
        TIME=$(date +"%H:%M:%S")
        nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total --format=csv,noheader | \
        while read -r line; do
            echo "$TIME,$line"
        done
        sleep 2
    done
) > monitoring_results/gpu_${TIMESTAMP}.csv &
GPU_PID=$!

echo "Monitoring started. Press Enter to stop monitoring."
read -r

# Stop monitoring
kill $TOP_PID $GPU_PID
wait $TOP_PID $GPU_PID 2>/dev/null

echo "Monitoring stopped. Results saved to monitoring_results/ directory."
