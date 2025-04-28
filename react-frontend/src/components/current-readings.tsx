import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function CurrentReadings() {
  return (
    <div className="flex">
      <Card className="my-2 mr-2">
        <CardHeader>
          <CardTitle>Current Humidity</CardTitle>
        </CardHeader>
        <CardContent>39 Percent</CardContent>
      </Card>
      <Card className="my-2 mr-2">
        <CardHeader>
          <CardTitle>Current Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          <p>72 degrees</p>
        </CardContent>
      </Card>
    </div>
  );
}
