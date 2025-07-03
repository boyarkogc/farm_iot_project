# Arduino Device Setup Guide

This guide explains how to set up Arduino-based sensor nodes that communicate with the Raspberry Pi gateway using LoRa.

## Hardware Requirements

- Arduino board (Uno, Nano, Pro Mini, etc.)
- LoRa module (such as RFM95W, SX1276/77/78/79)
- Sensors (temperature, humidity, soil moisture, etc.)
- Power source (batteries, solar panel, etc.)
- Weatherproof enclosure (for outdoor deployment)

## Wiring the LoRa Module

Connect the LoRa module to the Arduino as follows:

| LoRa Module | Arduino |
|-------------|---------|
| VCC         | 3.3V    |
| GND         | GND     |
| MISO        | 12 (MISO) |
| MOSI        | 11 (MOSI) |
| SCK         | 13 (SCK) |
| NSS/CS      | 10 (or as defined in code) |
| RESET       | 9 (or as defined in code)  |
| DIO0/G0/INT | 2 (or as defined in code)  |

**Note**: Pin assignments may vary based on your Arduino model and code configuration.

## Required Libraries

Install the following libraries through the Arduino Library Manager:

1. RadioHead by Mike McCauley (for LoRa communication)
2. ArduinoJson by Benoit Blanchon (for data formatting)
3. LowPower by Rocket Scream (for battery optimization)

## Sample Code

See the `arduino_example.ino` file in this directory for a complete working example.

## Power Optimization

For battery-powered sensors:

1. Use the LowPower library to put the Arduino to sleep between readings
2. Consider using an external RTC for more precise timing
3. Minimize transmit power to conserve energy (adjust in code)
4. Reduce transmission frequency based on your needs

Example power-saving code:

```cpp
#include <LowPower.h>

void loop() {
  // Take readings and send data
  sendSensorData();
  
  // Sleep for 8 seconds, repeated 225 times (30 minutes)
  for (int i = 0; i < 225; i++) {
    LowPower.powerDown(SLEEP_8S, ADC_OFF, BOD_OFF);
  }
}
```

## Weatherproofing

For outdoor deployments:

1. Use a waterproof enclosure (IP65 or better)
2. Add silica gel packets inside the enclosure to absorb moisture
3. Use waterproof connectors for external sensors
4. Consider adding a small vent to prevent condensation

## Troubleshooting

Common issues:

1. **Cannot communicate with LoRa module**: Check SPI connections and CS pin assignment
2. **Short battery life**: Enable sleep mode and reduce transmission frequency
3. **Inconsistent readings**: Add filtering or averaging to sensor readings
4. **Limited range**: Try adjusting antenna position or increasing height

## Integration with Gateway

To ensure your Arduino device works with the gateway:

1. Use the same LoRa frequency and settings as configured on the gateway
2. Format data as JSON with the required fields (device_id, etc.)
3. Include error checking and retry logic for transmissions
4. Consider implementing message acknowledgment for critical data