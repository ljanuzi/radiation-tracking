import pandas as pd
import time
import os

# Function to append a row to a CSV file
def append_row_to_csv(file_name, row):
    try:
        row.to_frame().T.to_csv(file_name, mode='a', header=False, index=False)
    except Exception as e:
        print(f"Error appending row to {file_name}: {e}")

def main():
    # File paths
    measurements_file = '/app/data/measurements_reversed.csv'
    real_time_data = '/app/data/real_time_data_simulation.csv'

    # Check if files exist
    if not os.path.exists(measurements_file):
        print(f"File not found: {measurements_file}")
        return

    if not os.path.exists(real_time_data):
        print(f"File not found: {real_time_data}")
        return

    # Read the source and target CSV files
    try:
        measurements_df = pd.read_csv(measurements_file)
        try2_df = pd.read_csv(real_time_data)
    except Exception as e:
        print(f"Error reading CSV files: {e}")
        return

    # Ensure the columns of try2_df match the columns of measurements_df
    try:
        try2_df = try2_df[measurements_df.columns]
        # Save the reordered try2_df (if not already in the correct order)
        try2_df.to_csv(real_time_data, index=False)
    except Exception as e:
        print(f"Error processing try2_df: {e}")
        return

    # Simulate real-time streaming
    for index, row in measurements_df.iterrows():
        append_row_to_csv(real_time_data, row)
        print(f"Appended row {index + 1} to try-2.csv")
        time.sleep(5)  # Wait for 5 seconds before appending the next row

    print("Finished streaming data from measurements-1.csv to try-2.csv.")

if __name__ == "__main__":
    main()
