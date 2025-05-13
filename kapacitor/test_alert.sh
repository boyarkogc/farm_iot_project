#!/bin/bash

# Script to test Kapacitor alerts by writing sample data to InfluxDB
# This will write a high temperature value to trigger the alert

TOKEN="my-super-secret-admin-token"
ORG="my-org"

echo "Creating telegraf bucket..."
curl -i -XPOST "http://localhost:8086/api/v2/buckets" \
  --header "Authorization: Token $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"name": "telegraf", "orgID": "'$ORG'", "retentionRules": [{"type": "expire", "everySeconds": 604800}]}'

echo -e "\nWriting test data using InfluxDB v2 API..."
# Write a high temperature data point (40°C) to my-bucket (default bucket)
curl -i -XPOST "http://localhost:8086/api/v2/write?org=$ORG&bucket=my-bucket&precision=s" \
  --header "Authorization: Token $TOKEN" \
  --data-binary "temperature,host=device_001 value=40 $(date +%s)"

echo -e "\nWrote high temperature data point (40°C) to InfluxDB"
echo "Wait at least 30 seconds for the batch process to run"
echo "Check Kapacitor task details: docker exec kapacitor kapacitor show temperature_alert"
echo "Check Kapacitor logs: docker logs kapacitor | grep temperature"