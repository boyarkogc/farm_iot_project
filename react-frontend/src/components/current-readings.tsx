import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "./contexts/dashboard-context";
import SensorReading from "@/interfaces/sensor_reading_interface";

export default function CurrentReadings() {
  const { data, loading, error } = useDashboardContext();

  function ReadingCards({
    currentReading,
  }: {
    currentReading: SensorReading | undefined;
  }) {
    if (!currentReading) {
      return <div>No sensor readings available</div>;
    }

    const fieldEntries = Object.entries(currentReading.fields);
    return (
      <>
        {fieldEntries.map(([field, value]) => (
          <Card key={field} className="my-2 mr-2 w-64">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base truncate"
                title={`Current ${field}`}
              >
                Current {field}
              </CardTitle>
            </CardHeader>
            <CardContent className="break-words overflow-hidden">
              <span className="block text-wrap">{String(value)}</span>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }
  return (
    <div className="flex">
      {loading ? (
        "Loading..."
      ) : error || !data ? (
        "No data"
      ) : (
        <ReadingCards currentReading={data.at(-1)} />
      )}
    </div>
  );
}
