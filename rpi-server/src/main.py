#!/usr/bin/env python3
"""
Main entry point for the Raspberry Pi IoT Gateway Server.
Handles LoRa communication with Arduino devices and forwards data to MQTT broker.
"""

import os
import sys
import time
import json
import signal
from datetime import datetime
from dotenv import load_dotenv
from loguru import logger

from lora_manager import LoRaManager
from mqtt_client import MQTTClient

# Load environment variables
load_dotenv()

# Configure logger
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logger.remove()
logger.add(sys.stderr, level=log_level)
logger.add("logs/gateway.log", rotation="10 MB", level=log_level)

class IoTGateway:
    """Main gateway class that coordinates LoRa and MQTT communication."""
    
    def __init__(self):
        """Initialize the IoT Gateway."""
        logger.info("Initializing IoT Gateway...")
        
        # Initialize LoRa manager
        try:
            self.lora_manager = LoRaManager()
            logger.info("LoRa manager initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LoRa manager: {str(e)}")
            sys.exit(1)
        
        # Initialize MQTT client
        try:
            self.mqtt_client = MQTTClient()
            logger.info("MQTT client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize MQTT client: {str(e)}")
            sys.exit(1)
            
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        logger.info("IoT Gateway initialized successfully")
    
    def start(self):
        """Start the gateway operations."""
        logger.info("Starting IoT Gateway...")
        
        # Connect to MQTT broker
        self.mqtt_client.connect()
        
        # Start LoRa receiver
        self.lora_manager.set_receive_callback(self.on_lora_data_received)
        self.lora_manager.start_receiving()
        
        logger.info("IoT Gateway is running. Press CTRL+C to stop.")
        
        # Main loop
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
            self.cleanup()
    
    def on_lora_data_received(self, payload, rssi, snr):
        """Handle data received from LoRa devices."""
        logger.debug(f"Received LoRa data - RSSI: {rssi}, SNR: {snr}")
        logger.debug(f"Payload: {payload}")
        
        try:
            # Parse the JSON payload
            data = json.loads(payload)
            
            # Validate required fields
            if 'device_id' not in data:
                logger.warning("Received data missing device_id field")
                return
                
            # Add metadata if not present
            if 'timestamp' not in data:
                data['timestamp'] = int(datetime.now().timestamp())
            
            # Add signal quality metrics
            data['metadata'] = {
                'rssi': rssi,
                'snr': snr,
                'gateway_id': os.getenv('MQTT_CLIENT_ID', 'rpi-gateway')
            }
            
            # Publish to MQTT
            topic = f"{os.getenv('MQTT_TOPIC_PREFIX', 'sensors')}/{data['device_id']}/data"
            self.mqtt_client.publish(topic, json.dumps(data))
            logger.info(f"Published data from device {data['device_id']} to {topic}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON payload: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing LoRa data: {str(e)}")
    
    def signal_handler(self, sig, frame):
        """Handle termination signals."""
        logger.info(f"Received signal {sig}, shutting down...")
        self.cleanup()
        sys.exit(0)
    
    def cleanup(self):
        """Clean up resources before exit."""
        logger.info("Cleaning up resources...")
        
        if hasattr(self, 'lora_manager'):
            self.lora_manager.stop_receiving()
            
        if hasattr(self, 'mqtt_client'):
            self.mqtt_client.disconnect()
            
        logger.info("Cleanup complete")


if __name__ == "__main__":
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Create and start the gateway
    gateway = IoTGateway()
    gateway.start()
