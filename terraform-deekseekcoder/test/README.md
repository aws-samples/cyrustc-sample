# DeepSeek Coder Performance Testing

This directory contains scripts to test the performance of the DeepSeek Coder model deployment using Locust.

## Setup

1. Run the setup script to create a Python virtual environment and install dependencies:

```bash
chmod +x setup.sh
./setup.sh
```

2. Create a `.env` file with your load balancer URL (you can copy from `.env.example`):

```bash
cp .env.example .env
# Edit .env with your actual load balancer URL
```

## Running Tests

### Interactive Mode

To run Locust with a web interface for interactive testing:

```bash
chmod +x run_interactive.sh
./run_interactive.sh
```

This will start the Locust web interface at http://localhost:8089, where you can:
- Set the number of users to simulate
- Set the spawn rate (users per second)
- Start the test and watch real-time results
- View detailed statistics and charts

### Automated Tests

To run automated tests with 1, 2, 5, and 10 concurrent users:

```bash
chmod +x run_test.sh
./run_test.sh
```

This script will:
1. Run tests with different user counts (1, 2, 5, and 10)
2. Each test will run for 30 seconds
3. Results will be saved to CSV files

### Analyzing Results

After running the automated tests, you can analyze the results:

```bash
python analyze_results.py
```

This will:
- Process the CSV result files
- Calculate tokens per second for each test
- Generate a summary table
- Create visualization charts saved as `performance_results.png`

## Understanding the Results

The key metrics to look for are:

- **Tokens per Second**: How many tokens the model generates per second
- **Response Time**: How long it takes to complete a request
- **Failure Rate**: Percentage of failed requests (should be 0%)

As you increase the number of concurrent users, you'll see how the model's performance scales.

## Customizing Tests

You can modify `locust_test.py` to change:
- The prompt sent to the model
- The wait time between requests
- Additional metrics to track

## Troubleshooting

If you encounter issues:

1. Check that your load balancer URL is correct in the `.env` file
2. Ensure the virtual environment is activated (`source venv/bin/activate`)
3. Check that the model is accessible by running a simple curl test
4. Look for error messages in the Locust output
