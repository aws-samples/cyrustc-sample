#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup.sh first..."
    bash setup.sh
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file. Please edit it with your load balancer URL."
    echo "LOAD_BALANCER_URL=your-load-balancer-url-here" > .env
    echo ".env file created. Please edit it with your load balancer URL."
    exit 1
fi

# Load environment variables
source .env

# Create results directory if it doesn't exist
mkdir -p results

# Function to run test with monitoring
run_test_with_monitoring() {
    local users=$1
    local test_name="test_${users}users"
    
    echo "===== Running test with $users users ====="
    
    # Create monitoring directory
    mkdir -p "results/$test_name"
    
    # Start resource monitoring
    echo "Starting resource monitoring for $users users test..."
    
    # Monitor CPU and memory usage
    top -b -d 2 > "results/$test_name/cpu_mem.log" &
    TOP_PID=$!
    
    # Monitor GPU usage if nvidia-smi is available
    if command -v nvidia-smi &> /dev/null; then
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
        ) > "results/$test_name/gpu.csv" &
        GPU_PID=$!
    else
        echo "nvidia-smi not found. GPU monitoring will be skipped."
        GPU_PID=""
    fi
    
    # Run the locust test
    echo "Running Locust test with $users users..."
    locust -f locust_test.py --host=http://$LOAD_BALANCER_URL --users $users --spawn-rate 1 --headless --run-time 60s --csv="results/$test_name/locust"
    
    # Stop monitoring
    if [ -n "$TOP_PID" ]; then
        kill $TOP_PID 2>/dev/null || true
    fi
    
    if [ -n "$GPU_PID" ]; then
        kill $GPU_PID 2>/dev/null || true
    fi
    
    echo "Test with $users users completed."
    echo "Results saved to results/$test_name/"
    echo ""
}

# Run tests with different user counts
echo "Running performance tests with resource monitoring against $LOAD_BALANCER_URL"

# Run test with 1 user
run_test_with_monitoring 1

# Run test with 2 users
run_test_with_monitoring 2

# Run test with 5 users
run_test_with_monitoring 5

# Run test with 10 users
run_test_with_monitoring 10

echo "All tests completed."

# Analyze results
echo "Analyzing results..."
python analyze_detailed_results.py
