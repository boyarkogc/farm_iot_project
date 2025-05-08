import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import SensorReading, {
  CondensedSensorReading,
} from "@/interfaces/sensor_reading_interface";
import { useDevices, Device } from "./device-context";

// Define the shape of your context state
interface DashboardContextState {
  activeDevice: Device;
  activeFields: string[];
  activeChart: string;
  data: SensorReading[];
  condensedData: CondensedSensorReading[];
  loading: boolean;
  error: string | null;
  setActiveChart: (chart: string) => void;
  setActiveDevice: (device: Device) => void;
  getDeviceData: (deviceId: string) => void;
}

// Create the context with a default value
const DashboardContext = createContext<DashboardContextState | undefined>(
  undefined,
);

// Props for the context provider
interface DashboardContextProviderProps {
  children: ReactNode;
  initialCount?: number;
  initialMessage?: string;
}

// Create the provider component
export const DashboardContextProvider: React.FC<
  DashboardContextProviderProps
> = ({ children }) => {
  // Get user devices from the device context
  const { devices } = useDevices();

  // Default device fallback when no devices are available
  const defaultDevice: Device = {
    id: "ABCD1234",
    name: "Default Device",
    type: "unknown",
    location: "unknown",
  };

  // Default to first device from the user's devices if available, otherwise use fallback
  const initialDevice = devices.length > 0 ? devices[0] : defaultDevice;

  const [activeDevice, setActiveDevice] = useState<Device>(initialDevice);
  const [activeFields, setActiveFields] = useState(["temperature"]);
  const [activeChart, setActiveChart] = useState("temperature");
  const [data, setData] = useState<SensorReading[]>([]);
  const [condensedData, setCondensedData] = useState<CondensedSensorReading[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update active device when user's devices change (only if not explicitly set by user)
  useEffect(() => {
    if (
      devices.length > 0 &&
      (activeDevice.id === "ABCD1234" ||
        !devices.some((d) => d.id === activeDevice.id))
    ) {
      setActiveDevice(devices[0]);
    }
  }, [devices]);

  const updateActiveFields = (deviceID: string) => {
    //const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080"; // Fallback just in case
    const apiUrl = "http://localhost:8080";
    fetch(`${apiUrl}/devices/${deviceID}/fields`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((fields) => {
        setActiveFields(fields);
      });
  };

  const getDeviceData = (deviceID: string) => {
    const apiUrl = "http://localhost:8080";
    fetch(`${apiUrl}/devices/${deviceID}/readings?hours=1`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const condensed_data = data.map((item: SensorReading) => {
          return {
            timestamp: new Date(item.timestamp),
            ...item.fields,
          };
        });
        setCondensedData(condensed_data);
        setData(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Value object that will be provided to consumers
  const value: DashboardContextState = {
    activeDevice,
    activeFields,
    activeChart,
    setActiveChart,
    setActiveDevice,
    getDeviceData,
    data,
    condensedData,
    loading,
    error,
  };

  // Load initial data
  useEffect(() => {
    updateActiveFields(activeDevice.id);
    getDeviceData(activeDevice.id);
  }, []);

  // Reload data when active device changes
  useEffect(() => {
    updateActiveFields(activeDevice.id);
    getDeviceData(activeDevice.id);
  }, [activeDevice]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = (): DashboardContextState => {
  const context = useContext(DashboardContext);

  if (context === undefined) {
    throw new Error(
      "useDashboardContext must be used within an DashboardContextProvider",
    );
  }

  return context;
};
