import { ArrowUpDown, Server, Monitor, RefreshCw } from "lucide-react";
import { useDashboardContext } from "./contexts/dashboard-context";
import { Device, Gateway, useDevices } from "./contexts/device-context";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardSidebar() {
  const { setActiveDevice, activeDevice, setActiveGateway, activeGateway } =
    useDashboardContext();
  const {
    gateways,
    devices,
    isLoading,
    error,
    registerDevice,
    registerGateway,
    refreshDevices,
  } = useDevices();

  // State for registration
  const [registrationCode, setRegistrationCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  // State for dialog control
  const [isGatewayDialog, setIsGatewayDialog] = useState(false);
  const [isDeviceDialog, setIsDeviceDialog] = useState(false);

  // Map gateways and their devices for the sidebar
  const gatewaysWithDevices = gateways.map((gateway) => {
    // Get devices that belong to this gateway
    const gatewayDevices = devices.filter(
      (device) => device.gatewayId === gateway.id,
    );

    // Map devices to sidebar items
    const deviceItems = gatewayDevices.map((device) => ({
      id: device.id,
      title: device.name,
      icon: ArrowUpDown,
      device: device,
    }));

    return {
      id: gateway.id,
      title: gateway.name,
      icon: Server,
      devices: deviceItems,
    };
  });

  // Handle gateway registration
  const handleRegisterGateway = async () => {
    if (!registrationCode.trim()) {
      setRegistrationError("Registration code is required");
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const result = await registerGateway(
        registrationCode,
        deviceName || undefined,
        location || undefined,
      );

      if (result) {
        console.log("Gateway registered successfully:", result);
        // Reset form and close dialog
        setRegistrationCode("");
        setDeviceName("");
        setLocation("");
        setIsGatewayDialog(false);
      } else {
        console.error("Result was null or undefined");
        setRegistrationError("Failed to register gateway. Please try again.");
      }
    } catch (err) {
      console.error("Error in gateway registration:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        console.error("Unknown error type:", typeof err);
      }
      setRegistrationError(
        err instanceof Error ? err.message : "Unknown error occurred",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle device registration
  const handleRegisterDevice = async () => {
    if (!registrationCode.trim()) {
      setRegistrationError("Registration code is required");
      return;
    }

    if (!selectedGatewayId) {
      setRegistrationError("You must select a gateway");
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const result = await registerDevice(
        registrationCode,
        deviceName || undefined,
        location || undefined,
        selectedGatewayId,
      );

      if (result) {
        console.log("Device registered successfully:", result);
        // Reset form and close dialog
        setRegistrationCode("");
        setDeviceName("");
        setLocation("");
        setSelectedGatewayId("");
        setIsDeviceDialog(false);
      } else {
        console.error("Result was null or undefined");
        setRegistrationError("Failed to register device. Please try again.");
      }
    } catch (err) {
      console.error("Error in device registration:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        console.error("Unknown error type:", typeof err);
      }
      setRegistrationError(
        err instanceof Error ? err.message : "Unknown error occurred",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeviceClick = (device: Device) => {
    setActiveDevice(device);
    setActiveGateway(null);
  };

  const handleGatewayClick = (gateway: Gateway) => {
    setActiveGateway(gateway);
    setActiveDevice(null);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Gateways and Devices</span>
            <button
              onClick={() => refreshDevices()}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors"
              title="Refresh devices"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin text-muted-foreground" : ""}`}
              />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-3 py-2 text-sm">Loading...</div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500">{error}</div>
            ) : (
              <SidebarMenu>
                {gatewaysWithDevices.length > 0 ? (
                  gatewaysWithDevices.map((gateway) => (
                    <div key={gateway.id} className="mb-2">
                      {/* Gateway Item */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={activeGateway?.id === gateway.id}
                          onClick={() =>
                            handleGatewayClick({
                              id: gateway.id,
                              name: gateway.title,
                              type: "raspberry-pi",
                              location: "",
                            })
                          }
                        >
                          <button className="font-semibold flex w-full justify-between items-center">
                            <div className="flex items-center">
                              <gateway.icon className="mr-2" />
                              <span>{gateway.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {gateway.devices.length}{" "}
                              {gateway.devices.length === 1
                                ? "device"
                                : "devices"}
                            </span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Device Items for this Gateway - now styled as nested items */}
                      {gateway.devices.length > 0 ? (
                        <div className="border-l-2 border-muted ml-3 pl-3 mt-1">
                          {gateway.devices.map((deviceItem) => (
                            <SidebarMenuItem key={deviceItem.id}>
                              <SidebarMenuButton
                                asChild
                                isActive={activeDevice?.id === deviceItem.id}
                                onClick={() =>
                                  handleDeviceClick(deviceItem.device)
                                }
                              >
                                <button className="text-sm py-1.5">
                                  <deviceItem.icon className="h-4 w-4" />
                                  <span>{deviceItem.title}</span>
                                </button>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground ml-7 mt-1 mb-1">
                          No devices connected
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm">
                    No gateways found. Add a gateway first!
                  </div>
                )}

                {/* Add Gateway Button */}
                <SidebarMenuItem>
                  <Dialog
                    open={isGatewayDialog}
                    onOpenChange={setIsGatewayDialog}
                  >
                    <DialogTrigger asChild>
                      <SidebarMenuButton asChild>
                        <button>
                          <Server />
                          <span>Add Gateway</span>
                        </button>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Register New Gateway</DialogTitle>
                        <DialogDescription>
                          Register a Raspberry Pi gateway to connect Arduino
                          devices to. For best results, use the format:
                          <span className="font-bold">
                            {" "}
                            gatewayID:registrationCode
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="gatewayRegistrationCode">
                            Registration Code *
                          </Label>
                          <Input
                            id="gatewayRegistrationCode"
                            placeholder="Enter registration code"
                            value={registrationCode}
                            onChange={(e) =>
                              setRegistrationCode(e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="gatewayName">
                            Gateway Name (Optional)
                          </Label>
                          <Input
                            id="gatewayName"
                            placeholder="Farm Raspberry Pi"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="gatewayLocation">
                            Location (Optional)
                          </Label>
                          <Input
                            id="gatewayLocation"
                            placeholder="Barn"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>

                        {registrationError && (
                          <div className="text-sm text-red-500 mt-2">
                            {registrationError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleRegisterGateway}
                          type="submit"
                          disabled={isRegistering}
                        >
                          {isRegistering
                            ? "Registering..."
                            : "Register Gateway"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>

                {/* Add Device Button */}
                <SidebarMenuItem>
                  <Dialog
                    open={isDeviceDialog}
                    onOpenChange={setIsDeviceDialog}
                  >
                    <DialogTrigger asChild>
                      <SidebarMenuButton asChild>
                        <button>
                          <Monitor />
                          <span>Add Device</span>
                        </button>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Register New Device</DialogTitle>
                        <DialogDescription>
                          Register an Arduino device and connect it to a
                          gateway. For best results, use the format:
                          <span className="font-bold">
                            {" "}
                            deviceID:registrationCode
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="gateway">Gateway *</Label>
                          <Select
                            value={selectedGatewayId}
                            onValueChange={setSelectedGatewayId}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a gateway" />
                            </SelectTrigger>
                            <SelectContent>
                              {gateways.map((gateway) => (
                                <SelectItem key={gateway.id} value={gateway.id}>
                                  {gateway.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="deviceRegistrationCode">
                            Registration Code *
                          </Label>
                          <Input
                            id="deviceRegistrationCode"
                            placeholder="Enter registration code"
                            value={registrationCode}
                            onChange={(e) =>
                              setRegistrationCode(e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="deviceName">
                            Device Name (Optional)
                          </Label>
                          <Input
                            id="deviceName"
                            placeholder="My Living Room Sensor"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="deviceLocation">
                            Location (Optional)
                          </Label>
                          <Input
                            id="deviceLocation"
                            placeholder="Living Room"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>

                        {registrationError && (
                          <div className="text-sm text-red-500 mt-2">
                            {registrationError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleRegisterDevice}
                          type="submit"
                          disabled={isRegistering || gateways.length === 0}
                        >
                          {isRegistering ? "Registering..." : "Register Device"}
                        </Button>
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
