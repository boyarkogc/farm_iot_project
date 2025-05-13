import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DashboardContextProvider,
  useDashboardContext,
} from "./contexts/dashboard-context";
import { DeviceProvider } from "./contexts/device-context";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import CurrentReadings from "./current-readings";
import DashboardChart from "./dashboard-chart";
import ControlPanel from "./control-panel";
import GatewayInfo from "./gateway-info";

// Content component that conditionally renders based on selection
function DashboardContent() {
  const { activeDevice, activeGateway } = useDashboardContext();

  // If a gateway is selected
  if (activeGateway) {
    return (
      <div className="ml-6 mr-2">
        <GatewayInfo />
      </div>
    );
  }

  // Default device dashboard view
  return (
    <div className="ml-6 mr-2">
      <DashboardHeader />
      <CurrentReadings />
      <DashboardChart />
      <ControlPanel />
    </div>
  );
}

export default function Dashboard() {
  return (
    <DeviceProvider>
      <DashboardContextProvider>
        <SidebarProvider>
          <DashboardSidebar />
          <main className="flex-grow">
            <SidebarTrigger />
            <DashboardContent />
          </main>
        </SidebarProvider>
      </DashboardContextProvider>
    </DeviceProvider>
  );
}
