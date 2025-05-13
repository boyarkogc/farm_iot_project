# Gateway Registration Tools

This directory contains tools for generating registration codes for gateways in the Farm IoT Project.

## Available Tools

### 1. Shell Script (Quick Use)

The shell script provides a quick way to generate a registration code for a gateway.

```bash
./generate-gateway-code.sh <gatewayId>
```

Example:
```bash
./generate-gateway-code.sh gateway-123
```

### 2. .NET Tool (More Features)

The .NET tool provides more features, including proper logging and integration with the rest of the .NET project.

```bash
# Using the solution file
dotnet run --project Tools/GatewayRegistration/GatewayRegistration.csproj <gatewayId>

# Or navigate to the tool directory
cd Tools/GatewayRegistration && dotnet run <gatewayId>
```

Example:
```bash
dotnet run --project Tools/GatewayRegistration/GatewayRegistration.csproj gateway-123
```

### 3. Service Integration

The `GatewayRegistrationService.cs` file in the `Services` directory provides functionality that can be integrated with the main application.

To use this service in the main application, register it in the dependency injection container in `Program.cs`:

```csharp
builder.Services.AddSingleton<GatewayRegistrationService>();
```

Then you can inject it into controllers or other services:

```csharp
public class GatewayController
{
    private readonly GatewayRegistrationService _registrationService;
    
    public GatewayController(GatewayRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }
    
    // Use the service here
}
```

## Implementation Details

The registration code generation process:

1. Takes a gateway ID as input
2. Combines the gateway ID with the current timestamp to ensure uniqueness
3. Hashes this combination to create a 6-digit numeric code
4. Returns the code along with an expiration time (15 minutes from generation)

In a production environment, you would:

1. Store this code in a database with the expiration time
2. Provide endpoints to validate the code during device registration
3. Clean up expired codes
4. Implement rate limiting to prevent abuse

## Security Considerations

This implementation is for demonstration purposes. In a production environment:

1. Use a more secure method for generating unique codes
2. Store codes securely in a database with proper expiration handling
3. Implement rate limiting for code generation
4. Consider adding additional verification steps

## Solution and Project Structure

A solution file (`farm-iot.sln`) has been created to manage the multiple projects in this repository:

- `dotnet-server.csproj` - The main server application
- `GatewayRegistrationTool.csproj` - The gateway registration tool

This makes it easier to work with multiple projects in the same repository and avoids conflicts when running commands.