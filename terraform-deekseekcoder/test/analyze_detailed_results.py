#!/usr/bin/env python3
import pandas as pd
import matplotlib.pyplot as plt
import glob
import os
import re
import numpy as np
from datetime import datetime

def parse_top_output(file_path):
    """Parse top command output to extract CPU and memory usage."""
    cpu_usage = []
    mem_usage = []
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if '%Cpu(s):' in line:
            # Extract CPU usage (100 - idle percentage)
            match = re.search(r'%Cpu\(s\):.+?(\d+\.\d+) id', line)
            if match:
                idle = float(match.group(1))
                cpu_usage.append(100 - idle)
        
        if 'MiB Mem :' in line:
            # Extract memory usage
            match = re.search(r'MiB Mem :.+?(\d+\.\d+) used', line)
            if match:
                mem_usage.append(float(match.group(1)))
    
    return cpu_usage, mem_usage

def parse_gpu_csv(file_path):
    """Parse GPU monitoring CSV to extract GPU utilization and memory usage."""
    try:
        df = pd.read_csv(file_path)
        # Convert memory strings to numeric values
        df['Memory Used'] = df['Memory Used'].str.extract(r'(\d+)').astype(float)
        df['Memory Total'] = df['Memory Total'].str.extract(r'(\d+)').astype(float)
        df['GPU Util %'] = df['GPU Util %'].str.extract(r'(\d+)').astype(float)
        
        # Group by time and calculate average across GPUs
        df_grouped = df.groupby('Time').agg({
            'GPU Util %': 'mean',
            'Memory Used': 'sum',
            'Memory Total': 'sum'
        }).reset_index()
        
        # Calculate memory usage percentage
        df_grouped['Memory Usage %'] = (df_grouped['Memory Used'] / df_grouped['Memory Total']) * 100
        
        return df_grouped
    except Exception as e:
        print(f"Error parsing GPU CSV: {e}")
        return pd.DataFrame()

def parse_locust_stats(file_path):
    """Parse Locust stats CSV to extract performance metrics."""
    try:
        df = pd.read_csv(file_path)
        # Filter for chat completions endpoint
        df = df[df['Name'] == '/v1/chat/completions']
        
        if df.empty:
            return None
        
        # Extract key metrics
        requests = df['Request Count'].values[0]
        avg_response_time = df['Average Response Time'].values[0] / 1000  # Convert to seconds
        
        return {
            'requests': requests,
            'avg_response_time': avg_response_time
        }
    except Exception as e:
        print(f"Error parsing Locust stats: {e}")
        return None

