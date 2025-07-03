#!/usr/bin/env python3
"""
MQTT client for the Raspberry Pi IoT Gateway.
Handles communication with the cloud MQTT broker.
"""

import os
import ssl
import json
import time
from dotenv import load_dotenv
from loguru import logger

# Import the MQTT client library
import paho.mqtt.client as mqtt

# Load environment variables if not already loaded
load_dotenv()

class MQTTClient:
    """MQTT client for connecting to a broker and publishing sensor data."""
    
    def __init__(self):
        """Initialize the MQTT client."""
        # Get MQTT configuration from environment variables
        self.broker = os.getenv("MQTT_BROKER", "localhost")
        self.port = int(os.getenv("MQTT_PORT", "1883"))
        self.username = os.getenv("MQTT_USERNAME", "")
        self.password = os.getenv("MQTT_PASSWORD", "")
        self.client_id = os.getenv("MQTT_CLIENT_ID", "rpi-gateway")
        self.use_tls = os.getenv("MQTT_USE_TLS", "false").lower() == "true"
        self.topic_prefix = os.getenv("MQTT_TOPIC_PREFIX", "sensors")
        
        # Create MQTT client instance
        self.client = mqtt.Client(client_id=self.client_id)
        
        # Set username and password if provided
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)
        
        # Configure TLS if enabled
        if self.use_tls:
            self.client.tls_set(
                ca_certs=None,  # Default CA certs
                tls_version=ssl.PROTOCOL_TLS
            )
            self.client.tls_insecure_set(False)
        
        # Set callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        
        logger.info(f"MQTT client initialized with broker: {self.broker}:{self.port}")
    
    def connect(self):
        """Connect to the MQTT broker."""
        try:
            logger.info(f"Connecting to MQTT broker at {self.broker}:{self.port}...")
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {str(e)}")
            return False
    
    def disconnect(self):
        """Disconnect from the MQTT broker."""
        try:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("Disconnected from MQTT broker")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting from MQTT broker: {str(e)}")
            return False
    
    def publish(self, topic, payload, qos=1, retain=False):
        """Publish a message to an MQTT topic.
        
        Args:
            topic: MQTT topic to publish to
            payload: Message to publish (string or dict that will be converted to JSON)
            qos: Quality of Service level (0, 1, or 2)
            retain: Whether the message should be retained by the broker
            
        Returns:
            Result code from the publish operation
        """
        try:
            # Convert dict payload to JSON string if needed
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            
            # Publish message
            result = self.client.publish(topic, payload, qos=qos, retain=retain)
            result.wait_for_publish()
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"Published message to {topic}")
                return True
            else:
                logger.warning(f"Failed to publish message to {topic}, error code: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing to MQTT: {str(e)}")
            return False
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback for when the client connects to the broker."""
        if rc == 0:
            logger.info("Connected to MQTT broker successfully")
            # Subscribe to control messages if needed
            control_topic = f"{self.topic_prefix}/gateway/{self.client_id}/control"
            client.subscribe(control_topic, qos=1)
            logger.info(f"Subscribed to control topic: {control_topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker, return code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the broker."""
        if rc != 0:
            logger.warning("Unexpected disconnection from MQTT broker")
            # Try to reconnect
            time.sleep(5)  # Wait a bit before reconnecting
            try:
                client.reconnect()
            except Exception as e:
                logger.error(f"Failed to reconnect to MQTT broker: {str(e)}")
        else:
            logger.info("Disconnected from MQTT broker")
    
    def _on_publish(self, client, userdata, mid):
        """Callback for when a message is published."""
        logger.debug(f"Message {mid} published successfully")
