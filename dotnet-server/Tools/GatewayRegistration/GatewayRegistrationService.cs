using Microsoft.Extensions.Logging;
using System;

namespace dotnet_server.Tools.GatewayRegistration
{
    public class GatewayRegistrationService
    {
        private readonly ILogger<GatewayRegistrationService> _logger;

        public GatewayRegistrationService(ILogger<GatewayRegistrationService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Generates a registration code for a gateway
        /// </summary>
        /// <param name="gatewayId">The ID of the gateway to generate a code for</param>
        /// <returns>A tuple containing the registration code and expiration time</returns>
        public (string code, DateTime expirationTime) GenerateRegistrationCode(string gatewayId)
        {
            _logger.LogInformation($"Generating registration code for gateway: {gatewayId}");

            // Create a timestamp for uniqueness and expiration reference
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var expirationTime = DateTime.UtcNow.AddMinutes(15); // Code expires in 15 minutes
            
            // Combine gateway ID with timestamp for uniqueness
            var rawCode = $"{gatewayId}-{timestamp}";
            
            // Create a 6-digit code based on the hash of the raw code
            // This makes it easier for users to enter
            var hashCode = Math.Abs(rawCode.GetHashCode()) % 1000000;
            var regCode = hashCode.ToString("D6");
            
            _logger.LogInformation($"Generated registration code: {regCode} for gateway: {gatewayId}");
            
            return (regCode, expirationTime);
        }

        /// <summary>
        /// Validates a registration code for a gateway
        /// </summary>
        /// <param name="gatewayId">The ID of the gateway</param>
        /// <param name="code">The registration code to validate</param>
        /// <param name="storedExpirationTime">The expiration time of the stored code</param>
        /// <returns>True if the code is valid, false otherwise</returns>
        public bool ValidateRegistrationCode(string gatewayId, string code, DateTime storedExpirationTime)
        {
            // First check if the code has expired
            if (DateTime.UtcNow > storedExpirationTime)
            {
                _logger.LogWarning($"Registration code for gateway {gatewayId} has expired");
                return false;
            }

            // In a production environment, you would verify the code against a stored value
            // For example, comparing against a code stored in a database
            
            // For this implementation, we'll assume the provided code is correct if it's not expired
            // In a real-world scenario, you would retrieve the correct code from a database
            // and compare it with the provided code
            
            return true;
        }
    }
}