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
  private readonly ILogger<DeviceService> _logger;

  public DeviceService(FirestoreDb firestoreDb, InfluxDBClient influxDBClient, IConfiguration config, ILogger<DeviceService> logger)
  {
    _firestoreDb = firestoreDb;
    _influxDBClient = influxDBClient;
    _config = config;
    _logger = logger;
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
    var bucket = _config["InfluxDb:Bucket"] ?? "my-bucket";
    var org = _config["InfluxDb:Org"] ?? "my-org";

    try
    {
      var query = $@"import ""influxdata/influxdb/schema""
                      schema.fieldKeys(
                      bucket: ""{bucket}"",
                      predicate: (r) => r[""_measurement""] == ""sensor_readings"" and r[""device_id""] == ""{deviceId}""
                      )";

      var results = await _influxDBClient.GetQueryApi().QueryAsync(query, org);

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
    catch (Exception ex)
    {
      // If InfluxDB is not available, return empty list instead of throwing
      Console.WriteLine($"InfluxDB error for device {deviceId}:");
      Console.WriteLine($"  Error Type: {ex.GetType().Name}");
      Console.WriteLine($"  Error Message: {ex.Message}");
      Console.WriteLine($"  Inner Exception: {ex.InnerException?.Message ?? "None"}");
      Console.WriteLine($"  Stack Trace: {ex.StackTrace}");
      Console.WriteLine($"  Bucket: {bucket}, Org: {org}");
      return new List<string>();
    }
  }

  public async Task<IEnumerable<SensorData>> GetReadingsByDeviceByTimePeriod(string deviceId, int hours)
  {
    var bucket = _config["InfluxDb:Bucket"] ?? "my-bucket";
    var org = _config["InfluxDb:Org"] ?? "my-org";
    var timeRange = TimeSpan.FromHours(hours);

    _logger.LogInformation("Getting readings for device {DeviceId} over {Hours} hours from bucket {Bucket} and org {Org}",
        deviceId, hours, bucket, org);

    try
    {
      // Test InfluxDB connection first
      try
      {
        var pingResult = await _influxDBClient.PingAsync();
        _logger.LogInformation("InfluxDB ping successful: {Result}", pingResult);
      }
      catch (Exception healthEx)
      {
        _logger.LogError(healthEx, "InfluxDB ping failed");
        throw new InvalidOperationException("InfluxDB service is not available", healthEx);
      }

      // var query = $@"
      //         from(bucket: ""{bucket}"")
      //         |> range(start: -{timeRange.TotalSeconds}s)
      //         |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
      //         |> filter(fn: (r) => r[""device_id""] == ""{deviceId}"")";

      // For now, just get most recent 30 entries. We will make this more dynamic in future. 
      var query = $@"
              from(bucket: ""{bucket}"")
              |> range(start: -30d)
              |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
              |> filter(fn: (r) => r[""device_id""] == ""{deviceId}"")
              |> limit(n: 30)";

      _logger.LogInformation("Executing InfluxDB query: {Query}", query);
      var tables = await _influxDBClient.GetQueryApi().QueryAsync(query, org);
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
    catch (Exception ex)
    {
      // If InfluxDB is not available, return empty list instead of throwing
      _logger.LogError(ex, "InfluxDB error for device {DeviceId} readings. Error Type: {ErrorType}, Bucket: {Bucket}, Org: {Org}",
          deviceId, ex.GetType().Name, bucket, org);

      if (ex.InnerException != null)
      {
        _logger.LogError("Inner exception: {InnerException}", ex.InnerException.Message);
      }

      return [];
    }
  }
}