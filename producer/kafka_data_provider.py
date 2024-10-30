import os
import json
import threading
import logging
from time import sleep
import pandas as pd
from kafka import KafkaProducer
from dateutil import parser
from datetime import datetime
import hashlib

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

class KafkaDataProvider:
    def __init__(self, kafka_server, topic, csv_file, submission_speed=1, check_interval=5):
        """
        Initialize the KafkaDataProvider class.

        Args:
            kafka_server (str): The address of the Kafka server.
            topic (str): The Kafka topic to which messages will be sent.
            csv_file (str): Path to the CSV file to be processed.
            submission_speed (int, optional): Speed of message submission. Default is 1.
            check_interval (int, optional): Interval in seconds to check for file modifications. Default is 5.
        """
        self.kafka_server = kafka_server
        self.topic = topic
        self.csv_file = csv_file
        self.submission_speed = submission_speed
        self.check_interval = check_interval
        self.producer = KafkaProducer(
            bootstrap_servers=[kafka_server],
            key_serializer=lambda x: x.encode('utf-8'),
            value_serializer=lambda x: json.dumps(x, default=str).encode('utf-8')
        )
        self.df = pd.DataFrame()
        self.stop_event = threading.Event()
        self.last_mod_time = 0
        self.processed_records = set()
        self.load_and_sort_data()

    def file_modified(self):
        """
        Check if the CSV file has been modified since the last check.

        Returns:
            bool: True if the file has been modified, False otherwise.
        """
        try:
            current_mod_time = os.path.getmtime(self.csv_file)
            if current_mod_time != self.last_mod_time:
                self.last_mod_time = current_mod_time
                return True
            return False
        except FileNotFoundError:
            logging.error(f"{self.csv_file} not found.")
            return False

    def load_and_sort_data(self):
        """
        Load data from the CSV file, sort it by 'Captured Time', and store it in a DataFrame.
        """
        dtype_spec = {
            "Captured Time": str,
            "Latitude": float,
            "Longitude": float,
            "Value": float,
            "Unit": str,
            "Location Name": str,
            "Device ID": float,
            "MD5Sum": str,
            "Height": float,
            "Surface": str,
            "Radiation": str,
            "Uploaded Time": str,
            "Loader ID": float
        }
        try:
            df = pd.read_csv(self.csv_file, dtype=dtype_spec, low_memory=False)
            logging.info(f"Loaded {len(df)} rows from {self.csv_file}")
        except pd.errors.EmptyDataError:
            df = pd.DataFrame()
        except Exception as e:
            logging.error(f"Error loading CSV file: {e}")
            return

        if df.empty:
            logging.info("No data found in the CSV file.")
            return

        df = df.dropna(subset=['Captured Time'])
        df['Captured Time'] = df['Captured Time'].apply(lambda x: parser.parse(x, dayfirst=True))
        df = df.dropna(subset=['Captured Time'])
        df = df.sort_values(by='Captured Time')
        logging.info(f"Sorted {len(df)} rows by 'Captured Time'")

        self.df = df

    def generate_record_hash(self, captured_second, latitude, longitude):
        """
        Generate a unique hash for a record based on the captured second, latitude, and longitude.

        Args:
            captured_second (str): The second when the data was captured.
            latitude (float): Latitude value.
            longitude (float): Longitude value.

        Returns:
            str: The generated MD5 hash.
        """
        record_id = f"{captured_second}_{latitude}_{longitude}"
        return hashlib.md5(record_id.encode()).hexdigest()

    def produce_messages(self):
        """
        Produce messages to Kafka by reading and processing the CSV file at regular intervals.
        """
        while not self.stop_event.is_set():
            if self.file_modified():
                logging.info(f"{self.csv_file} has been modified.")
                sleep(6)
                self.load_and_sort_data()

            if self.df.empty:
                logging.info("No new data to process. Waiting for updates...")
                sleep(self.check_interval)
                continue

            current_minute = None
            second_groups = {}

            for index, row in self.df.iterrows():
                if self.stop_event.is_set():
                    break
                captured_minute = row['Captured Time'].strftime('%Y-%m-%d %H:%M')
                captured_second = row['Captured Time'].strftime('%Y-%m-%d %H:%M:%S')
                record_hash = self.generate_record_hash(captured_second, row["Latitude"], row["Longitude"])

                if record_hash in self.processed_records:
                    continue  # Skip already processed records
                self.processed_records.add(record_hash)

                if current_minute is None:
                    current_minute = captured_minute

                if captured_minute == current_minute:
                    if captured_second not in second_groups:
                        second_groups[captured_second] = []
                    second_groups[captured_second].append({
                        "Latitude": row["Latitude"],
                        "Longitude": row["Longitude"],
                        "Value": row["Value"]
                    })

                    # Send the message for the current second
                    batch = {
                        "Captured Time": current_minute,
                        "Messages": [{
                            "Captured Second": captured_second,
                            "Entries": second_groups[captured_second]
                        }]
                    }
                    try:
                        self.producer.send(self.topic, key=current_minute, value=batch)
                        self.producer.flush()
                        logging.info(f"Produced message for second {captured_second} of minute {captured_minute}")
                    except Exception as e:
                        logging.error(f"Error sending message to Kafka: {e}")
                else:
                    # Move to the next minute
                    current_minute = captured_minute
                    second_groups = {
                        captured_second: [{
                            "Latitude": row["Latitude"],
                            "Longitude": row["Longitude"],
                            "Value": row["Value"]
                        }]
                    }

            sleep(self.check_interval)

    def start(self):
        """
        Start the Kafka data provider by initiating the message production thread.
        """
        self.stop_event.clear()
        self.thread = threading.Thread(target=self.produce_messages)
        self.thread.start()

    def stop(self):
        """
        Stop the Kafka data provider by setting the stop event and waiting for the thread to finish.
        """
        self.stop_event.set()
        self.thread.join()
        self.producer.close()
        logging.info("KafkaDataProvider has been stopped.")

# Usage example:
kafka_server = 'kafka:9092'
topic = 'radiation_data2'
csv_file = '/app/data/real_time_data_simulation.csv'
submission_speed = 1
check_interval = 5

provider = KafkaDataProvider(kafka_server, topic, csv_file, submission_speed, check_interval)
provider.start()

# To stop the provider:
# provider.stop()
