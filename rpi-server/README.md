# Raspberry Pi IoT Gateway Server

This server runs on a Raspberry Pi and performs two main functions:
1. Communicates with Arduino devices over LoRa
2. Forwards data to a cloud MQTT broker

## Setup

### Hardware Requirements
- Raspberry Pi (3B+ or newer recommended)
- LoRa transceiver module (e.g., RFM95W, SX1276) connected to the Pi
- Arduino devices with LoRa capabilities

### Software Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the server
python src/main.py
```

## Configuration

Edit the `.env` file or the files in the `config` directory to configure:
- MQTT broker connection details
- LoRa radio parameters
- Logging settings

## Usage

The server will automatically:
1. Connect to the LoRa network and listen for incoming messages from Arduino devices
2. Process and validate the incoming data
3. Forward the data to the configured MQTT broker

## License

Same as the main project
