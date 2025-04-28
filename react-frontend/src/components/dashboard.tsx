import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
//import GetWeather from "./get-weather";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import CurrentReadings from "./current-readings";
import DashboardChart from "./dashboard-chart";
import ControlPanel from "./control-panel";

export default function Dashboard() {
  return (
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
  );
}
