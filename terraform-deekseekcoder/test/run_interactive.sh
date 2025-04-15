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

# Run Locust in web interface mode
echo "Starting Locust web interface on http://localhost:8089"
echo "Testing against $LOAD_BALANCER_URL"
locust -f locust_test.py --host=http://$LOAD_BALANCER_URL
