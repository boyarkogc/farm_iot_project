import { Cpu, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardContext } from "./contexts/dashboard-context";
import { useDevices } from "./contexts/device-context";

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

export default function DashboardSidebar() {
  const { setActiveDevice, activeDevice } = useDashboardContext();
  const { devices, isLoading, error } = useDevices();

  // Map Firebase devices to sidebar items
  const deviceItems = devices.map((device) => ({
    id: device.id,
    title: device.name,
    icon: Cpu,
  }));

  // Special items (like Add device)
  const specialItems = [
    {
      title: "Add device",
      url: "/register",
      icon: Plus,
    },
  ];

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

                {specialItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
