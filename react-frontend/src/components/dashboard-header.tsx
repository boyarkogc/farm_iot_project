import { RefreshCw, Check, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardContext } from "./contexts/dashboard-context";
import { useDevices } from "./contexts/device-context";
import { useState } from "react";

export default function DashboardHeader() {
  const { activeDevice, getDeviceData } = useDashboardContext();
  const { updateDeviceName } = useDevices();

  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(
    activeDevice ? activeDevice.name : "",
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditToggle = () => {
    if (!isEditing) {
      // Start editing
      setEditingName(activeDevice ? activeDevice.name : "");
      setIsEditing(true);
    } else {
      // Cancel editing
      setIsEditing(false);
    }
  };

  const handleNameSave = async () => {
    if (editingName.trim() === "") return;
    if (!activeDevice) return;
    setIsUpdating(true);
    try {
      await updateDeviceName(activeDevice.id, editingName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving device name:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex justify-between items-center">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="text-2xl h-10 w-64"
            placeholder="Enter device name..."
            disabled={isUpdating}
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNameSave}
            disabled={isUpdating || editingName.trim() === ""}
          >
            <Check className="h-5 w-5 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditToggle}
            disabled={isUpdating}
          >
            <X className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h1 className="text-2xl">
            {activeDevice ? activeDevice.name : "<No name>"}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Button
        variant="outline"
        className="m-2"
        onClick={() => (activeDevice ? getDeviceData(activeDevice.id) : null)}
        disabled={isUpdating}
      >
        Refresh <RefreshCw className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
