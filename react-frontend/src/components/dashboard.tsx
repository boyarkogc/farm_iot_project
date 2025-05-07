import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardContextProvider } from "./contexts/dashboard-context";
import { DeviceProvider } from "./contexts/device-context";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import CurrentReadings from "./current-readings";
import DashboardChart from "./dashboard-chart";
import ControlPanel from "./control-panel";

export default function Dashboard() {
  return (
    <DeviceProvider>
      <DashboardContextProvider>
        <SidebarProvider>
          <DashboardSidebar />
          <main className="flex-grow">
            <SidebarTrigger />
            <div className="ml-6">
              <DashboardHeader />
              <CurrentReadings />
              <DashboardChart />
              <ControlPanel />
            </div>
          </main>
        </SidebarProvider>
      </DashboardContextProvider>
    </DeviceProvider>
  );
}