def analyze_results():
    """Analyze test results and generate visualizations."""
    # Find all test directories
    test_dirs = glob.glob('results/test_*users')
    
    if not test_dirs:
        print("No test results found.")
        return
    
    # Sort directories by user count
    test_dirs.sort(key=lambda x: int(re.search(r'test_(\d+)users', x).group(1)))
    
    # Prepare data structures for results
    user_counts = []
    cpu_avg = []
    mem_avg = []
    gpu_util_avg = []
    gpu_mem_avg = []
    response_times = []
    
    # Process each test directory
    for test_dir in test_dirs:
        user_count = int(re.search(r'test_(\d+)users', test_dir).group(1))
        user_counts.append(user_count)
        
        # Process CPU and memory data
        cpu_mem_file = os.path.join(test_dir, 'cpu_mem.log')
        if os.path.exists(cpu_mem_file):
            cpu_data, mem_data = parse_top_output(cpu_mem_file)
            cpu_avg.append(np.mean(cpu_data) if cpu_data else 0)
            mem_avg.append(np.mean(mem_data) if mem_data else 0)
        else:
            cpu_avg.append(0)
            mem_avg.append(0)
        
        # Process GPU data
        gpu_file = os.path.join(test_dir, 'gpu.csv')
        if os.path.exists(gpu_file):
            gpu_df = parse_gpu_csv(gpu_file)
            if not gpu_df.empty:
                gpu_util_avg.append(gpu_df['GPU Util %'].mean())
                gpu_mem_avg.append(gpu_df['Memory Usage %'].mean())
            else:
                gpu_util_avg.append(0)
                gpu_mem_avg.append(0)
        else:
            gpu_util_avg.append(0)
            gpu_mem_avg.append(0)
        
        # Process Locust stats
        locust_file = os.path.join(test_dir, 'locust_stats.csv')
        if os.path.exists(locust_file):
            stats = parse_locust_stats(locust_file)
            if stats:
                response_times.append(stats['avg_response_time'])
            else:
                response_times.append(0)
        else:
            response_times.append(0)
    
    # Create results DataFrame
    results_df = pd.DataFrame({
        'Users': user_counts,
        'CPU Usage (%)': cpu_avg,
        'Memory Usage (MiB)': mem_avg,
        'GPU Utilization (%)': gpu_util_avg,
        'GPU Memory Usage (%)': gpu_mem_avg,
        'Response Time (s)': response_times
    })
    
    # Print results table
    print("\n===== DeepSeek Coder Resource Usage Analysis =====")
    print(results_df.to_string(index=False))
    print("\n")
    
    # Create visualizations
    plt.figure(figsize=(15, 12))
    
    # Plot 1: CPU Usage vs Users
    plt.subplot(2, 2, 1)
    plt.plot(results_df['Users'], results_df['CPU Usage (%)'], 'o-', linewidth=2, markersize=8)
    plt.title('CPU Usage vs Number of Concurrent Users')
    plt.xlabel('Number of Users')
    plt.ylabel('CPU Usage (%)')
    plt.grid(True)
    
    # Plot 2: Memory Usage vs Users
    plt.subplot(2, 2, 2)
    plt.plot(results_df['Users'], results_df['Memory Usage (MiB)'], 'o-', linewidth=2, markersize=8, color='orange')
    plt.title('Memory Usage vs Number of Concurrent Users')
    plt.xlabel('Number of Users')
    plt.ylabel('Memory Usage (MiB)')
    plt.grid(True)
    
    # Plot 3: GPU Utilization vs Users
    plt.subplot(2, 2, 3)
    plt.plot(results_df['Users'], results_df['GPU Utilization (%)'], 'o-', linewidth=2, markersize=8, color='green')
    plt.title('GPU Utilization vs Number of Concurrent Users')
    plt.xlabel('Number of Users')
    plt.ylabel('GPU Utilization (%)')
    plt.grid(True)
    
    # Plot 4: GPU Memory Usage vs Users
    plt.subplot(2, 2, 4)
    plt.plot(results_df['Users'], results_df['GPU Memory Usage (%)'], 'o-', linewidth=2, markersize=8, color='red')
    plt.title('GPU Memory Usage vs Number of Concurrent Users')
    plt.xlabel('Number of Users')
    plt.ylabel('GPU Memory Usage (%)')
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('results/resource_usage_analysis.png')
    
    # Create correlation plot between response time and resource usage
    plt.figure(figsize=(15, 10))
    
    # Plot 1: Response Time vs CPU Usage
    plt.subplot(2, 2, 1)
    plt.scatter(results_df['CPU Usage (%)'], results_df['Response Time (s)'], s=100)
    for i, user in enumerate(results_df['Users']):
        plt.annotate(f"{user} users", 
                    (results_df['CPU Usage (%)'][i], results_df['Response Time (s)'][i]),
                    textcoords="offset points", 
                    xytext=(0,10), 
                    ha='center')
    plt.title('Response Time vs CPU Usage')
    plt.xlabel('CPU Usage (%)')
    plt.ylabel('Response Time (s)')
    plt.grid(True)
    
    # Plot 2: Response Time vs Memory Usage
    plt.subplot(2, 2, 2)
    plt.scatter(results_df['Memory Usage (MiB)'], results_df['Response Time (s)'], s=100, color='orange')
    for i, user in enumerate(results_df['Users']):
        plt.annotate(f"{user} users", 
                    (results_df['Memory Usage (MiB)'][i], results_df['Response Time (s)'][i]),
                    textcoords="offset points", 
                    xytext=(0,10), 
                    ha='center')
    plt.title('Response Time vs Memory Usage')
    plt.xlabel('Memory Usage (MiB)')
    plt.ylabel('Response Time (s)')
    plt.grid(True)
    
    # Plot 3: Response Time vs GPU Utilization
    plt.subplot(2, 2, 3)
    plt.scatter(results_df['GPU Utilization (%)'], results_df['Response Time (s)'], s=100, color='green')
    for i, user in enumerate(results_df['Users']):
        plt.annotate(f"{user} users", 
                    (results_df['GPU Utilization (%)'][i], results_df['Response Time (s)'][i]),
                    textcoords="offset points", 
                    xytext=(0,10), 
                    ha='center')
    plt.title('Response Time vs GPU Utilization')
    plt.xlabel('GPU Utilization (%)')
    plt.ylabel('Response Time (s)')
    plt.grid(True)
    
    # Plot 4: Response Time vs GPU Memory Usage
    plt.subplot(2, 2, 4)
    plt.scatter(results_df['GPU Memory Usage (%)'], results_df['Response Time (s)'], s=100, color='red')
    for i, user in enumerate(results_df['Users']):
        plt.annotate(f"{user} users", 
                    (results_df['GPU Memory Usage (%)'][i], results_df['Response Time (s)'][i]),
                    textcoords="offset points", 
                    xytext=(0,10), 
                    ha='center')
    plt.title('Response Time vs GPU Memory Usage')
    plt.xlabel('GPU Memory Usage (%)')
    plt.ylabel('Response Time (s)')
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('results/correlation_analysis.png')
    
    print(f"Analysis visualizations saved to results/resource_usage_analysis.png and results/correlation_analysis.png")
    
    # Save results to CSV
    results_df.to_csv('results/resource_usage_summary.csv', index=False)
    print(f"Summary data saved to results/resource_usage_summary.csv")

if __name__ == "__main__":
    analyze_results()
