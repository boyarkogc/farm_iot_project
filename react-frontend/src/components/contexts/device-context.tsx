import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "./auth-provider";

// Gateway interface for Raspberry Pi gateways
export interface Gateway {
  id: string;
  name: string;
  type: string; // e.g., "raspberry-pi"
  location: string;
}

// Device interface for Arduino devices
export interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  gatewayId: string; // ID of the gateway this device is connected to
}

type DeviceContextType = {
  gateways: Gateway[];
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  refreshGateways: () => Promise<void>;
  updateDeviceName: (deviceId: string, newName: string) => Promise<void>;
  updateGatewayName: (gatewayId: string, newName: string) => Promise<void>;
  registerDevice: (
    deviceId: string,
    deviceName?: string,
    location?: string,
    gatewayId?: string,
  ) => Promise<Device | null>;
  registerGateway: (
    registrationCode: string,
    gatewayName?: string,
    location?: string,
  ) => Promise<Gateway | null>;
};

const initialValue: DeviceContextType = {
  gateways: [],
  devices: [],
  isLoading: false,
  error: null,
  refreshDevices: async () => {},
  refreshGateways: async () => {},
  updateDeviceName: async () => {},
  updateGatewayName: async () => {},
  registerDevice: async () => null,
  registerGateway: async () => null,
};

const DeviceContext = createContext<DeviceContextType>(initialValue);

