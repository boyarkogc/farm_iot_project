import paho.mqtt.client as mqtt
import time
import json
import random
import logging
import os
import ssl
from config import Config

# Initialize configuration
config = Config()
device_config = config.get_device_config()

# Setup device information
DEVICE_ID = device_config['device_id_1']
DEVICE_ID_2 = device_config['device_id_2']
DEVICE_LOCATION = device_config['location']
PUBLISH_INTERVAL = device_config['publish_interval']

MQTT_TOPIC = f"sensors/{DEVICE_ID}/data"
MQTT_TOPIC_2 = f"sensors/{DEVICE_ID_2}/data"

logging.info(f"Starting data simulator for devices: {DEVICE_ID}, {DEVICE_ID_2}")
logging.info(f"Publishing to location: {DEVICE_LOCATION} every {PUBLISH_INTERVAL} seconds")

# Setup MQTT client
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(config.mqtt_username, config.mqtt_password)

# Configure TLS if enabled
if config.use_tls:
    try:
        client.tls_set(
            ca_certs=config.ca_certs, 
            certfile=config.certfile, 
            keyfile=config.keyfile, 
            cert_reqs=ssl.CERT_NONE if config.tls_insecure else ssl.CERT_REQUIRED, 
            tls_version=ssl.PROTOCOL_TLSv1_2
        )
        if config.tls_insecure:
            client.tls_insecure_set(True)
        logging.info("TLS configured successfully")
    except Exception as e:
        logging.error(f"Failed to configure TLS: {e}")
        if config.environment == 'prod':
            raise  # Fail fast in production


def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("$SYS/#")

def publish_sensor_data(device_id, topic, location):
    """Publish sensor data for a specific device"""
    soil_moisture = round(random.uniform(20.0, 80.0), 2)
    temp = round(random.uniform(40.0, 100.0), 2)
    payload = json.dumps({
        "device_id": device_id,
        "location": location,
        "soil_moisture": soil_moisture,
        "temperature": temp,
        "timestamp": time.time()
    })
    
    result = client.publish(topic, payload)
    status = result[0]
    if status == 0:
        logging.info(f"Published data for {device_id}: temp={temp}°F, moisture={soil_moisture}%")
        print(f"✓ {device_id}: temp={temp}°F, moisture={soil_moisture}%")
    else:
        logging.error(f"Failed to publish data for {device_id}")
        print(f"✗ Failed to publish data for {device_id}")

client.on_connect = on_connect

try:
    logging.info(f"Connecting to MQTT broker at {config.mqtt_broker_host}:{config.mqtt_port}")
    client.connect(config.mqtt_broker_host, config.mqtt_port, 60)
    client.loop_start()
    
    logging.info("Data simulator started successfully")
    print(f"🚀 Data simulator started - Environment: {config.environment}")
    print(f"📡 Publishing to: {config.mqtt_broker_host}:{config.mqtt_port}")
    print(f"🔄 Interval: {PUBLISH_INTERVAL} seconds")
    print("Press Ctrl+C to stop")
    
    while True:
        # Publish data for both devices
        publish_sensor_data(DEVICE_ID, MQTT_TOPIC, DEVICE_LOCATION)
        publish_sensor_data(DEVICE_ID_2, MQTT_TOPIC_2, DEVICE_LOCATION)
        
        time.sleep(PUBLISH_INTERVAL)
        
except KeyboardInterrupt:
    print("\n🛑 Stopping data simulator...")
    logging.info("Data simulator stopped by user")
except Exception as e:
    print(f"❌ Error: {e}")
    logging.error(f"Data simulator error: {e}")
finally:
    client.loop_stop()
    client.disconnect()
    logging.info("MQTT client disconnected")