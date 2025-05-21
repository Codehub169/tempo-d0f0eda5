-- SQL script to initialize the database schema for the fitness tracking application

-- Drop tables if they exist to ensure a clean setup (optional, use with caution in development)
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS workout_entries;
DROP TABLE IF EXISTS users;

-- Users table to store user account information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                             -- Unique identifier for the user
    username VARCHAR(255) UNIQUE NOT NULL,             -- User's chosen username, must be unique
    password_hash VARCHAR(255) NOT NULL,               -- Hashed password for security
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Timestamp of account creation
);

-- Workout entries table to store details of each workout session
CREATE TABLE workout_entries (
    id SERIAL PRIMARY KEY,                             -- Unique identifier for the workout entry
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Foreign key to users table, cascade delete
    date DATE NOT NULL,                                -- Date of the workout
    exercise_name VARCHAR(255) NOT NULL,               -- Name of the exercise performed
    sets INTEGER,                                      -- Number of sets performed
    reps INTEGER,                                      -- Number of repetitions per set
    weight DECIMAL(10, 2),                             -- Weight used (e.g., in kg or lbs)
    duration INTEGER,                                  -- Duration of the exercise or workout (e.g., in seconds or minutes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Timestamp of entry creation
);

-- Personal records table to track users' best performances
CREATE TABLE personal_records (
    id SERIAL PRIMARY KEY,                             -- Unique identifier for the personal record
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Foreign key to users table, cascade delete
    exercise_name VARCHAR(255) NOT NULL,               -- Name of the exercise for which the PR was achieved
    record_type VARCHAR(50) NOT NULL,                  -- Type of record (e.g., 'max_weight', 'max_reps', 'fastest_time')
    value DECIMAL(10, 2) NOT NULL,                     -- Value of the record (e.g., weight lifted, number of reps)
    date DATE NOT NULL,                                -- Date the PR was achieved
    workout_entry_id INTEGER REFERENCES workout_entries(id) ON DELETE SET NULL, -- Optional: link to the specific workout entry that resulted in this PR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Timestamp of PR creation
);

-- Indexes for performance improvement on frequently queried columns
CREATE INDEX idx_workout_entries_user_id ON workout_entries(user_id);
CREATE INDEX idx_workout_entries_date ON workout_entries(date);
CREATE INDEX idx_personal_records_user_id ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise_name ON personal_records(exercise_name);
CREATE INDEX idx_personal_records_record_type ON personal_records(record_type);

-- Example of how to add a composite index if needed, e.g., for querying current PRs
-- CREATE UNIQUE INDEX idx_current_pr ON personal_records(user_id, exercise_name, record_type, value); 
-- Note: A unique index might not be suitable if storing history of PRs. Application logic will determine current PR.

-- Initial console log to confirm script execution (optional)
-- This won't actually output to console via psql execution in startup.sh but is a common SQL script practice.
-- \! echo "Database schema initialized."
