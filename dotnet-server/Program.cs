using Google.Cloud.SecretManager.V1;
using Microsoft.Extensions.Configuration;
using InfluxDB.Client;
using InfluxDB.Client.Api.Domain;
using InfluxDB.Client.Core.Flux.Domain;
//My custom namespaces
using SecretManagement;
using InfluxDBModels;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Information);

builder.Configuration.AddGoogleCloudSecretManager("farm-iot-project");

builder.Services.AddSingleton<InfluxDBClient>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    var influxDbUrl = builder.Configuration["InfluxDB:Url"];
    logger.LogInformation(influxDbUrl + " AAAAAA");
    if (influxDbUrl != null)
    {
        // Save the result of Replace back to the variable
        influxDbUrl = influxDbUrl.Replace(
            "${INFLUXDB_HOST}",
            Environment.GetEnvironmentVariable("INFLUXDB_HOST") ?? "localhost"
        );
    }
    else
    {
        influxDbUrl = $"http://{Environment.GetEnvironmentVariable("INFLUXDB_HOST") ?? "localhost"}:8086";
    }
    //var influxDbToken = builder.Configuration["InfluxDB:Token"];
    var influxDbToken = builder.Configuration["influxdb-api-token"];

    logger.LogInformation(influxDbUrl);
    logger.LogError("THIS IS A TEST ERROR LOG - SHOULD BE VISIBLE");
    return new InfluxDBClient(influxDbUrl, influxDbToken);
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

string MyAllowSpecificOrigins = "_allowReactFrontend";
// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173") // The origin of your React app in the browser
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                          // IMPORTANT: For production, be more specific with origins, headers, and methods.
                          // You might get the allowed origins from configuration:
                          // policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>())
                      });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);
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

app.MapGet("/test-secret", (IConfiguration configuration) =>
{
    var mySecret = configuration["influxdb-api-token"];
    return $"Secret value: {mySecret}";
});

// Define an endpoint to query InfluxDB
app.MapGet("/data", async (InfluxDBClient influxDbClient) =>
{
    try
    {
        var query = $@"from(bucket: ""my-bucket"")
          |> range(start: -1h)
          |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
          |> yield()";

        var tables = await influxDbClient.GetQueryApi().QueryAsync(query, "my-org");

        // Check if tables is empty
        if (tables == null || !tables.Any())
        {
            return Results.Ok(new { Message = "No data returned from query" });
        }

        var results = new List<dynamic>();
        foreach (var table in tables)
        {
            foreach (var record in table.Records)
            {
                results.Add(new
                {
                    Time = record.GetTime(),
                    Measurement = record.GetMeasurement(),
                    Field = record.GetField(),
                    Value = record.GetValue()
                });
            }
        }

        return Results.Ok(results);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error querying InfluxDB: {ex.Message}");
    }
});

app.MapGet("devices/{deviceId}/readings", async (IServiceProvider sp,
                InfluxDBClient influxDbClient,
                string deviceId,
                int hours = 24) =>
{
    var timeRange = TimeSpan.FromHours(hours);
    var query = $@"
        from(bucket: ""my-bucket"")
        |> range(start: -{timeRange.TotalSeconds}s)
        |> filter(fn: (r) => r[""_measurement""] == ""sensor_readings"")
        |> filter(fn: (r) => r[""device_id""] == ""{deviceId}"")";

    var tables = await influxDbClient.GetQueryApi().QueryAsync(query, "my-org");
    var logger = sp.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("record count" + tables.Count.ToString());
    logger.LogInformation(query);
    // Process results into our flexible model
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
});

app.MapGet("devices/{deviceId}/fields", async (IServiceProvider sp,
                InfluxDBClient influxDbClient,
                string deviceId) =>
{
    var query = $@"import ""influxdata/influxdb/schema""
                schema.fieldKeys(
                bucket: ""my-bucket"",
                predicate: (r) => r[""_measurement""] == ""sensor_readings"" and r[""device_id""] == ""{deviceId}""
                )";

    var results = await influxDbClient.GetQueryApi().QueryAsync(query, "my-org");

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
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
