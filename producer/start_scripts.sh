#!/bin/sh

# Start the data stream script in the background
python /app/data_stream.py &

# Start the Kafka data provider script
python /app/kafka_data_provider.py
