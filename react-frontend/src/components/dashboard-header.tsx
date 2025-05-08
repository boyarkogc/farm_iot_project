import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardContext } from "./contexts/dashboard-context";

export default function DashboardHeader() {
  const { activeDevice, getDeviceData } = useDashboardContext();

  return (
    <div className="flex justify-between">
      <h1 className="text-2xl">
        {activeDevice.name} ({activeDevice.id})
      </h1>
      <Button
        variant="outline"
        className="m-2"
        onClick={() => getDeviceData(activeDevice.id)}
      >
        Refresh <RefreshCw />
      </Button>
    </div>
  );
}
