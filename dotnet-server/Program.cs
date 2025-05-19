using Google.Cloud.SecretManager.V1;
using Microsoft.Extensions.Configuration;
using InfluxDB.Client;
using InfluxDB.Client.Api.Domain;
using InfluxDB.Client.Core.Flux.Domain;
using FirebaseAdmin;
using Google.Cloud.Firestore;
using Google.Apis.Auth.OAuth2;

//My custom namespaces
using InfluxDBModels;
using DotnetServer.Features.Devices;
using DotnetServer.Extensions;

using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddUserSecrets<Program>();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Commented out to avoid billing issues with Google Cloud

var serviceAccountPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");

Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Service account path: {serviceAccountPath}");
Console.WriteLine($"Directory exists: {Directory.Exists(Path.GetDirectoryName(serviceAccountPath))}");
Console.WriteLine($"File exists: {System.IO.File.Exists(serviceAccountPath)}");

// Initialize Firebase Admin SDK if not already initialized
// if (FirebaseApp.DefaultInstance == null)
// {
//     var credential = GoogleCredential.FromFile(serviceAccountPath);
//     FirebaseApp.Create(new AppOptions
//     {
//         Credential = credential,
//         ProjectId = firebaseProjectId
//     });
// }
string projectId = builder.Configuration["GCP:ProjectId"];
builder.Configuration.AddGoogleSecretManager(projectId);

// Register Firestore client for dependency injection
builder.Services.AddSingleton<FirestoreDb>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    string firebaseProjectId = configuration["Firebase:ProjectId"]
        ?? throw new InvalidOperationException("Firebase ProjectId not configured");
    return FirestoreDb.Create(firebaseProjectId);
});

builder.Services.AddSingleton<InfluxDBClient>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    var configuration = sp.GetRequiredService<IConfiguration>();
    var influxDbUrl = $"http://{configuration["influxdb-host"] ?? "localhost"}:8086";
    var influxDbToken = configuration["influxdb-api-token"];

    logger.LogInformation($"Using InfluxDB URL: {influxDbUrl}");
    logger.LogInformation("Token " + influxDbToken);
    return new InfluxDBClient(influxDbUrl, influxDbToken);
});

builder.Services.AddScoped<IDeviceService, DeviceService>();

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// In Program.cs
string[] allowedOrigins;

if (builder.Environment.IsDevelopment())
{
    allowedOrigins = new[] { "http://localhost:3000", "http://localhost:5173", "http://localhost:8080" };
}
else
{
    // Read from environment variables
    string? gcpProjectOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
    allowedOrigins = gcpProjectOrigins?.Split(',') ?? new[] { "https://example.com" };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("allowReactFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

if (builder.Environment.IsProduction())
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "8080"));
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("allowReactFrontend");
//app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

// app.MapGet("/test-secret", (IConfiguration configuration) =>
// {
//     var mySecret = configuration["influxdb-api-token"];
//     return $"Secret value: {mySecret}";
// });

// Define an endpoint to query InfluxDB
// app.MapGet("/data", async (InfluxDBClient influxDbClient) =>
// {
//     try
//     {
//         var query = $@"from(bucket: ""my-bucket"")
//           |> range(start: -1h)
//           |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
//           |> yield()";

//         var tables = await influxDbClient.GetQueryApi().QueryAsync(query, "my-org");

//         // Check if tables is empty
//         if (tables == null || !tables.Any())
//         {
//             return Results.Ok(new { Message = "No data returned from query" });
//         }

//         var results = new List<dynamic>();
//         foreach (var table in tables)
//         {
//             foreach (var record in table.Records)
//             {
//                 results.Add(new
//                 {
//                     Time = record.GetTime(),
//                     Measurement = record.GetMeasurement(),
//                     Field = record.GetField(),
//                     Value = record.GetValue()
//                 });
//             }
//         }

//         return Results.Ok(results);
//     }
//     catch (Exception ex)
//     {
//         return Results.Problem($"Error querying InfluxDB: {ex.Message}");
//     }
// });

