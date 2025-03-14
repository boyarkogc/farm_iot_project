FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["aspnetcorehub.csproj", "./"]
RUN dotnet restore "aspnetcorehub.csproj"
COPY . .
RUN dotnet build "aspnetcorehub.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "aspnetcorehub.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "aspnetcorehub.dll"]