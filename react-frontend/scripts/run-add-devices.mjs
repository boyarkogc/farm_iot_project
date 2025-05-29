#!/usr/bin/env node

// This script runs the add-demo-devices.js using Vite's environment
// to ensure all environment variables are properly loaded
import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run the add-demo-devices.js script with env variables from Vite
console.log("Running add-demo-devices.js with Vite environment...");

const scriptPath = resolve(__dirname, "./add-demo-devices.js");
const vite = spawn("npx", ["vite-node", scriptPath], {
  stdio: "inherit",
  shell: true,
});

vite.on("close", (code) => {
  console.log(`Script execution completed with code ${code}`);
  process.exit(code);
});
