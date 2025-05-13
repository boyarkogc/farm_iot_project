# Kapacitor Setup for Farm IoT Project

## Overview

Kapacitor is used for real-time stream processing of time series data from InfluxDB. In this project, it's primarily used for:

1. Setting up alerts for sensor readings (temperature, humidity, etc.)
2. Processing data for anomaly detection
3. Creating automated responses to certain conditions

## Getting Started

### Basic Structure

- `/kapacitor/kapacitor.conf` - Main configuration file
- Tick scripts (to be created as needed) for defining alerts and data processing

### Creating Alert Tasks

Kapacitor uses TICKscripts to define alert logic. Here's a basic example for monitoring temperature:

```
// temperature_alert.tick
dbrp "my-bucket/autogen"

// Create a stream from all temperature measurements
var data = stream
    |from()
        .measurement('temperature')
    |window()
        .period(5m)
        .every(1m)
    
// Alert when temperature is too high
var alert = data
    |alert()
        .id('high_temperature')
        .message('High temperature detected: {{ index .Fields "value" }}')
        .warn(lambda: "value" > 30)
        .crit(lambda: "value" > 35)
        // Uncomment to enable notification channels
        //.slack()
        //.email()

alert
    |influxDBOut()
        .create()
        .database('alerts')
        .retentionPolicy('autogen')
        .measurement('temperature_alerts')
```

### Define and Load a Task

To define and load a task:

1. Create a tick script file (e.g., `temperature_alert.tick`)
2. Load it into Kapacitor using the Kapacitor CLI:

```bash
# Define the task
kapacitor define temperature_alert -type stream -tick temperature_alert.tick

# Enable the task
kapacitor enable temperature_alert
```

### Connecting Alert Outputs

In the `kapacitor.conf` file, you can set up various notification outputs:

- Slack
- Email (SMTP)
- OpsGenie
- PagerDuty
- Custom HTTP endpoints

Edit the respective sections in the config file to enable and configure these outputs.

## Accessing Kapacitor

- Web UI: http://localhost:9092
- API Endpoint: http://localhost:9092/kapacitor/v1

## Common Commands

```bash
# List all tasks
kapacitor list tasks

# Show a specific task
kapacitor show temperature_alert

# Delete a task
kapacitor delete tasks temperature_alert

# Test a task with recorded data
kapacitor record stream -task temperature_alert -duration 20m
```

## Resources

- [Kapacitor Documentation](https://docs.influxdata.com/kapacitor/)
- [TICKscript Reference](https://docs.influxdata.com/kapacitor/v1.6/tick/)`