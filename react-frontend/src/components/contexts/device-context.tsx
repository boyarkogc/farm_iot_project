import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "./auth-provider";

// Device interface
export interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
}

type DeviceContextType = {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  updateDeviceName: (deviceId: string, newName: string) => Promise<void>;
  registerDevice: (registrationCode: string, deviceName?: string, location?: string) => Promise<Device | null>;
};

const initialValue: DeviceContextType = {
  devices: [],
  isLoading: false,
  error: null,
  refreshDevices: async () => {},
  updateDeviceName: async () => {},
  registerDevice: async () => null,
};

const DeviceContext = createContext<DeviceContextType>(initialValue);

export function useDevices() {
  return useContext(DeviceContext);
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to fetch user's devices from Firestore
  const fetchUserDevices = async () => {
    if (!user) {
      setDevices([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const devicesRef = collection(db, `users/${user.uid}/devices`);
      const querySnapshot = await getDocs(devicesRef);

      const fetchedDevices: Device[] = [];
      querySnapshot.forEach((doc) => {
        const deviceData = doc.data() as Omit<Device, "id">;
        fetchedDevices.push({
          id: doc.id,
          ...deviceData,
        });
      });

      setDevices(fetchedDevices);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError("Failed to load devices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch devices when the user changes
  useEffect(() => {
    fetchUserDevices();
  }, [user]);

  // Function to update device name in Firestore
  const updateDeviceName = async (deviceId: string, newName: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const deviceRef = doc(db, `users/${user.uid}/devices`, deviceId);
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

  // Function to register a device with a registration code
  // Define API base URL for all requests
const API_BASE_URL = 'http://localhost:8080';

const registerDevice = async (
    registrationCode: string,
    deviceName?: string,
    location?: string
  ): Promise<Device | null> => {
    if (!user) {
      throw new Error('User must be logged in to register devices');
    }
    
    console.log("Starting device registration with code:", registrationCode);
    console.log("User ID from Firebase:", user.uid);
    
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
        deviceId = "test-sensor-1234";
        console.log(`Using default deviceId=${deviceId}, code=${regCode}`);
      }
      
      // For debugging - log what we're about to send
      const requestData = {
        registrationCode: regCode, // Use the parsed registration code
        deviceId,
        deviceName: deviceName || "Default Device Name", // Provide defaults for testing
        location: location || "Default Location"
      };
      
      console.log("Sending request data:", requestData);
      
      // Use the API base URL constant
      const response = await fetch(`${API_BASE_URL}/api/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.uid
        },
        body: JSON.stringify(requestData)
      });
      
      console.log("Registration response status:", response.status, response.statusText);
      
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
      setDevices(prev => [...prev, newDevice]);
      
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
    devices,
    isLoading,
    error,
    refreshDevices: fetchUserDevices,
    updateDeviceName,
    registerDevice,
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}
