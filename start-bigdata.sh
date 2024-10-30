#!/bin/bash

# Start Zookeeper in the background
echo "Starting Zookeeper..."
/etc/confluent/docker/run &
ZOOKEEPER_PID=$!

# Wait for Zookeeper to start
sleep 20

# Start Kafka
echo "Starting Kafka..."
KAFKA_OPTS="" /etc/confluent/docker/run

# Wait for both processes to finish
wait $ZOOKEEPER_PID
