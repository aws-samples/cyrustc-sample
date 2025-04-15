#!/bin/bash
set -e

# Execute update.sh
echo "Running update script..."
./bootstrap-script.sh

# Execute validate.sh
echo "Running validation script..."
./validating-script.sh