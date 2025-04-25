using Google.Cloud.SecretManager.V1;
using Microsoft.Extensions.Configuration;
using System.Text;
using Google.Api.Gax.ResourceNames;

namespace DotnetServer.Configuration
{
  public static class GoogleSecretManagerExtensions
  {
    public static IConfigurationBuilder AddGoogleCloudSecretManager(
        this IConfigurationBuilder configuration,
        string projectId)
    {
      return configuration.Add(new GoogleSecretManagerConfigurationSource(projectId));
    }
  }

  public class GoogleSecretManagerConfigurationSource : IConfigurationSource
  {
    private readonly string _projectId;

    public GoogleSecretManagerConfigurationSource(string projectId)
    {
      _projectId = projectId;
    }

    public IConfigurationProvider Build(IConfigurationBuilder builder)
    {
      return new GoogleSecretManagerConfigurationProvider(_projectId);
    }
  }

  public class GoogleSecretManagerConfigurationProvider : ConfigurationProvider
  {
    private readonly string _projectId;

    public GoogleSecretManagerConfigurationProvider(string projectId)
    {
      _projectId = projectId;
    }

    public override void Load()
    {
      var client = SecretManagerServiceClient.Create();

      // List all secrets in your project
      var secrets = client.ListSecrets(new ProjectName(_projectId));

      foreach (var secret in secrets)
      {
        var secretName = secret.SecretName;
        var secretVersion = client.GetSecretVersion(new SecretVersionName(secretName.ProjectId, secretName.SecretId, "latest"));
        var payload = client.AccessSecretVersion(secretVersion.Name).Payload.Data.ToStringUtf8();

        // Add to configuration with the secret ID as the key
        Data[secretName.SecretId] = payload;
      }
    }
  }
}