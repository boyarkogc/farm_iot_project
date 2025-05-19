using Google.Cloud.Firestore;
using InfluxDB.Client;
using InfluxDBModels;

namespace DotnetServer.Features.Devices;

public interface IDeviceService
{
  Task<IEnumerable<Device?>> GetAllDevicesByUserAsync(string userId);
  Task<IEnumerable<String?>> GetAllFieldsByDeviceAsync(string deviceId);
  Task<IEnumerable<SensorData?>> GetReadingsByDeviceByTimePeriod(string deviceId, int hours);
}

public class DeviceService : IDeviceService
{
  private readonly FirestoreDb _firestoreDb;
  private readonly InfluxDBClient _influxDBClient;
  private readonly IConfiguration _config;

  public DeviceService(FirestoreDb firestoreDb, InfluxDBClient influxDBClient, IConfiguration config)
  {
    _firestoreDb = firestoreDb;
    _influxDBClient = influxDBClient;
    _config = config;
  }
  public async Task<IEnumerable<Device?>> GetAllDevicesByUserAsync(string userId)
  {
    var userDevicesCollection = _firestoreDb.Collection("users").Document(userId).Collection("devices");
    var query = userDevicesCollection.Limit(100); // Create a Query from the CollectionReference with a reasonable limit
    var snapshot = await query.GetSnapshotAsync();

    var devices = new List<Device>();
    foreach (var doc in snapshot)
    {
      var device = doc.ConvertTo<Device>();
      // Ensure the ID is set (it's the document ID in Firestore)
      if (string.IsNullOrEmpty(device.Id))
      {
        device.Id = doc.Id;
      }
      devices.Add(device);
    }
    return devices;
  }

  public async Task<IEnumerable<String?>> GetAllFieldsByDeviceAsync(string deviceId)
  {
    var query = $@"import ""influxdata/influxdb/schema""
                    schema.fieldKeys(
                    bucket: ""my-bucket"",
                    predicate: (r) => r[""_measurement""] == ""sensor_readings"" and r[""device_id""] == ""{deviceId}""
                    )";

    var results = await _influxDBClient.GetQueryApi().QueryAsync(query, _config["influxdb-org"]);

    // Extract field names from results
    var fieldKeys = new List<string>();
    foreach (var table in results)
    {
      foreach (var record in table.Records)
      {
        fieldKeys.Add(record.GetValue().ToString());
      }
    }

    return fieldKeys;
  }

  public async Task<IEnumerable<SensorData>> GetReadingsByDeviceByTimePeriod(string deviceId, int hours)
  {
    var timeRange = TimeSpan.FromHours(hours);
    var query = $@"
            from(bucket: ""my-bucket"")
            |> range(start: -{timeRange.TotalSeconds}s)
            |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
            |> filter(fn: (r) => r[""device_id""] == ""{deviceId}"")";

    var tables = await _influxDBClient.GetQueryApi().QueryAsync(query, "my-org");
    var readings = new Dictionary<DateTime, SensorData>();

    foreach (var record in tables.SelectMany(table => table.Records))
    {
      var timestamp = record.GetTimeInDateTime().Value;

      if (!readings.TryGetValue(timestamp, out var reading))
      {
        reading = new SensorData
        {
          DeviceId = deviceId,
          Timestamp = timestamp
        };
        readings[timestamp] = reading;
      }

      // Dynamically add the field
      var fieldName = record.GetField();
      var fieldValue = record.GetValue();
      reading.Fields[fieldName] = fieldValue;

      // Add tags
      foreach (var tag in record.Values.Where(v => v.Key != "_value" && v.Key != "_field"))
      {
        reading.Tags[tag.Key] = tag.Value?.ToString();
      }
    }

    return readings.Values.ToList();
  }
}