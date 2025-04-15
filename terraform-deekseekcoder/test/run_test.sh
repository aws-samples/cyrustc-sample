#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup.sh first..."
    bash setup.sh
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists, if not create it
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

# Run tests with different user counts
echo "Running Locust tests against $LOAD_BALANCER_URL"

# Run test with 1 user
echo "Running test with 1 user..."
locust -f locust_test.py --host=http://$LOAD_BALANCER_URL --users 1 --spawn-rate 1 --headless --run-time 30s --csv=results/results_1user

# Run test with 2 users
echo "Running test with 2 users..."
locust -f locust_test.py --host=http://$LOAD_BALANCER_URL --users 2 --spawn-rate 1 --headless --run-time 30s --csv=results/results_2users

# Run test with 5 users
echo "Running test with 5 users..."
locust -f locust_test.py --host=http://$LOAD_BALANCER_URL --users 5 --spawn-rate 1 --headless --run-time 30s --csv=results/results_5users

# Run test with 10 users
echo "Running test with 10 users..."
locust -f locust_test.py --host=http://$LOAD_BALANCER_URL --users 10 --spawn-rate 2 --headless --run-time 30s --csv=results/results_10users

echo "All tests completed. Results saved to results/ directory."

# Run the analysis script if it exists
if [ -f "analyze_results.py" ]; then
    echo "Running analysis script..."
    python analyze_results.py
fi
