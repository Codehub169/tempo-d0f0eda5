// Loads environment variables from .env file into process.env
// This is especially useful if the app is not started via startup.sh, which already exports them
require('dotenv').config(); 

const { Pool } = require('pg');

// Configuration for PostgreSQL connection
// Values are sourced from environment variables
const dbConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Optional SSL, useful for managed databases
};

// Create a new PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Test the connection and log any errors
pool.on('connect', () => {
  console.log('PostgreSQL pool connected.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // process.exit(-1); // Optionally exit if pool errors are critical
});

// JWT Secret Key from environment variables
const jwtSecret = process.env.JWT_SECRET;

// Server Port from environment variables, defaulting if not set
const serverPort = parseInt(process.env.PORT || '3001', 10);

// Check if critical environment variables are set
if (!dbConfig.user || !dbConfig.host || !dbConfig.database || !dbConfig.password) {
  console.warn('One or more PostgreSQL environment variables (PGUSER, PGHOST, PGDATABASE, PGPASSWORD) are not set. Database connection might fail.');
}

if (!jwtSecret) {
  console.warn('JWT_SECRET environment variable is not set. Authentication will not work correctly.');
}

module.exports = {
  pool,          // Export the connection pool for database queries
  dbConfig,      // Export the database configuration object (e.g., for migrations or direct connections)
  jwtSecret,     // Export the JWT secret key
  serverPort     // Export the server port
};