// Device registration endpoints
app.MapGet("/api/devices/{deviceId}/registration-code", (
    string deviceId,
    ILogger<Program> logger) =>
{
    try
    {
        logger.LogInformation($"Generating registration code for device: {deviceId}");

        // Create a registration code based on device ID and current timestamp
        // This is a simple implementation - in production, you'd use a more robust method
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Create a registration code - this combines the device ID with timestamp
        // In a production implementation, you would:
        // 1. Store this in a database with an expiration
        // 2. Use a more secure method for generating unique codes
        // 3. Consider rate limiting and expiration
        var rawCode = $"{deviceId}-{timestamp}";

        // Create a 6-digit code based on the hash of the raw code
        // This makes it easier for users to enter
        var hashCode = Math.Abs(rawCode.GetHashCode()) % 1000000;
        var regCode = hashCode.ToString("D6");

        logger.LogInformation($"Generated registration code: {regCode} for device: {deviceId}");

        // Create a formatted registration code that includes the deviceId
        // This makes it easier for frontend to parse
        var formattedRegCode = $"{deviceId}:{regCode}";

        // In production, you'd store this mapping in a database with TTL
        // For simplicity, we're returning the registration code directly
        return Results.Ok(new
        {
            registrationCode = formattedRegCode, // Include the device ID in the code
            deviceId = deviceId,
            expiresIn = "15 minutes" // This would be enforced server-side in production
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, $"Error generating registration code for device: {deviceId}");
        return Results.Problem($"Error generating registration code: {ex.Message}");
    }
});

// Registration code validation and device assignment endpoint
// Endpoint to get pending device registration
app.MapGet("/api/pending-registration", (
    string gatewayId,
    ILogger<Program> logger) =>
{
    try
    {
        logger.LogInformation($"Retrieving pending registration for gateway: {gatewayId}");

        // Generate a unique ID for this device
        // In a real implementation, this would likely be based on a database lookup
        // or a more sophisticated system for matching gateways to registrable devices
        var deviceId = $"device-{Guid.NewGuid().ToString().Substring(0, 8)}";

        // Generate a registration code
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var rawCode = $"{deviceId}-{timestamp}";
        var hashCode = Math.Abs(rawCode.GetHashCode()) % 1000000;
        var regCode = hashCode.ToString("D6");

        // Create the response model
        var pendingRegistration = new PendingDeviceRegistration
        {
            Id = deviceId,
            Type = "IoT Sensor", // This could be determined based on gateway type or other factors
            RegistrationCode = regCode
        };

        logger.LogInformation($"Created pending registration with ID: {deviceId} and code: {regCode}");

        // In a production environment, you would store this pending registration
        // in a database with an expiration time

        return Results.Ok(pendingRegistration);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, $"Error creating pending device registration for gateway {gatewayId}");
        return Results.Problem($"Error creating pending registration: {ex.Message}");
    }
});

