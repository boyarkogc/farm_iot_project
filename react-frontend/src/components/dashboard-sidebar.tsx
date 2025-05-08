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
  const { devices, isLoading, error } = useDevices();
  const [registrationCode, setRegistrationCode] = useState("");

  // Map Firebase devices to sidebar items
  const deviceItems = devices.map((device) => ({
    id: device.id,
    title: device.name,
    icon: Cpu,
  }));

  // Handle device registration
  const handleRegisterDevice = () => {
    console.log("Registering device with code:", registrationCode);
    // For now, just log the code. Actual registration logic would go here
    setRegistrationCode("");
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
                          Enter the device registration code to add a new device to your dashboard.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="registrationCode">Registration Code</Label>
                          <Input 
                            id="registrationCode" 
                            placeholder="Enter code" 
                            value={registrationCode} 
                            onChange={(e) => setRegistrationCode(e.target.value)} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleRegisterDevice} type="submit">Register Device</Button>
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
