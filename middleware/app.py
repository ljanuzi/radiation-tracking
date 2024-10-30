from flask import Flask, Response, stream_with_context, jsonify, request
from kafka import KafkaConsumer
import threading
import json
import logging
import pandas as pd
from datetime import datetime
from collections import deque
import threading
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

app = Flask(__name__)
CORS(app)

# Kafka consumer setup
kafka_server = 'kafka:9092'
topic = 'radiation_data2'

# A thread-safe deque to store consumed messages
messages = deque()
messages_lock = threading.Lock()

# Function to consume messages
def consume_messages():
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=[kafka_server],
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='your-consumer-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    logging.info("Started consuming messages from Kafka")
    for message in consumer:
        logging.info(f"Consumed message: {message.value}")
        with messages_lock:
            messages.append({
                'key': message.key.decode('utf-8') if message.key else None,
                'value': message.value
            })

# Start consuming messages in a separate thread
thread = threading.Thread(target=consume_messages)
thread.daemon = True
thread.start()



@app.route('/stream')
def stream():
    def event_stream():
        while True:
            with messages_lock:
                if messages:
                    message = messages.popleft()
                    yield f'data: {json.dumps(message)}\n\n'

    return Response(stream_with_context(event_stream()), content_type='text/event-stream')

@app.route('/')
def index():
    return "Kafka to Google Maps streaming service is running."

@app.route('/messages', methods=['GET'])
def get_messages():
    with messages_lock:
        logging.info(f"Returning {len(messages)} messages")
        return jsonify(list(messages))



if __name__ == '__main__':
    app.run(debug=True, threaded=True)
