#!/bin/bash
# Installation script for Raspberry Pi IoT Gateway

set -e

echo "Installing Raspberry Pi IoT Gateway..."

# Update and install system dependencies
echo "Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-dev python3-venv libgpiod2
sudo apt-get install -y git build-essential libssl-dev

# Create a virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Set up configuration
echo "Setting up configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from example. Please edit it with your configuration."
fi

# Create logs directory
mkdir -p logs

# Set up the service to run on boot
echo "Setting up systemd service..."
sudo tee /etc/systemd/system/rpi-iot-gateway.service > /dev/null << EOT
[Unit]
Description=Raspberry Pi IoT Gateway
After=network.target

[Service]
ExecStart=$(pwd)/venv/bin/python $(pwd)/src/main.py
WorkingDirectory=$(pwd)
StandardOutput=inherit
StandardError=inherit
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOT

# Enable the service
echo "Enabling service to start on boot..."
sudo systemctl enable rpi-iot-gateway.service

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your MQTT broker details: nano .env"
echo "2. Start the service: sudo systemctl start rpi-iot-gateway.service"
echo "3. Check service status: sudo systemctl status rpi-iot-gateway.service"
echo "4. View logs: tail -f logs/gateway.log"
echo ""
echo "To manually run the gateway without the service:"
echo "source venv/bin/activate && python src/main.py"
echo ""