export function useDevices() {
  return useContext(DeviceContext);
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to fetch user's gateways from Firestore
  const fetchUserGateways = async () => {
    if (!user) {
      setGateways([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const gatewaysRef = collection(db, `users/${user.uid}/gateways`);
      const querySnapshot = await getDocs(gatewaysRef);

      const fetchedGateways: Gateway[] = [];
      querySnapshot.forEach((doc) => {
        const gatewayData = doc.data() as Omit<Gateway, "id">;
        fetchedGateways.push({
          id: doc.id,
          ...gatewayData,
        });
      });

      setGateways(fetchedGateways);
    } catch (err) {
      console.error("Error fetching gateways:", err);
      setError("Failed to load gateways. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch user's devices from Firestore
  const fetchUserDevices = async () => {
    if (!user) {
      setDevices([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all devices from all gateways
      const allDevices: Device[] = [];

      // Get the current user ID for consistency
      const userId = user.uid;

      // First, get all gateways directly from Firestore instead of relying on state
      const gatewaysRef = collection(db, `users/${userId}/gateways`);
      const gatewaysSnapshot = await getDocs(gatewaysRef);

      console.log(`Direct query found ${gatewaysSnapshot.size} gateways`);

      // Process each gateway and its devices
      for (const gatewayDoc of gatewaysSnapshot.docs) {
        const gatewayId = gatewayDoc.id;
        const gatewayData = gatewayDoc.data() as Omit<Gateway, "id">;
        console.log(
          `Fetching devices for gateway ${gatewayId} (${gatewayData.name || "unnamed"})`,
        );

        // Also update the gateways state with this data
        const gateway: Gateway = {
          id: gatewayId,
          ...gatewayData,
        };

        // Get devices for this gateway
        const devicesRef = collection(
          db,
          `users/${userId}/gateways/${gatewayId}/devices`,
        );
        const devicesSnapshot = await getDocs(devicesRef);
        console.log(
          `Found ${devicesSnapshot.size} devices in gateway ${gateway.name || gatewayId}`,
        );

        devicesSnapshot.forEach((deviceDoc) => {
          const deviceData = deviceDoc.data() as Omit<
            Device,
            "id" | "gatewayId"
          >;
          console.log(
            `Adding device: ${deviceDoc.id} - ${deviceData.name || "(unnamed)"}`,
          );

          allDevices.push({
            id: deviceDoc.id,
            gatewayId: gatewayId,
            ...deviceData,
          });
        });
      }

      // Update states - first gateways, then devices
      const updatedGateways: Gateway[] = gatewaysSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Gateway, "id">),
      }));

      console.log(`Total gateways found: ${updatedGateways.length}`);
      console.log(`Total devices found: ${allDevices.length}`);

      setGateways(updatedGateways);
      setDevices(allDevices);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError("Failed to load devices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch gateways and devices when the user changes
  useEffect(() => {
    if (user) {
      // Our improved fetchUserDevices function now fetches both gateways and devices
      fetchUserDevices();
    } else {
      setGateways([]);
      setDevices([]);
    }
  }, [user]);

  // Function to update gateway name in Firestore
  const updateGatewayName = async (gatewayId: string, newName: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const gatewayRef = doc(db, `users/${user.uid}/gateways`, gatewayId);
      await updateDoc(gatewayRef, { name: newName });

      // Update local state to reflect the change
      setGateways((prevGateways) =>
        prevGateways.map((gateway) =>
          gateway.id === gatewayId ? { ...gateway, name: newName } : gateway,
        ),
      );
    } catch (err) {
      console.error("Error updating gateway name:", err);
      setError("Failed to update gateway name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update device name in Firestore
  const updateDeviceName = async (deviceId: string, newName: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Find the device to get its gateway ID
      const device = devices.find((d) => d.id === deviceId);
      if (!device) {
        throw new Error("Device not found");
      }

      const deviceRef = doc(
        db,
        `users/${user.uid}/gateways/${device.gatewayId}/devices`,
        deviceId,
      );
      await updateDoc(deviceRef, { name: newName });

      // Update local state to reflect the change
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === deviceId ? { ...device, name: newName } : device,
        ),
      );
    } catch (err) {
      console.error("Error updating device name:", err);
      setError("Failed to update device name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Define API base URL for all requests
  const API_BASE_URL = "http://localhost:8080";

  // Function to register a gateway with a registration code
  const registerGateway = async (
    registrationCode: string,
    gatewayName?: string,
    location?: string,
  ): Promise<Gateway | null> => {
    if (!user) {
      throw new Error("User must be logged in to register gateways");
    }

    console.log("Starting gateway registration with code:", registrationCode);
    console.log("User ID from Firebase:", user.uid);

    setIsLoading(true);
    setError(null);

    try {
      // Parse the registration code to get the gateway ID
      let gatewayId = "";
      let regCode = registrationCode;

      // Check if registration code contains a device ID prefix
      if (registrationCode.includes(":")) {
        const parts = registrationCode.split(":");
        gatewayId = parts[0];
        regCode = parts[1];
        console.log(
          `Parsed from code: gatewayId=${gatewayId}, code=${regCode}`,
        );
      } else {
        // For backward compatibility, we'll use a fixed ID for testing
        gatewayId = "gateway-" + Date.now();
        console.log(`Using generated gatewayId=${gatewayId}, code=${regCode}`);
      }

      // For debugging - log what we're about to send
      const requestData = {
        registrationCode: regCode,
        gatewayId,
        gatewayName: gatewayName || "Default Gateway Name",
        location: location || "Default Location",
        type: "raspberry-pi", // Default type for gateway
      };

      console.log("Sending gateway registration data:", requestData);

      // Use the API base URL constant - this endpoint will need to be implemented on the server
      const response = await fetch(`${API_BASE_URL}/api/register-gateway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.uid,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response text:", errorText);

        let errorMessage = `Failed to register gateway: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message || errorData.title) {
            errorMessage = errorData.message || errorData.title;
          }
        } catch (parseError) {
          console.log("Error parsing JSON response:", parseError);
        }

        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log("Success response text:", responseText);

      // Parse the response
      const data = JSON.parse(responseText);

      // Add the new gateway to our local state
      const newGateway = data.gateway as Gateway;
      setGateways((prev) => [...prev, newGateway]);

      return newGateway;
    } catch (err) {
      console.error("Error registering gateway:", err);
      setError("Failed to register gateway. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to register a device with a registration code
  const registerDevice = async (
    registrationCode: string,
    deviceName?: string,
    location?: string,
    gatewayId?: string,
  ): Promise<Device | null> => {
    if (!user) {
      throw new Error("User must be logged in to register devices");
    }

    if (!gatewayId) {
      throw new Error("A gateway must be selected to register a device");
    }

    console.log("Starting device registration with code:", registrationCode);
    console.log("User ID from Firebase:", user.uid);
    console.log("Gateway ID:", gatewayId);

    setIsLoading(true);
    setError(null);

    try {
      // For a real implementation, we should call a validation endpoint
      // Now parse the registration code to get the device ID

      let deviceId = "";
      let regCode = registrationCode;

      console.log("Processing registration code:", registrationCode);

      // Check if registration code contains a device ID prefix
      if (registrationCode.includes(":")) {
        const parts = registrationCode.split(":");
        deviceId = parts[0];
        // Update the registration code to just the code part
        regCode = parts[1];
        console.log(`Parsed from code: deviceId=${deviceId}, code=${regCode}`);
      } else {
        // For backward compatibility, we'll use a fixed ID for testing
        deviceId = "arduino-" + Date.now();
        console.log(`Using generated deviceId=${deviceId}, code=${regCode}`);
      }

      // For debugging - log what we're about to send
      const requestData = {
        registrationCode: regCode, // Use the parsed registration code
        deviceId,
        deviceName: deviceName || "Default Device Name", // Provide defaults for testing
        location: location || "Default Location",
        gatewayId, // Include the gateway ID
        type: "arduino", // Default type for devices
      };

      console.log("Sending request data:", requestData);

      // Use the API base URL constant
      const response = await fetch(`${API_BASE_URL}/api/register-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.uid,
        },
        body: JSON.stringify(requestData),
      });

      console.log(
        "Registration response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        try {
          const errorText = await response.text(); // Get raw text first
          console.log("Error response text:", errorText);

          let errorMessage = `Failed to register device: ${response.statusText}`;

          // Try to parse as JSON if possible
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message || errorData.title) {
              errorMessage = errorData.message || errorData.title;
            }
          } catch (parseError) {
            console.log("Error parsing JSON response:", parseError);
          }

          throw new Error(errorMessage);
        } catch (textError) {
          // If we can't even get the response text
          console.log("Error getting response text:", textError);
          throw new Error(`Failed to register device: ${response.statusText}`);
        }
      }

      // Get the response as text first for debugging
      const responseText = await response.text();
      console.log("Success response text:", responseText);

      // Parse the response
      const data = JSON.parse(responseText);

      // Add the new device to our local state
      const newDevice = data.device as Device;
      setDevices((prev) => [...prev, newDevice]);

      return newDevice;
    } catch (err) {
      console.error("Error registering device:", err);
      setError("Failed to register device. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Value to provide
  const value = {
    gateways,
    devices,
    isLoading,
    error,
    refreshDevices: fetchUserDevices,
    refreshGateways: fetchUserGateways,
    updateDeviceName,
    updateGatewayName,
    registerDevice,
    registerGateway,
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}
