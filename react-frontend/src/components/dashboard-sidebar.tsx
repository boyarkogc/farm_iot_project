import { Cpu, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardContext } from "./contexts/dashboard-context";

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

  // Device items
  const deviceItems = [
    {
      id: "pi_dev_01",
      title: "pi_dev_01",
      icon: Cpu,
    },
    {
      id: "pi_dev_02",
      title: "pi_dev_02",
      icon: Cpu,
    },
  ];

  // Special items (like Add device)
  const specialItems = [
    {
      title: "Add device",
      url: "/register",
      icon: Plus,
    },
  ];

  const handleDeviceClick = (deviceId: string) => {
    setActiveDevice(deviceId);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devices</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {deviceItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeDevice === item.id}
                    onClick={() => handleDeviceClick(item.id)}
                  >
                    <button>
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
