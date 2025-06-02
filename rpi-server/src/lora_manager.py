#!/usr/bin/env python3
"""
LoRa communication manager for the Raspberry Pi IoT Gateway.
Handles communication with Arduino devices via LoRa radio.
"""

import os
import time
import threading
from dotenv import load_dotenv
from loguru import logger

# Load environment variables if not already loaded
load_dotenv()

# Try to import LoRa libraries
try:
    # First try the rpi-lora library
    from lora import LoRa
    LORA_LIBRARY = "rpi-lora"
except ImportError:
    try:
        # Then try the pyLoRaRF library
        from pyLoRaRF import SX127x
        LORA_LIBRARY = "pyLoRaRF"
    except ImportError:
        logger.error("No LoRa library found. Please install either rpi-lora or pyLoRaRF")
        LORA_LIBRARY = None


class LoRaManager:
    """Manages LoRa radio communication."""
    
    def __init__(self):
        """Initialize the LoRa Manager."""
        # Get LoRa configuration from environment variables
        self.frequency = float(os.getenv("LORA_FREQUENCY", "915.0"))
        self.tx_power = int(os.getenv("LORA_TX_POWER", "17"))
        self.spreading_factor = int(os.getenv("LORA_SPREADING_FACTOR", "7"))
        self.bandwidth = int(os.getenv("LORA_BANDWIDTH", "125000"))
        self.coding_rate = int(os.getenv("LORA_CODING_RATE", "5"))
        
        # GPIO pins
        self.cs_pin = int(os.getenv("LORA_CS_PIN", "25"))
        self.rst_pin = int(os.getenv("LORA_RST_PIN", "17"))
        self.irq_pin = int(os.getenv("LORA_IRQ_PIN", "26"))
        
        # Initialize LoRa radio based on available library
        if LORA_LIBRARY == "rpi-lora":
            self._init_rpi_lora()
        elif LORA_LIBRARY == "pyLoRaRF":
            self._init_pyLoRaRF()
        else:
            raise ImportError("No compatible LoRa library found")
        
        # Receive callback and thread
        self.receive_callback = None
        self.receive_thread = None
        self.running = False
        
        logger.info(f"LoRa Manager initialized with {LORA_LIBRARY} library")
        logger.info(f"LoRa frequency: {self.frequency} MHz, SF: {self.spreading_factor}, BW: {self.bandwidth} Hz")
    
    def _init_rpi_lora(self):
        """Initialize using rpi-lora library."""
        self.lora = LoRa(
            spi_bus=0,
            spi_cs=self.cs_pin,
            reset=self.rst_pin,
            irq=self.irq_pin,
            freq=self.frequency * 1000000,  # Convert MHz to Hz
            tx_power=self.tx_power,
            modem_config={
                'spreading_factor': self.spreading_factor,
                'bandwidth': self.bandwidth,
                'coding_rate': self.coding_rate
            }
        )
    
    def _init_pyLoRaRF(self):
        """Initialize using pyLoRaRF library."""
        self.lora = SX127x()
        self.lora.begin(self.cs_pin, self.rst_pin, self.irq_pin)
        self.lora.setFrequency(self.frequency * 1000000)  # Convert MHz to Hz
        self.lora.setTxPower(self.tx_power)
        self.lora.setSpreadingFactor(self.spreading_factor)
        self.lora.setBandwidth(self.bandwidth)
        self.lora.setCodingRate(self.coding_rate)
        self.lora.setLnaGain(0)  # Auto gain control
    
    def set_receive_callback(self, callback):
        """Set the callback function for received data.
        
        Args:
            callback: Function to call when data is received.
                      It should accept (payload, rssi, snr) as arguments.
        """
        self.receive_callback = callback
    
    def start_receiving(self):
        """Start the LoRa receiver thread."""
        if self.receive_thread is not None and self.receive_thread.is_alive():
            logger.warning("LoRa receiver thread is already running")
            return
        
        self.running = True
        self.receive_thread = threading.Thread(target=self._receive_loop)
        self.receive_thread.daemon = True
        self.receive_thread.start()
        logger.info("LoRa receiver thread started")
    
    def stop_receiving(self):
        """Stop the LoRa receiver thread."""
        self.running = False
        if self.receive_thread is not None:
            self.receive_thread.join(timeout=2.0)
            logger.info("LoRa receiver thread stopped")
    
    def _receive_loop(self):
        """Background thread that listens for LoRa messages."""
        logger.info("LoRa receive loop started")
        
        if LORA_LIBRARY == "rpi-lora":
            self._receive_loop_rpi_lora()
        else:  # pyLoRaRF
            self._receive_loop_pyLoRaRF()
    
    def _receive_loop_rpi_lora(self):
        """Receive loop implementation for rpi-lora library."""
        while self.running:
            if self.lora.available():
                data = self.lora.recv()
                payload = data.payload
                rssi = data.rssi
                snr = data.snr
                
                if self.receive_callback is not None:
                    self.receive_callback(payload, rssi, snr)
            
            time.sleep(0.1)  # Small delay to prevent CPU hogging
    
    def _receive_loop_pyLoRaRF(self):
        """Receive loop implementation for pyLoRaRF library."""
        while self.running:
            self.lora.listen()  # Put into RX mode
            
            if self.lora.readRxDone():
                payload = self.lora.readData().decode('utf-8', errors='ignore')
                rssi = self.lora.readRssi()
                snr = self.lora.readSnr()
                
                if self.receive_callback is not None:
                    self.receive_callback(payload, rssi, snr)
            
            time.sleep(0.1)  # Small delay to prevent CPU hogging
    
    def send(self, data):
        """Send data over LoRa.
        
        Args:
            data: String or bytes to send
        
        Returns:
            True if data was sent successfully, False otherwise
        """
        try:
            if LORA_LIBRARY == "rpi-lora":
                if isinstance(data, str):
                    data = data.encode('utf-8')
                self.lora.send(data)
            else:  # pyLoRaRF
                if isinstance(data, str):
                    data = data.encode('utf-8')
                self.lora.beginPacket()
                self.lora.write(data)
                self.lora.endPacket()
            
            logger.debug(f"Sent {len(data)} bytes over LoRa")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send data over LoRa: {str(e)}")
            return False
