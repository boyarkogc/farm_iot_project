// Script to add demo devices to Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Firestore } from "firebase/firestore";
import { Device } from "../components/contexts/device-context";

// Load environment variables if needed
// import dotenv from 'dotenv';
// dotenv.config();

// Firebase config interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Replace these with your Firebase config from the environment or hardcode for this script
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
};

// Device with ID for the sample data
interface DeviceWithId extends Device {
  id: string;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

// Replace with actual user IDs from your Firebase Authentication
const userIds: string[] = [
  "RgbM7Q9D5PSZjhLi3rB1nWABQd63", // Replace with a real user ID
];

// Sample device data
const sampleDevices: DeviceWithId[] = [
  {
    id: "pi_dev_01",
    name: "pi_dev_01",
    type: "raspberry_pi",
    location: "Corn Field",
  },
  {
    id: "pi_dev_02",
    name: "pi_dev_02",
    type: "raspberry_pi",
    location: "Strawberry Patch",
  },
];

// Add devices for each user
async function addDevicesToUsers(): Promise<void> {
  try {
    for (const userId of userIds) {
      console.log(`Adding devices for user: ${userId}`);

      for (const device of sampleDevices) {
        const deviceRef = doc(db, `users/${userId}/devices/${device.id}`);

        // Create a device object without the ID (as ID is in the document path)
        const { id, ...deviceData } = device;

        await setDoc(deviceRef, deviceData);

        console.log(`Added device ${device.id} to user ${userId}`);
      }
    }

    console.log("All sample devices added successfully!");
  } catch (error) {
    console.error("Error adding sample devices:", error);
  }
}

// Run the function
addDevicesToUsers();
