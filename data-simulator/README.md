# Data Simulator

Generates and publishes simulated IoT sensor data for testing and development.

## Usage

### Development (with docker-compose)

The data simulator automatically runs when you start your development environment:

```bash
docker-compose up
```

This will:
- Start the simulator in `dev` mode
- Connect to the local mosquitto MQTT broker
- Publish sensor data every 10 seconds
- Use development device IDs and settings

### Production (standalone)

For production use, you can run the data simulator as a standalone Docker container to send data to your GCP VM Mosquitto instance:

1. **Setup certificates:**
   ```bash
   # Copy development certificates to production (or use your own)
   mkdir -p certs/prod
   cp ca.crt client.crt client.key certs/prod/
   chmod 644 certs/prod/ca.crt certs/prod/client.crt
   chmod 600 certs/prod/client.key
   ```

2. **Create production environment file:**
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your GCP VM IP and credentials
   ```

3. **Build production image:**
   ```bash
   docker build -f Dockerfile.prod -t data-simulator:prod .
   ```

4. **Run production simulator (foreground):**
   ```bash
   docker run --env-file .env.prod -v $(pwd)/certs/prod:/app/certs:Z data-simulator:prod
   ```

5. **Run production simulator (background/detached):**
   ```bash
   docker run -d --name prod-data-simulator --env-file .env.prod -v $(pwd)/certs/prod:/app/certs:Z data-simulator:prod
   ```

6. **Manage background simulator:**
   ```bash
   # View logs
   docker logs prod-data-simulator
   
   # Follow logs in real-time
   docker logs -f prod-data-simulator
   
   # Stop simulator
   docker stop prod-data-simulator
   
   # Remove stopped container
   docker rm prod-data-simulator
   ```

## Configuration

### Environment Variables

| Variable | Description | Default (dev) | Required (prod) |
|----------|-------------|---------------|-----------------|
| `ENV` | Environment mode (`dev` or `prod`) | `dev` | ✓ |
| `PROD_MQTT_BROKER_HOST` | Production MQTT broker hostname | - | ✓ |
| `PROD_MQTT_PORT` | Production MQTT broker port | `8883` | - |
| `PROD_MQTT_USERNAME` | Production MQTT username | - | ✓ |
| `PROD_MQTT_PASSWORD` | Production MQTT password | - | ✓ |
| `DEVICE_ID_1` | First device identifier | `ABCD1234` | - |
| `DEVICE_ID_2` | Second device identifier | `arduino-1747161653978` | - |
| `DEVICE_LOCATION` | Device location | `backyard` | - |
| `PUBLISH_INTERVAL` | Seconds between publications | `10` | - |

### Generated Data

The simulator generates realistic sensor data:
- **Temperature**: 40-100°F
- **Soil Moisture**: 20-80%
- **Timestamp**: Current Unix timestamp
- **Device ID**: Configurable device identifier
- **Location**: Configurable location

## Output

Example data payload:
```json
{
  "device_id": "ABCD1234",
  "location": "backyard",
  "soil_moisture": 65.42,
  "temperature": 72.8,
  "timestamp": 1677123456.789
}
```

## Logs

- Console output shows real-time publishing status
- File logs written to `app.log`
- Structured logging with timestamps and levels