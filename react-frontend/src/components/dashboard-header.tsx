import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  return (
    <div className="flex justify-between">
      <h1 className="text-2xl">Dashboard header goes here</h1>
      <Button variant="outline" className="m-2">
        Refresh <RefreshCw />
      </Button>
    </div>
  );
}
