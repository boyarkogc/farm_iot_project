import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
};

const initialValue: DeviceContextType = {
  devices: [],
  isLoading: false,
  error: null,
  refreshDevices: async () => {},
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

  // Value to provide
  const value = {
    devices,
    isLoading,
    error,
    refreshDevices: fetchUserDevices,
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}
