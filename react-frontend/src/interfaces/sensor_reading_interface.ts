// Data as it comes in from ASP.NET Core (how it's stored in influxdb)
export default interface SensorReading {
  deviceId: string;
  timestamp: string;
  fields: {
    temperature: number;
    humidity?: number; // Make humidity optional with ?
    [key: string]: number | string | undefined; // Allow for any other numeric fields
  };
}

//Data needs to be converted to this format to work with the chart in dashboard
export interface CondensedSensorReading {
  deviceId: string;
  timestamp: string;
  [key: string]: number | string | undefined;
}