app.MapPost("/api/register-gateway", async (
    HttpContext httpContext,
    ILogger<Program> logger,
    FirestoreDb firestoreDb,
    RegisterGatewayRequest request) =>
{
    try
    {
        logger.LogInformation($"Processing gateway registration request for gateway ID: {request.GatewayId}");
        logger.LogInformation($"Request gateway name: {request.GatewayName}");
        logger.LogInformation($"Request location: {request.Location}");
        logger.LogInformation($"Registration code: {request.RegistrationCode}");

        // In a production environment, you'd extract the user ID from the Firebase Auth token
        // For development/testing, we'll get it from a custom header
        string userId = httpContext.Request.Headers["X-User-ID"].ToString();
        logger.LogInformation($"X-User-ID header value: {userId}");

        if (string.IsNullOrEmpty(userId))
        {
            logger.LogWarning("Gateway registration attempted without user ID");
            return Results.BadRequest("User ID is required");
        }

        // Validate the user exists
        var userDoc = await firestoreDb.Collection("users").Document(userId).GetSnapshotAsync();
        if (!userDoc.Exists)
        {
            logger.LogWarning($"User not found, creating test user for: {userId}");

            // For development/testing only - create a test user if it doesn't exist
            // Always create test user for now
            if (true) // Temporarily force this for testing
            {
                logger.LogInformation($"Creating test user: {userId}");

                // Create a basic user document
                var userData = new Dictionary<string, object>
                {
                    { "display_name", "Test User" },
                    { "email", "test@example.com" },
                    { "created_at", DateTime.UtcNow },
                    { "last_login", DateTime.UtcNow }
                };

                await firestoreDb.Collection("users").Document(userId).SetAsync(userData);
                logger.LogInformation($"Test user created: {userId}");

                // Refresh the user document
                userDoc = await firestoreDb.Collection("users").Document(userId).GetSnapshotAsync();
            }
            else
            {
                return Results.BadRequest("User not found");
            }
        }

        // Get gateway ID from request
        string gatewayId = request.GatewayId;

        if (string.IsNullOrEmpty(gatewayId))
        {
            logger.LogWarning("Gateway ID is required");
            return Results.BadRequest("Gateway ID is required");
        }

        logger.LogInformation($"Using gateway ID: {gatewayId} with registration code: {request.RegistrationCode}");

        // Check if gateway already exists for this user
        var existingGateway = await firestoreDb.Collection("users").Document(userId)
            .Collection("gateways").Document(gatewayId).GetSnapshotAsync();

        if (existingGateway.Exists)
        {
            logger.LogInformation($"Gateway {gatewayId} already registered to user {userId}");
            return Results.BadRequest("Gateway already registered to this user");
        }

        // In a real implementation, you would validate the registration code against a database
        // For this simple implementation, we'll assume the code is valid

        // Create a new gateway document for the user
        var gateway = new Device
        {
            Id = gatewayId,
            Name = request.GatewayName ?? $"Gateway {gatewayId}",
            Type = request.Type ?? "raspberry-pi", // Default type for gateways
            Location = request.Location ?? "Unknown",
            UserId = userId,
            IsRegistered = true
        };

        // Add the gateway to the user's gateways collection
        try
        {
            logger.LogInformation($"Attempting to write gateway {gatewayId} to Firestore for user {userId}");
            logger.LogInformation($"Firestore path: users/{userId}/gateways/{gatewayId}");
            logger.LogInformation($"Gateway data: Name={gateway.Name}, Type={gateway.Type}, Location={gateway.Location}");

            var documentReference = firestoreDb.Collection("users").Document(userId)
                .Collection("gateways").Document(gatewayId);

            await documentReference.SetAsync(gateway);

            // Verify the write by reading it back
            var snapshot = await documentReference.GetSnapshotAsync();
            if (snapshot.Exists)
            {
                logger.LogInformation($"Gateway document successfully created and verified in Firestore");
                var gatewayData = snapshot.ConvertTo<Device>();
                logger.LogInformation($"Verified gateway data: Name={gatewayData.Name}, Type={gatewayData.Type}, ID={gatewayData.Id}");
            }
            else
            {
                logger.LogWarning($"Gateway document was not found after write operation!");
            }

            logger.LogInformation($"Gateway {gatewayId} successfully registered to user {userId}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error writing gateway to Firestore: {ex.Message}");
            throw;
        }

        return Results.Ok(new
        {
            success = true,
            message = "Gateway successfully registered",
            gateway = gateway
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error registering gateway");

        // Add more specific error handling
        if (ex.Message.Contains("PermissionDenied") || ex.Message.Contains("Missing or insufficient permissions"))
        {
            logger.LogError("Firebase permission error. Check service account permissions.");
            return Results.BadRequest("Authentication error: Unable to register gateway due to permission issues.");
        }

        // Return a more user-friendly error message
        return Results.BadRequest($"Error registering gateway: {ex.Message}");
    }
});

app.MapPost("/api/register-device", async (
    HttpContext httpContext,
    ILogger<Program> logger,
    FirestoreDb firestoreDb,
    RegisterDeviceRequest request) =>
{
    try
    {
        logger.LogInformation($"Processing device registration request for device ID: {request.DeviceId}");
        logger.LogInformation($"Request device name: {request.DeviceName}");
        logger.LogInformation($"Request location: {request.Location}");

        // In a production environment, you'd extract the user ID from the Firebase Auth token
        // For development/testing, we'll get it from a custom header
        string userId = httpContext.Request.Headers["X-User-ID"].ToString();
        logger.LogInformation($"X-User-ID header value: {userId}");

        if (string.IsNullOrEmpty(userId))
        {
            logger.LogWarning("Device registration attempted without user ID");
            return Results.BadRequest("User ID is required");
        }

        // Log all users in the database for debugging
        logger.LogInformation("Listing all users in database:");
        var allUsers = await firestoreDb.Collection("users").GetSnapshotAsync();
        foreach (var user in allUsers.Documents)
        {
            logger.LogInformation($"User ID: {user.Id}");
        }

        // Validate the user exists
        var userDoc = await firestoreDb.Collection("users").Document(userId).GetSnapshotAsync();
        if (!userDoc.Exists)
        {
            logger.LogWarning($"User not found, creating test user for: {userId}");

            // For development/testing only - create a test user if it doesn't exist
            // Always create test user for now
            if (true) // Temporarily force this for testing
            {
                logger.LogInformation($"Creating test user: {userId}");

                // Create a basic user document
                var userData = new Dictionary<string, object>
                {
                    { "display_name", "Test User" },
                    { "email", "test@example.com" },
                    { "created_at", DateTime.UtcNow },
                    { "last_login", DateTime.UtcNow }
                };

                await firestoreDb.Collection("users").Document(userId).SetAsync(userData);
                logger.LogInformation($"Test user created: {userId}");

                // Refresh the user document
                userDoc = await firestoreDb.Collection("users").Document(userId).GetSnapshotAsync();
            }
            else
            {
                return Results.BadRequest("User not found");
            }
        }

        // In a production system, you would validate the registration code against a database
        // For this implementation, we'll parse the deviceId from the registration code

        // Validate the registration code
        // In a real implementation, you would query a database of valid registration codes
        // For simplicity, we'll verify the code matches our generation pattern

        // In a production system, you would validate the registration code against a database
        // and retrieve the associated deviceId. 

        // For now, we'll use the deviceId provided in the request
        string deviceId = request.DeviceId;

        if (string.IsNullOrEmpty(deviceId))
        {
            logger.LogWarning("Device ID is required");
            return Results.BadRequest("Device ID is required");
        }

        logger.LogInformation($"Using device ID: {deviceId} with registration code: {request.RegistrationCode}");

        // Make sure we have a gatewayId from the request
        if (string.IsNullOrEmpty(request.GatewayId))
        {
            logger.LogWarning("Gateway ID is required for device registration");
            return Results.BadRequest("Gateway ID is required");
        }

        // Check if device already exists for this user in the gateway
        var existingDevice = await firestoreDb.Collection("users").Document(userId)
            .Collection("gateways").Document(request.GatewayId)
            .Collection("devices").Document(deviceId).GetSnapshotAsync();

        if (existingDevice.Exists)
        {
            logger.LogInformation($"Device {deviceId} already registered to gateway {request.GatewayId} for user {userId}");
            return Results.BadRequest("Device already registered to this gateway");
        }

        // Create a new device document for the user
        var device = new Device
        {
            Id = deviceId,
            Name = request.DeviceName ?? $"Device {deviceId}",
            Type = "IoT Sensor", // Default type, could be passed in request
            Location = request.Location ?? "Unknown",
            UserId = userId,
            GatewayId = request.GatewayId, // Store the gatewayId on the device
            IsRegistered = true
        };

        // Add the device to the gateway's devices collection
        try
        {
            logger.LogInformation($"Attempting to write device {deviceId} to Firestore for user {userId} and gateway {request.GatewayId}");
            logger.LogInformation($"Firestore path: users/{userId}/gateways/{request.GatewayId}/devices/{deviceId}");
            logger.LogInformation($"Device data: Name={device.Name}, Type={device.Type}, Location={device.Location}");

            var documentReference = firestoreDb.Collection("users").Document(userId)
                .Collection("gateways").Document(request.GatewayId)
                .Collection("devices").Document(deviceId);

            await documentReference.SetAsync(device);

            // Verify the write by reading it back
            var snapshot = await documentReference.GetSnapshotAsync();
            if (snapshot.Exists)
            {
                logger.LogInformation($"Device document successfully created and verified in Firestore");
                var deviceData = snapshot.ConvertTo<Device>();
                logger.LogInformation($"Verified device data: Name={deviceData.Name}, Type={deviceData.Type}, ID={deviceData.Id}");
            }
            else
            {
                logger.LogWarning($"Device document was not found after write operation!");
            }

            logger.LogInformation($"Device {deviceId} successfully registered to user {userId}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, $"Error writing device to Firestore: {ex.Message}");
            throw;
        }

        return Results.Ok(new
        {
            success = true,
            message = "Device successfully registered",
            device = device
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error registering device");

        // Add more specific error handling
        if (ex.Message.Contains("PermissionDenied") || ex.Message.Contains("Missing or insufficient permissions"))
        {
            logger.LogError("Firebase permission error. Check service account permissions.");
            return Results.BadRequest("Authentication error: Unable to register device due to permission issues.");
        }

        // Return a more user-friendly error message
        return Results.BadRequest($"Error registering device: {ex.Message}");
    }
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
