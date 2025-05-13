import React, { useState, useEffect } from "react";
import { useDevices } from "./contexts/device-context";
import { useDashboardContext } from "./contexts/dashboard-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  WifiIcon,
  HardDriveIcon,
  MapPinIcon,
  PlusIcon,
  RefreshCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Interface for pending device registrations
interface PendingDeviceRegistration {
  id: string;
  type: string;
  registrationCode: string;
}

export default function GatewayInfo() {
  const { activeGateway } = useDashboardContext();
  const { devices, updateGatewayName, registerDevice } = useDevices();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(activeGateway?.name || "");
  const [pendingDevices, setPendingDevices] = useState<
    PendingDeviceRegistration[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE_URL = "http://localhost:8080";

  // Function to fetch pending registrations from the API
  const fetchPendingRegistrations = async () => {
    if (!activeGateway) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pending-registration?gatewayId=${activeGateway.id}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pending registrations: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // If the API returns a single object, convert it to an array with one item
      if (!Array.isArray(data)) {
        setPendingDevices([data]);
      } else {
        setPendingDevices(data);
      }
    } catch (err) {
      console.error("Error fetching pending registrations:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending registrations when the active gateway changes
  useEffect(() => {
    if (activeGateway) {
      fetchPendingRegistrations();
    }
  }, [activeGateway]);

  // Find devices that belong to this gateway
  const gatewayDevices = devices.filter(
    (device) => device.gatewayId === activeGateway?.id,
  );

  const handleClaimDevice = async (deviceId: string) => {
    if (!activeGateway) return;

    // Find the pending device to get its registration code
    const pendingDevice = pendingDevices.find(
      (device) => device.id === deviceId,
    );
    if (!pendingDevice) {
      console.error("Pending device not found:", deviceId);
      return;
    }

    console.log(
      `Claiming device: ${deviceId} with code: ${pendingDevice.registrationCode}`,
    );

    try {
      // Use the existing registerDevice function from the device context
      const deviceName = `${pendingDevice.type} ${pendingDevice.id.substring(0, 8)}`;
      const deviceResult = await registerDevice(
        pendingDevice.registrationCode,
        deviceName,
        activeGateway.location,
        activeGateway.id,
      );

      if (deviceResult) {
        console.log("Device registered successfully:", deviceResult);

        // Remove this device from the pending list
        setPendingDevices((prevDevices) =>
          prevDevices.filter((device) => device.id !== deviceId),
        );
      }
    } catch (err) {
      console.error("Error claiming device:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    }
  };

  const handleUpdateName = async () => {
    if (activeGateway && newName.trim() !== "") {
      await updateGatewayName(activeGateway.id, newName);
      setIsEditingName(false);
    }
  };

  if (!activeGateway) {
    return <div>No gateway selected</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          {isEditingName ? (
            <div className="flex space-x-2 items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="max-w-xs"
                autoFocus
              />
              <Button variant="outline" size="sm" onClick={handleUpdateName}>
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(activeGateway.name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              {activeGateway.name || "Unnamed Gateway"}
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => {
                  setNewName(activeGateway.name);
                  setIsEditingName(true);
                }}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </h1>
          )}
          <p className="text-gray-500 dark:text-gray-400">
            ID: {activeGateway.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <HardDriveIcon className="mr-2 h-4 w-4" />
              Gateway Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGateway.type || "Raspberry Pi"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <WifiIcon className="mr-2 h-4 w-4" />
              Connected Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gatewayDevices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MapPinIcon className="mr-2 h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeGateway.location || "Unknown"}
            </div>
          </CardContent>
        </Card>
      </div>

      {gatewayDevices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {gatewayDevices.map((device) => (
                <li
                  key={device.id}
                  className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">
                      {device.name || "Unnamed Device"}
                    </div>
                    <div className="text-sm text-gray-500">ID: {device.id}</div>
                    <div className="text-sm text-gray-500">
                      Type: {device.type}
                    </div>
                    {device.location && (
                      <div className="text-sm text-gray-500">
                        Location: {device.location}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              No devices connected to this gateway yet.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Device Registrations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingRegistrations}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="py-4 text-red-500">
              Error loading pending registrations: {error}
            </div>
          ) : pendingDevices.length > 0 ? (
            <ul className="space-y-4">
              {pendingDevices.map((device) => (
                <li
                  key={device.id}
                  className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{device.type}</div>
                    <div className="text-sm text-gray-500">ID: {device.id}</div>
                    <div className="text-sm text-gray-500">
                      Registration Code: {device.registrationCode}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClaimDevice(device.id)}
                    className="flex items-center"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Claim Device
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 py-4">
              No pending device registrations. Click refresh to check for new
              registrations.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
