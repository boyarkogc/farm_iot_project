// src/config/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from "firebase/firestore";

// Define a type for the config structure for clarity (optional but good practice)
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Helper function to safely get environment variables
// This prevents errors if an environment variable is missing
const getEnvVar = (key: string): string => {
  // Use import.meta.env instead of process.env for Vite
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Your web app's Firebase configuration using environment variables
// Using the helper ensures the variables exist before initializing
const firebaseConfig: FirebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID"),
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// Explicitly type auth with the Auth type from firebase/auth
const auth: Auth = getAuth(app);

// Initialize Firestore
const db: Firestore = getFirestore(app);

// --- Environment Logging ---
// Check which Firebase configuration we're using
if (import.meta.env.DEV) {
  console.log("Development mode: Using development Firebase project");
  console.log(`Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`);
} else {
  console.log("Production mode: Using production Firebase services");
}

// --- Emulator Connection (if needed) ---
// This section is kept for reference, but we're now using a real Firebase project
// instead of emulators for better data persistence
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (useEmulators) {
  console.log("Connecting to Firebase Emulators");

  // Connect to Auth Emulator
  try {
    // Use firebase-emulator service name when running in Docker
    const authHost =
      window.location.hostname === "localhost"
        ? "localhost"
        : "firebase-emulator";
    connectAuthEmulator(auth, `http://${authHost}:9099`, {
      disableWarnings: true,
    });
    console.log("Successfully connected to Auth Emulator.");
  } catch (error) {
    console.error("Error connecting to Auth Emulator:", error);
  }

  // Connect to Firestore Emulator
  try {
    const firestoreHost =
      window.location.hostname === "localhost"
        ? "localhost"
        : "firebase-emulator";
    connectFirestoreEmulator(db, firestoreHost, 9090);
    console.log("Successfully connected to Firestore Emulator.");
  } catch (error) {
    console.error("Error connecting to Firestore Emulator:", error);
  }
}
// --- End Emulator Connection ---

// Export instances to use in your components
export { auth, db };

// You can also export 'app' if needed
// export { app }; // if you need the FirebaseApp instance elsewhere
