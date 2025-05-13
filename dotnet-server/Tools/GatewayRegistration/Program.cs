using System;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace dotnet_server.Tools.GatewayRegistration
{
    class Program
    {
        static void Main(string[] args)
        {
            // Check if a gateway ID was provided
            if (args.Length < 1)
            {
                Console.WriteLine("Usage: dotnet run <gatewayId>");
                Console.WriteLine("Example: dotnet run gateway-123");
                return;
            }

            string gatewayId = args[0];
            
            // Setup dependency injection
            var serviceProvider = new ServiceCollection()
                .AddLogging(builder => builder.AddConsole())
                .AddSingleton<GatewayRegistrationService>()
                .BuildServiceProvider();

            // Get logger and service
            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
            var registrationService = serviceProvider.GetRequiredService<GatewayRegistrationService>();
            
            logger.LogInformation($"Generating registration code for gateway: {gatewayId}");
            
            // Generate the registration code
            var (regCode, expirationTime) = registrationService.GenerateRegistrationCode(gatewayId);
            
            // Format the expiration time
            var expirationFormatted = expirationTime.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss");

            // Display the results
            Console.WriteLine();
            Console.WriteLine($"Gateway ID: {gatewayId}");
            Console.WriteLine($"Registration Code: {regCode}");
            Console.WriteLine($"Full Registration String: {gatewayId}:{regCode}");
            Console.WriteLine($"Expiration Time: {expirationFormatted}");
            Console.WriteLine();
            Console.WriteLine("In a production environment, this code would be stored in a database with an expiration time.");
            Console.WriteLine("Users would then enter this code when registering a device through the frontend interface.");
        }
    }
}