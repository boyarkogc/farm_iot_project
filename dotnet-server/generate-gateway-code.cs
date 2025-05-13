using System;

namespace GatewayRegistration
{
    class Program
    {
        static void Main(string[] args)
        {
            // Check if a gateway ID was provided
            if (args.Length < 1)
            {
                Console.WriteLine("Usage: dotnet run generate-gateway-code.cs <gatewayId>");
                Console.WriteLine("Example: dotnet run generate-gateway-code.cs gateway-123");
                return;
            }

            string gatewayId = args[0];
            Console.WriteLine($"Generating registration code for gateway: {gatewayId}");

            // Create a registration code based on gateway ID and current timestamp
            string regCode = GenerateRegistrationCode(gatewayId);

            Console.WriteLine($"Gateway ID: {gatewayId}");
            Console.WriteLine($"Registration Code: {regCode}");
            Console.WriteLine($"Full Registration String: {gatewayId}:{regCode}");
            Console.WriteLine("This code will expire in 15 minutes.");
        }

        static string GenerateRegistrationCode(string gatewayId)
        {
            // Create a timestamp for uniqueness and expiration reference
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Combine gateway ID with timestamp for uniqueness
            var rawCode = $"{gatewayId}-{timestamp}";
            
            // Create a 6-digit code based on the hash of the raw code
            // This makes it easier for users to enter
            var hashCode = Math.Abs(rawCode.GetHashCode()) % 1000000;
            return hashCode.ToString("D6");
        }
    }
}