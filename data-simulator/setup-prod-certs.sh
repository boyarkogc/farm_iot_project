#!/bin/bash

# Certificate setup for production Mosquitto on GCP VM
set -e

echo "🔐 Setting up certificates for production Mosquitto (GCP VM)"
echo "=========================================================="

# Create production certificate directory
mkdir -p certs/prod

echo "📋 To connect to your Mosquitto instance on GCP VM, you have two options:"
echo ""
echo "Option 1: Use the same certificates as development (simplest)"
echo "----------------------------------------"
echo "If your GCP Mosquitto uses the same CA and client certificates:"
echo "  cp ca.crt certs/prod/"
echo "  cp client.crt certs/prod/"
echo "  cp client.key certs/prod/"
echo ""

echo "Option 2: Generate new certificates for production (recommended)"
echo "------------------------------------------------------------"
echo "1. On your GCP VM, generate a new CA and certificates"
echo "2. Copy them to this directory: certs/prod/"
echo ""

read -p "Do you want to copy your existing dev certificates to prod? (y/n): " use_dev_certs

if [[ $use_dev_certs == "y" || $use_dev_certs == "Y" ]]; then
    echo "📋 Copying development certificates to production..."
    cp ca.crt certs/prod/
    cp client.crt certs/prod/
    cp client.key certs/prod/
    echo "✅ Certificates copied to certs/prod/"
else
    echo "📋 Manual setup required:"
    echo "1. Generate certificates on your GCP VM Mosquitto instance"
    echo "2. Copy the following files to certs/prod/:"
    echo "   - ca.crt (Certificate Authority)"
    echo "   - client.crt (Client Certificate)"  
    echo "   - client.key (Client Private Key)"
fi

# Create production environment template
cat > .env.prod.example << 'EOF'
# Production Environment Configuration for Data Simulator
ENV=prod

# Production Mosquitto on GCP VM
PROD_MQTT_BROKER_HOST=your-gcp-vm-external-ip
PROD_MQTT_PORT=8883
PROD_MQTT_USERNAME=mqtt_admin
PROD_MQTT_PASSWORD=your_production_password

# Production TLS Certificate paths (mounted as volume)
PROD_CA_CERTS=/app/certs/ca.crt
PROD_CERTFILE=/app/certs/client.crt
PROD_KEYFILE=/app/certs/client.key

# Device Configuration
DEVICE_ID_1=PROD_DEVICE_001
DEVICE_ID_2=PROD_DEVICE_002
DEVICE_LOCATION=production_farm
PUBLISH_INTERVAL=30
EOF

echo ""
echo "📝 Created .env.prod.example"
echo ""
echo "Next steps:"
echo "1. Copy .env.prod.example to .env.prod"
echo "2. Update .env.prod with your GCP VM details:"
echo "   - PROD_MQTT_BROKER_HOST: Your GCP VM's external IP"
echo "   - PROD_MQTT_PASSWORD: Your production MQTT password"
echo "3. Build production image: docker build -f Dockerfile.prod -t data-simulator:prod ."
echo "4. Run with certificates: docker run --env-file .env.prod -v \$(pwd)/certs/prod:/app/certs data-simulator:prod"
echo ""
echo "🔥 Make sure your GCP VM firewall allows connections on port 8883!"