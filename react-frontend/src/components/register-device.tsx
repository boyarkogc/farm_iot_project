"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterDevice() {
  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full max-w-sm space-y-2">
        <Label htmlFor="deviceCode">Registration Code</Label>
        <div className="flex space-x-2">
          <Input id="deviceCode" type="text" placeholder="Registration Code" />
          <Button type="submit">Register</Button>
        </div>
      </div>
    </div>
  );
}
