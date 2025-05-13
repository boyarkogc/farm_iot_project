using System.Text.Json.Serialization;

namespace dotnet_server.Models
{
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
}