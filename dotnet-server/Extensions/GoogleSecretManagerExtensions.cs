using Google.Cloud.SecretManager.V1;
using Google.Api.Gax.ResourceNames;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;

namespace DotnetServer.Extensions;

public static class SecretManagerConfigurationExtensions
{
  public static IConfigurationBuilder AddGoogleSecretManager(
      this IConfigurationBuilder configuration, string projectId)
  {
    return configuration.Add(new SecretManagerConfigurationSource(projectId));
  }
}

public class SecretManagerConfigurationSource : IConfigurationSource
{
  private readonly string _projectId;

  public SecretManagerConfigurationSource(string projectId)
  {
    _projectId = projectId;
  }

  public IConfigurationProvider Build(IConfigurationBuilder builder)
  {
    return new SecretManagerConfigurationProvider(_projectId);
  }
}

public class SecretManagerConfigurationProvider : ConfigurationProvider
{
  private readonly string _projectId;

  public SecretManagerConfigurationProvider(string projectId)
  {
    _projectId = projectId;
  }

  public override void Load()
  {
    var client = SecretManagerServiceClient.Create();
    Dictionary<string, string> data = new Dictionary<string, string>();

    // List all secrets
    var secrets = client.ListSecrets(new ProjectName(_projectId));

    foreach (var secret in secrets)
    {
      try
      {
        // Get latest version
        SecretVersion secretVersion = client.GetSecretVersion(
            new SecretVersionName(secret.SecretName.ProjectId,
            secret.SecretName.SecretId, "latest"));

        // Only get enabled secrets
        if (secretVersion.State == SecretVersion.Types.State.Enabled)
        {
          // Access the secret payload
          AccessSecretVersionResponse response = client.AccessSecretVersion(secretVersion.Name);
          string key = secret.SecretName.SecretId.Replace("_", ":");
          data[key] = response.Payload.Data.ToStringUtf8();
        }
      }
      catch (Exception)
      {
        // Skip secrets that can't be accessed
        continue;
      }
    }

    Data = data;
  }
}