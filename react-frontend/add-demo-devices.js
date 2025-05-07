// Script to add demo devices to Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { createRequire } from 'module';

// Setup require for dotenv
const require = createRequire(import.meta.url);

// Load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables directly');
}

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Print config for debugging (without sensitive values)
console.log("Using Firebase project:", process.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replace with actual user IDs from your Firebase Authentication
const userIds = [
  "RgbM7Q9D5PSZjhLi3rB1nWABQd63", // Replace with a real user ID
];

// Sample device data
const sampleDevices = [
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
async function addDevicesToUsers() {
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