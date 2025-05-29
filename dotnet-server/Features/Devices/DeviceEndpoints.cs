using Google.Cloud.Firestore;
using InfluxDB.Client;

namespace DotnetServer.Features.Devices;

public static class DeviceEndpoints
{
  public static void MapDeviceEndpoints(this WebApplication app)
  {
    app.MapGet("/api/devices", async (IDeviceService deviceService, HttpContext httpContext) =>
    {
      // Get userId from authentication context
      string userId = httpContext.Request.Headers["X-User-ID"].ToString();

      // Validate user is authenticated
      if (string.IsNullOrEmpty(userId))
      {
        return Results.Unauthorized();
      }

      // Call your service
      var devices = await deviceService.GetAllDevicesByUserAsync(userId);

      // Return devices with 200 OK status
      return Results.Ok(devices);
    });

    app.MapGet("/api/devices/{deviceId}/fields", async (IDeviceService deviceService, string deviceId, ILogger<Program> logger) =>
    {
      try
      {
        logger.LogInformation($"Getting fields for device: {deviceId}");
        var fields = await deviceService.GetAllFieldsByDeviceAsync(deviceId);
        logger.LogInformation($"Found {fields?.Count()} fields for device: {deviceId}");
        return Results.Ok(fields);
      }
      catch (Exception ex)
      {
        logger.LogError(ex, $"Error getting fields for device {deviceId}: {ex.Message}");
        return Results.Problem($"Error retrieving fields for device {deviceId}: {ex.Message}");
      }
    });

    app.MapGet("/api/devices/{deviceId}/readings", async (IDeviceService deviceService,
                    string deviceId,
                    int hours = 24) =>
    {
      var readings = await deviceService.GetReadingsByDeviceByTimePeriod(deviceId, hours);
      return Results.Ok(readings);
    });
  }
}