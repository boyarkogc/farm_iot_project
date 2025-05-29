import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

import SensorReading, {
  CondensedSensorReading,
} from "@/interfaces/sensor_reading_interface";
import { useDevices, Device, Gateway } from "./device-context";

// Define the shape of your context state
interface DashboardContextState {
  activeDevice: Device | null;
  activeGateway: Gateway | null;
  activeFields: string[];
  activeChart: string;
  data: SensorReading[];
  condensedData: CondensedSensorReading[];
  loading: boolean;
  error: string | null;
  setActiveChart: (chart: string) => void;
  setActiveDevice: (device: Device | null) => void;
  setActiveGateway: (gateway: Gateway | null) => void;
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
  // const defaultDevice: Device = {
  //   id: "ABCD1234",
  //   name: "Default Device",
  //   type: "unknown",
  //   location: "unknown",
  //   gatewayId: "",
  // };

  const apiUrl = import.meta.env["VITE_BACKEND_URL"] || "http://localhost:8080";

  // Default to first device from the user's devices if available, otherwise use fallback
  const initialDevice = devices.length > 0 ? devices[0] : null;

  const [activeDevice, setActiveDevice] = useState<Device | null>(
    initialDevice,
  );
  const [activeGateway, setActiveGateway] = useState<Gateway | null>(null);
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
      (!activeDevice || !devices.some((d) => d.id === activeDevice?.id))
    ) {
      setActiveDevice(devices[0]);
      // Clear any active gateway when defaulting to a device
      setActiveGateway(null);
    }
  }, [devices, activeDevice]);

  const updateActiveFields = useCallback(
    (deviceID: string) => {
      fetch(`${apiUrl}/api/devices/${deviceID}/fields`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((fields) => {
          setActiveFields(fields);
        });
    },
    [apiUrl],
  );

  const getDeviceData = useCallback(
    (deviceID: string | undefined) => {
      if (!deviceID) {
        setData([]);
        setCondensedData([]);
        setLoading(false);
        return;
      }

      //fetch(`${apiUrl}/api/devices/${deviceID}/readings?hours=1`)
      fetch(`${apiUrl}/api/devices/${deviceID}/readings`)
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
    },
    [apiUrl],
  );

  // Value object that will be provided to consumers
  const value: DashboardContextState = {
    activeDevice,
    activeGateway,
    activeFields,
    activeChart,
    setActiveChart,
    setActiveDevice,
    setActiveGateway,
    getDeviceData,
    data,
    condensedData,
    loading,
    error,
  };

  // Load initial data
  useEffect(() => {
    if (activeDevice) {
      updateActiveFields(activeDevice.id);
      getDeviceData(activeDevice.id);
    }
  }, [activeDevice, updateActiveFields, getDeviceData]);

  // Reload data when active device changes
  useEffect(() => {
    if (activeDevice) {
      updateActiveFields(activeDevice.id);
      getDeviceData(activeDevice.id);
    }
  }, [activeDevice, updateActiveFields, getDeviceData]);

  // When a gateway is selected, clear the active device
  useEffect(() => {
    if (activeGateway) {
      setActiveDevice(null);
    }
  }, [activeGateway]);

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
