import paho.mqtt.client as mqtt
import time
import json
import random
import logging

# Configure the logger
logging.basicConfig(
    filename='app.log', 
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='a' # 'a' for append, 'w' for overwrite
)

MQTT_BROKER = "mosquitto"
MQTT_PORT = 1883
DEVICE_ID = "ABCD1234"
DEVICE_ID_2 = "arduino-1747161653978"
MQTT_TOPIC = f"sensors/{DEVICE_ID}/data"

logging.debug("test1")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("$SYS/#")

client.on_connect = on_connect
client.connect(MQTT_BROKER, MQTT_PORT, 60)
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

        time.sleep(10) # Publish every 10 seconds
except KeyboardInterrupt:
    print("Exiting...")
finally:
    client.loop_stop()
    client.disconnect()