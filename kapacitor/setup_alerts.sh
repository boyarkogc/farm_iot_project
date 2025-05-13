#!/bin/bash

# Script to setup and enable Kapacitor alerts
# Make sure you've updated my-bucket and my-org in the TICK scripts with your actual values

# Method 1: Using the mounted file
echo "Defining temperature alert task..."
docker exec kapacitor kapacitor define temperature_alert \
  -type batch \
  -tick /etc/kapacitor/temperature_alert.tick

# In case the above fails, try method 2: Copy the file into the container first
if [ $? -ne 0 ]; then
  echo "Trying alternate method..."
  # Copy the tick script into the container
  docker cp ./kapacitor/temperature_alert.tick kapacitor:/tmp/temperature_alert.tick
  
  # Define the alert using the copied file
  docker exec kapacitor kapacitor define temperature_alert \
    -type batch \
    -tick /tmp/temperature_alert.tick
fi

# Enable the alert
echo "Enabling temperature alert task..."
docker exec kapacitor kapacitor enable temperature_alert

# List configured alerts to verify
echo "Listing all tasks:"
docker exec kapacitor kapacitor list tasks

echo "Temperature alert has been set up and enabled."
echo "To view alerts in real-time: docker exec kapacitor kapacitor show temperature_alert"