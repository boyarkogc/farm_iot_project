import paho.mqtt.client as mqtt
import time
import json
import random
import logging
import os
import ssl

# Configure the logger
logging.basicConfig(
    filename='app.log', 
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='a' # 'a' for append, 'w' for overwrite
)

MQTT_BROKER_HOST = os.getenv('MQTT_BROKER_HOST', 'mosquitto')
MQTT_PORT = 8883  # Changed to TLS port
DEVICE_ID = "ABCD1234"
DEVICE_ID_2 = "arduino-1748272235877"
MQTT_TOPIC = f"sensors/{DEVICE_ID}/data"
MQTT_TOPIC_2 = f"sensors/{DEVICE_ID_2}/data"


logging.debug("test1")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
#secure 
client.username_pw_set("mqtt_admin", "%VnPXyi56Gw$Lz#GLwAy")
# Allow self-signed certificates by setting cert_reqs to CERT_NONE
client.tls_set(ca_certs="server-ca.crt", certfile="client.crt", keyfile="client.key", cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2)
client.tls_insecure_set(True)


def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("$SYS/#")

client.on_connect = on_connect
client.connect(MQTT_BROKER_HOST, MQTT_PORT, 60)
client.loop_start() # Start network loop in background
logging.debug("hello world")
try:
    while True:
        soil_moisture = round(random.uniform(20.0, 80.0), 2)
        temp = round(random.uniform(40.0, 100.0), 2)
        payload = json.dumps({
            "device_id": DEVICE_ID,
            "location": "backyard",
            "soil_moisture": soil_moisture,
            "temperature": temp,
            "timestamp": time.time() # Or use ISO format string
        })
        result = client.publish(MQTT_TOPIC, payload)
        # result: [0, 1]
        status = result[0]
        if status == 0:
            print(f"Send `{payload}` to topic `{MQTT_TOPIC}`")
        else:
            print(f"Failed to send message to topic {MQTT_TOPIC}")

        temp = round(random.uniform(40.0, 100.0), 2)
        payload = json.dumps({
            "device_id": DEVICE_ID_2,
            "location": "backyard",
            "soil_moisture": soil_moisture,
            "temperature": temp,
            "timestamp": time.time() # Or use ISO format string
        })
        result = client.publish(MQTT_TOPIC_2, payload)
        # result: [0, 1]
        status = result[0]
        if status == 0:
            print(f"Send `{payload}` to topic `{MQTT_TOPIC_2}`")
        else:
            print(f"Failed to send message to topic {MQTT_TOPIC_2}")

        time.sleep(10) # Publish every 10 seconds
except KeyboardInterrupt:
    print("Exiting...")
finally:
    client.loop_stop()
    client.disconnect()