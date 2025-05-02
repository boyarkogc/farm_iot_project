// Example React component using fetch
import { useState, useEffect } from "react";
import SensorReading from "@/interfaces/sensor_reading_interface";

export default function GetWeather() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Use the environment variable configured during the build
    //const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080"; // Fallback just in case
    const apiUrl = "http://localhost:8080";
    console.log("point 1");
    //fetch(`${apiUrl}/weatherforecast`)
    fetch(`${apiUrl}/devices/pi_dev_01/readings?hours=1`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const condensed_data = data.map((item: SensorReading) => {
          return {
            timestamp: new Date(item.timestamp),
            ...item.fields,
          };
        });
        setData(condensed_data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty dependency array means this runs once on mount

  // ... render logic based on loading, error, data ...
  return (
    <>
      <h1>{loading || error || !data ? error : JSON.stringify(data)}</h1>
    </>
  );
}
