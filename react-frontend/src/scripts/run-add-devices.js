// Load environment variables from .env file
require('dotenv').config({ path: '../../.env' });

// Import the compiled JS version of our script
require('./add-demo-devices.js');