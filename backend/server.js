// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const cors = require('cors');
const { pool } = require('./config'); // Database connection pool

// Import routes
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

// Initialize Express app
const app = express();

// Middleware
// Enable CORS for all routes and origins (adjust for production if needed)
app.use(cors()); 

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Basic route for testing server status
app.get('/', (req, res) => {
  res.send('Fitness Tracker API is running!');
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount workout routes
app.use('/api/workouts', workoutRoutes);

// Global error handler (basic example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Define the port for the server
const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  // Test database connection on startup
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Successfully connected to the database. Server time:', res.rows[0].now);
    }
  });
});
