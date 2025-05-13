using System.Text.Json.Serialization;

namespace dotnet_server.Models
{
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
}