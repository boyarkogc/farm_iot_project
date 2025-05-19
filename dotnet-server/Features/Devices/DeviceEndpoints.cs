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

    app.MapGet("devices/{deviceId}/fields", async (IDeviceService deviceService, string deviceId) =>
    {
      var fields = await deviceService.GetAllFieldsByDeviceAsync(deviceId);
      return Results.Ok(fields);
    });

    app.MapGet("devices/{deviceId}/readings", async (IDeviceService deviceService,
                    string deviceId,
                    int hours = 24) =>
    {
      var readings = await deviceService.GetReadingsByDeviceByTimePeriod(deviceId, hours);
      return Results.Ok(readings);
    });
  }
}