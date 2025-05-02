namespace InfluxDBModels;
public class SensorData
{
  required public string DeviceId { get; set; }
  required public DateTime Timestamp { get; set; }
  public Dictionary<string, object> Fields { get; set; } = new Dictionary<string, object>();
  public Dictionary<string, string> Tags { get; set; } = new Dictionary<string, string>();
}
