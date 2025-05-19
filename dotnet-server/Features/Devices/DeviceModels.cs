using System.Text.Json.Serialization;
using Google.Cloud.Firestore;

namespace DotnetServer.Features.Devices;

[FirestoreData]
public class Device
{
  // Document ID is handled separately, not a field in the document
  [JsonPropertyName("id")]
  public string Id { get; set; } = string.Empty;

  [FirestoreProperty("name")]
  public string Name { get; set; } = string.Empty;

  [FirestoreProperty("type")]
  public string Type { get; set; } = string.Empty;

  [FirestoreProperty("location")]
  public string Location { get; set; } = string.Empty;

  // GatewayId is essential to match the React frontend model
  [FirestoreProperty("gatewayId")]
  [JsonPropertyName("gatewayId")]
  public string GatewayId { get; set; } = string.Empty;

  // These fields aren't in the React model but might be useful for the API
  [FirestoreProperty("userId")]
  [JsonPropertyName("userId")]
  public string UserId { get; set; } = string.Empty;

  [FirestoreProperty("isRegistered")]
  [JsonPropertyName("isRegistered")]
  public bool IsRegistered { get; set; } = true;
}

public class PendingDeviceRegistration
{
  [JsonPropertyName("id")]
  public string Id { get; set; } = string.Empty;

  [JsonPropertyName("type")]
  public string Type { get; set; } = string.Empty;

  [JsonPropertyName("registrationCode")]
  public string RegistrationCode { get; set; } = string.Empty;
}

public class RegisterDeviceRequest
{
  [JsonPropertyName("registrationCode")]
  public string RegistrationCode { get; set; } = string.Empty;

  [JsonPropertyName("deviceId")]
  public string DeviceId { get; set; } = string.Empty;

  [JsonPropertyName("deviceName")]
  public string? DeviceName { get; set; }

  [JsonPropertyName("location")]
  public string? Location { get; set; }

  [JsonPropertyName("gatewayId")]
  public string GatewayId { get; set; } = string.Empty;
}

public class RegisterGatewayRequest
{
  [JsonPropertyName("registrationCode")]
  public string RegistrationCode { get; set; } = string.Empty;

  [JsonPropertyName("gatewayId")]
  public string GatewayId { get; set; } = string.Empty;

  [JsonPropertyName("gatewayName")]
  public string? GatewayName { get; set; }

  [JsonPropertyName("location")]
  public string? Location { get; set; }

  [JsonPropertyName("type")]
  public string? Type { get; set; }
}