import { Cpu, Plus } from "lucide-react";
import { useDashboardContext } from "./contexts/dashboard-context";
import { useDevices } from "./contexts/device-context";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardSidebar() {
  const { setActiveDevice, activeDevice } = useDashboardContext();
  const { devices, isLoading, error, registerDevice } = useDevices();
  const [registrationCode, setRegistrationCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [location, setLocation] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Map Firebase devices to sidebar items
  const deviceItems = devices.map((device) => ({
    id: device.id,
    title: device.name,
    icon: Cpu,
  }));

  // Handle device registration
  const handleRegisterDevice = async () => {
    if (!registrationCode.trim()) {
      setRegistrationError("Registration code is required");
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);
    
    try {
      const result = await registerDevice(
        registrationCode,
        deviceName || undefined,
        location || undefined
      );
      
      if (result) {
        console.log("Device registered successfully:", result);
        // Reset form
        setRegistrationCode("");
        setDeviceName("");
        setLocation("");
      } else {
        console.error("Result was null or undefined");
        setRegistrationError("Failed to register device. Please try again.");
      }
    } catch (err) {
      console.error("Error in device registration:", err);
      // Log more detailed info for debugging
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        console.error("Unknown error type:", typeof err);
      }
      setRegistrationError(
        err instanceof Error ? err.message : "Unknown error occurred"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeviceClick = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      setActiveDevice(device);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devices</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-3 py-2 text-sm">Loading devices...</div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500">{error}</div>
            ) : (
              <SidebarMenu>
                {deviceItems.length > 0 ? (
                  deviceItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeDevice.id === item.id}
                        onClick={() => handleDeviceClick(item.id)}
                      >
                        <button>
                          <item.icon />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm">No devices found</div>
                )}

                <SidebarMenuItem>
                  <Dialog>
                    <DialogTrigger asChild>
                      <SidebarMenuButton asChild>
                        <button>
                          <Plus />
                          <span>Add device</span>
                        </button>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Register New Device</DialogTitle>
                        <DialogDescription>
                          Enter the device registration code to add a new device
                          to your dashboard. For best results, use the format:
                          <span className="font-bold"> deviceID:registrationCode</span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="registrationCode">
                            Registration Code *
                          </Label>
                          <Input
                            id="registrationCode"
                            placeholder="Enter registration code"
                            value={registrationCode}
                            onChange={(e) =>
                              setRegistrationCode(e.target.value)
                            }
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="deviceName">
                            Device Name (Optional)
                          </Label>
                          <Input
                            id="deviceName"
                            placeholder="My Living Room Sensor"
                            value={deviceName}
                            onChange={(e) =>
                              setDeviceName(e.target.value)
                            }
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="location">
                            Location (Optional)
                          </Label>
                          <Input
                            id="location"
                            placeholder="Living Room"
                            value={location}
                            onChange={(e) =>
                              setLocation(e.target.value)
                            }
                          />
                        </div>
                        
                        {registrationError && (
                          <div className="text-sm text-red-500 mt-2">
                            {registrationError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleRegisterDevice} 
                          type="submit"
                          disabled={isRegistering}
                        >
                          {isRegistering ? "Registering..." : "Register Device"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
