using System.Text.Json.Serialization;

namespace dotnet_server.Models
{
    public class PendingDeviceRegistration
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("registrationCode")]
        public string RegistrationCode { get; set; } = string.Empty;
    }
}