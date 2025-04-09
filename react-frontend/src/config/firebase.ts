// src/config/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";

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

// --- Emulator Connection ---
// Check if we should use emulators based on the environment variable
// In Vite, environment variables are accessed via import.meta.env
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (useEmulators) {
  console.log("Development mode: Connecting to Firebase Auth Emulator");
  // Point to the auth emulator running on localhost.
  // Default port is 9099.
  try {
    // Using 127.0.0.1 instead of localhost can sometimes avoid specific network resolution issues
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log("Successfully connected to Auth Emulator.");
  } catch (error) {
    console.error("Error connecting to Auth Emulator:", error);
  }
} else {
  console.log("Production mode: Connecting to live Firebase Auth.");
}
// --- End Emulator Connection ---

// Export auth instance to use in your components
export { auth };

// You can also export 'app' if needed
// export { app }; // if you need the FirebaseApp instance elsewhere
