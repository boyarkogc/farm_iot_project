#!/bin/bash

# Check if a gateway ID was provided
if [ $# -lt 1 ]; then
  echo "Usage: ./generate-gateway-code.sh <gatewayId>"
  echo "Example: ./generate-gateway-code.sh gateway-123"
  exit 1
fi

GATEWAY_ID="$1"

# Run the .NET tool in the dedicated directory
cd "$(dirname "$0")/Tools/GatewayRegistration"
dotnet run "$GATEWAY_ID"