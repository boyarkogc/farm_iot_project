import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Send } from "lucide-react";
import { useDashboardContext } from "./contexts/dashboard-context";

// Interface for our alert configuration
interface Alert {
  id: string;
  measurement: string;
  operator: string;
  threshold: number;
  deviceId?: string;
  gatewayId?: string;
}

export default function ControlPanel() {
  // State for the alert dialog
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // State for command controls
  const [selectedCommand, setSelectedCommand] = useState("");
  const [commandParameter, setCommandParameter] = useState("");

  // Access dashboard context to get active device/gateway and available fields
  const { activeDevice, activeGateway, activeFields } = useDashboardContext();

  // Handle alert creation
  const handleAddAlert = () => {
    if (!selectedMeasurement || !selectedOperator || !thresholdValue) {
      toast.error("Please fill in all fields");
      return;
    }

    const newAlert: Alert = {
      id: Date.now().toString(),
      measurement: selectedMeasurement,
      operator: selectedOperator,
      threshold: parseFloat(thresholdValue),
    };

    // Add device or gateway ID based on which is active
    if (activeDevice) {
      newAlert.deviceId = activeDevice.id;
    } else if (activeGateway) {
      newAlert.gatewayId = activeGateway.id;
    }

    setAlerts([...alerts, newAlert]);

    // Reset form and close dialog
    setSelectedMeasurement("");
    setSelectedOperator("");
    setThresholdValue("");
    setIsAlertDialogOpen(false);

    // In a real application, you would send this alert to your backend
    console.log("Added new alert:", newAlert);
  };

  // Handle sending a command
  const handleSendCommand = () => {
    if (!selectedCommand) {
      toast.error("Please select a command");
      return;
    }

    // In a real application, you would send this command to your backend
    console.log(
      "Sending command:",
      selectedCommand,
      "with parameter:",
      commandParameter,
    );

    // Show notification using sonner toast
    toast.success(
      `Command sent: ${selectedCommand} ${commandParameter ? `with parameter: ${commandParameter}` : ""}`,
    );

    // Reset the parameter field but keep the selected command
    setCommandParameter("");
  };

  return (
    <div className="flex">
      <Card className="w-[350px] my-2 mr-2">
        <CardHeader>
          <CardTitle>Send Command</CardTitle>
          <CardDescription>
            Send commands to your connected device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand();
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="command">Command</Label>
                <Select
                  value={selectedCommand}
                  onValueChange={setSelectedCommand}
                >
                  <SelectTrigger id="command">
                    <SelectValue placeholder="Select command" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="run_pump">Run pump</SelectItem>
                    <SelectItem value="toggle_light">Toggle light</SelectItem>
                    <SelectItem value="open_valve">Open valve</SelectItem>
                    <SelectItem value="close_valve">Close valve</SelectItem>
                    <SelectItem value="start_irrigation">
                      Start irrigation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="parameter">Parameter (optional)</Label>
                <Input
                  id="parameter"
                  placeholder="e.g., duration in seconds"
                  value={commandParameter}
                  onChange={(e) => setCommandParameter(e.target.value)}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSendCommand}
            disabled={!selectedCommand}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Command
          </Button>
        </CardFooter>
      </Card>
      <Card className="w-[350px] my-2 mr-2">
        <CardHeader>
          <CardTitle>Manage Alerts</CardTitle>
          <CardDescription>Create alerts for sensor thresholds</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Alerts:</h3>
            {alerts.length > 0 ? (
              <div className="h-[160px] w-full rounded-md border overflow-y-auto scrollbar-thin">
                <div className="p-4">
                  <ul className="space-y-2">
                    {alerts.map((alert) => (
                      <React.Fragment key={alert.id}>
                        <li className="text-sm border p-2 rounded flex justify-between items-center">
                          <span>
                            {alert.measurement} {alert.operator}{" "}
                            {alert.threshold}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              setAlerts(alerts.filter((a) => a.id !== alert.id))
                            }
                          >
                            <span className="sr-only">Delete</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                        {alerts.indexOf(alert) < alerts.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </React.Fragment>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No alerts configured. Add an alert to monitor sensor values.
              </p>
            )}
          </div>

          <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Alert</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new alert</DialogTitle>
                <DialogDescription>
                  Create an alert to notify when sensor values cross thresholds.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Measurement selector */}
                <div className="grid gap-2">
                  <Label htmlFor="measurement">Measurement *</Label>
                  <Select
                    value={selectedMeasurement}
                    onValueChange={setSelectedMeasurement}
                  >
                    <SelectTrigger id="measurement">
                      <SelectValue placeholder="Select measurement" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {activeFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                      {!activeFields.length && (
                        <SelectItem value="temperature">temperature</SelectItem>
                      )}
                      {!activeFields.length && (
                        <SelectItem value="humidity">humidity</SelectItem>
                      )}
                      {!activeFields.length && (
                        <SelectItem value="pressure">pressure</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator selector */}
                <div className="grid gap-2">
                  <Label htmlFor="operator">Operator *</Label>
                  <Select
                    value={selectedOperator}
                    onValueChange={setSelectedOperator}
                  >
                    <SelectTrigger id="operator">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="<">Less than (&lt;)</SelectItem>
                      <SelectItem value="<=">
                        Less than or equal (&lt;=)
                      </SelectItem>
                      <SelectItem value="=">Equal to (=)</SelectItem>
                      <SelectItem value=">=">
                        Greater than or equal (&gt;=)
                      </SelectItem>
                      <SelectItem value=">">Greater than (&gt;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Threshold value */}
                <div className="grid gap-2">
                  <Label htmlFor="threshold">Threshold Value *</Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="Enter threshold value"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAlertDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAlert} type="submit">
                  Add Alert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {alerts.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setAlerts([])}
              className="w-full"
            >
              Clear All Alerts
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
