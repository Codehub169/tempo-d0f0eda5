// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Added for security best practices
const { pool } = require('./config'); // Database connection pool

// Import routes
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

// Initialize Express app
const app = express();

// Middleware
// Apply Helmet for basic security headers
app.use(helmet());

// Enable CORS. For production, configure this more strictly.
// Example: Set a specific origin with an environment variable
// const allowedOrigins = process.env.CORS_ALLOWED_ORIGIN ? process.env.CORS_ALLOWED_ORIGIN.split(',') : [];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) { // Allow requests with no origin (like mobile apps or curl) or from allowed list
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
// };
// app.use(cors(corsOptions));

// For now, allowing all origins (adjust for production)
app.use(cors()); 

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Consider adding rate limiting for auth routes in production
// const rateLimit = require('express-rate-limit');
// const authLimiter = rateLimit({
//  windowMs: 15 * 60 * 1000, // 15 minutes
//  max: 100, // limit each IP to 100 requests per windowMs
//  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });
// app.use('/api/auth', authLimiter);

// Basic route for testing server status
app.get('/', (req, res) => {
  res.send('Fitness Tracker API is running!');
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount workout routes
app.use('/api/workouts', workoutRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Avoid sending stack trace to client in production
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
                ? 'Something went wrong!' 
                : err.message || 'Something went wrong!';
  res.status(statusCode).send({ error: message });
});

// Define the port for the server
const PORT = process.env.PORT || 3001;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  // Test database connection on startup
  pool.query('SELECT NOW()', (dbErr, dbRes) => {
    if (dbErr) {
      console.error('Error connecting to the database:', dbErr.stack || dbErr);
    } else {
      console.log('Successfully connected to the database. Server time:', dbRes.rows[0].now);
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
