#!/usr/bin/env python3
import pandas as pd
import glob
import os
import matplotlib.pyplot as plt

def analyze_results():
    # Find all CSV files with stats
    stats_files = glob.glob('results/results_*user*_stats.csv')
    
    if not stats_files:
        print("No results files found. Run the tests first.")
        return
    
    results = []
    
    for file in stats_files:
        # Extract user count from filename
        user_count = int(file.split('_')[1].replace('users', '').replace('user', ''))
        
        # Read the stats file
        df = pd.read_csv(file)
        
        # Get the row for the LLM request
        llm_row = df[df['Name'] == '/v1/chat/completions']
        
        if not llm_row.empty:
            # Calculate metrics
            requests = llm_row['Request Count'].values[0]
            avg_response_time = llm_row['Average Response Time'].values[0] / 1000  # Convert to seconds
            
            # Read the corresponding requests file to get token information
            requests_file = file.replace('_stats.csv', '_requests.csv')
            if os.path.exists(requests_file):
                req_df = pd.read_csv(requests_file)
                # Calculate average response length (which we use for tokens)
                avg_tokens = req_df['Response Length'].mean()
                avg_tokens_per_second = avg_tokens / avg_response_time if avg_response_time > 0 else 0
            else:
                avg_tokens = 0
                avg_tokens_per_second = 0
            
            results.append({
                'Users': user_count,
                'Requests': requests,
                'Avg Response Time (s)': avg_response_time,
                'Avg Tokens': avg_tokens,
                'Tokens/Second': avg_tokens_per_second
            })
    
    if not results:
        print("No valid results found in the CSV files.")
        return
        
    # Create a DataFrame from results
    results_df = pd.DataFrame(results).sort_values('Users')
    
    # Print results
    print("\n===== DeepSeek Coder Performance Test Results =====")
    print(results_df.to_string(index=False))
    print("\n")
    
    # Create plots
    try:
        plt.figure(figsize=(12, 10))
        
        # Plot 1: Tokens per second vs Users
        plt.subplot(2, 1, 1)
        plt.plot(results_df['Users'], results_df['Tokens/Second'], 'o-', linewidth=2, markersize=8)
        plt.title('Tokens per Second vs Number of Concurrent Users')
        plt.xlabel('Number of Users')
        plt.ylabel('Tokens per Second')
        plt.grid(True)
        
        # Plot 2: Response Time vs Users
        plt.subplot(2, 1, 2)
        plt.plot(results_df['Users'], results_df['Avg Response Time (s)'], 'o-', linewidth=2, markersize=8, color='orange')
        plt.title('Average Response Time vs Number of Concurrent Users')
        plt.xlabel('Number of Users')
        plt.ylabel('Response Time (seconds)')
        plt.grid(True)
        
        plt.tight_layout()
        plt.savefig('results/performance_results.png')
        plt.close()
        
        print(f"Results visualization saved to results/performance_results.png")
    except Exception as e:
        print(f"Error creating visualization: {str(e)}")

if __name__ == "__main__":
    analyze_results()
