#!/bin/bash

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

echo "Virtual environment setup complete. To activate, run:"
echo "source venv/bin/activate"
