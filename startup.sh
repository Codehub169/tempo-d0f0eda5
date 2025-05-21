#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Helper Functions ---
echo_blue() {
  echo -e "\033[1;34m$1\033[0m"
}

echo_green() {
  echo -e "\033[1;32m$1\033[0m"
}

echo_red() {
  echo -e "\033[1;31m$1\033[0m"
}

# --- Check Dependencies ---
echo_blue "Checking dependencies..."

command -v node >/dev/null 2>&1 || { echo_red >&2 "Node.js is not installed. Please install it and try again."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo_red >&2 "npm is not installed. Please install it and try again."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo_red >&2 "PostgreSQL client (psql) is not installed. Please install PostgreSQL and ensure psql is in your PATH."; exit 1; }

echo_green "All basic dependencies found."

# --- Configuration ---
echo_blue "Setting up configuration..."

# Database Configuration
read -p "Enter PostgreSQL User [default: fitness_user]: " DB_USER
DB_USER=${DB_USER:-fitness_user}

read -p "Enter PostgreSQL Password [default: fitness_password]: " -s DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-fitness_password}
echo # for newline after password input

read -p "Enter PostgreSQL Database Name [default: fitness_db]: " DB_NAME
DB_NAME=${DB_NAME:-fitness_db}

read -p "Enter PostgreSQL Host [default: localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter PostgreSQL Port [default: 5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# JWT Configuration
read -p "Enter JWT Secret Key [default: aSecureSecretKey123!]: " JWT_SECRET
JWT_SECRET=${JWT_SECRET:-aSecureSecretKey123!}

# Backend Port
BACKEND_PORT=${BACKEND_PORT:-3001}

# Frontend Port (Fixed to 9000 as per requirements)
FRONTEND_PORT=9000

# Export environment variables for backend and other scripts
export PGUSER=$DB_USER
export PGPASSWORD=$DB_PASSWORD
export PGDATABASE=$DB_NAME
export PGHOST=$DB_HOST
export PGPORT=$DB_PORT
export JWT_SECRET=$JWT_SECRET
export PORT=$BACKEND_PORT # Port for the backend server

echo_green "Environment variables set for this session."

# --- Database Setup ---
echo_blue "Attempting to set up PostgreSQL database..."

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo_green "Database '$DB_NAME' already exists. Skipping creation."
else
  echo_blue "Database '$DB_NAME' does not exist. Attempting to create..."
  echo_blue "You might be prompted for your system password if sudo is required for PostgreSQL operations."
  # Try to create user and database. This might require sudo or specific postgres user execution.
  # This is a best-effort attempt. Manual setup might be needed if this fails.
  echo_blue "Attempting to create database user '$DB_USER' and database '$DB_NAME'."
  echo_blue "If this fails, please create them manually."
  echo_blue "Example commands (run as postgres user or with sudo -u postgres):"
  echo_blue "  CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
  echo_blue "  CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  echo_blue "  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
  
  set +e # Temporarily disable exit on error for db creation
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > /dev/null 2>&1
  if [ $? -ne 0 ]; then
      echo_blue "Could not create database automatically. Trying with 'postgres' user. You might be prompted for sudo password."
      sudo -u postgres createdb $DB_NAME > /dev/null 2>&1
      if [ $? -ne 0 ]; then
          echo_red "Failed to create database '$DB_NAME'. Please create it manually."
          # exit 1 # Do not exit, allow user to create it and then run init.sql
      else
          echo_green "Database '$DB_NAME' created successfully by postgres user."
      fi
  else
      echo_green "Database '$DB_NAME' created or already exists."
  fi
  
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null 2>&1 || echo_blue "User '$DB_USER' may already exist or could not be created. Ensure user exists with password."
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null 2>&1 || echo_blue "Could not grant privileges. Ensure user has privileges on database."
  set -e
fi

# Initialize database schema
if [ -f "backend/db/init.sql" ]; then
  echo_blue "Initializing database schema from backend/db/init.sql..."
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "backend/db/init.sql"
  echo_green "Database schema initialized."
else
  echo_red "backend/db/init.sql not found. Skipping schema initialization."
fi

# --- Backend Setup --- 
echo_blue "Setting up backend..."
cd backend
npm install
echo_green "Backend dependencies installed."

# Start backend server in the background
echo_blue "Starting backend server on port $BACKEND_PORT..."
# Create a .env file for the backend if it doesn't exist
cat << EOF > .env
PGUSER=$DB_USER
PGHOST=$DB_HOST
PGDATABASE=$DB_NAME
PGPASSWORD=$DB_PASSWORD
PGPORT=$DB_PORT
JWT_SECRET=$JWT_SECRET
PORT=$BACKEND_PORT
EOF
echo_green "Backend .env file created/updated."

npm start &
BACKEND_PID=$!
echo_green "Backend server started with PID $BACKEND_PID."
cd ..

# --- Frontend Setup --- 
echo_blue "Setting up frontend..."
cd frontend
npm install
echo_green "Frontend dependencies installed."

# Start frontend server on port 9000
echo_blue "Starting frontend server on port $FRONTEND_PORT..."
# Create a .env file for the frontend if it doesn't exist, to specify API URL
REACT_APP_API_URL="http://localhost:$BACKEND_PORT/api"
cat << EOF > .env
REACT_APP_API_URL=$REACT_APP_API_URL
PORT=$FRONTEND_PORT
EOF

# Modify package.json start script to use port 9000 if not already set
# This is a bit intrusive, ideally the frontend framework respects PORT env var or has a config for it.
# For Create React App, PORT env var is usually respected.

echo_green "Frontend .env file created/updated."

echo_blue "To run frontend on port $FRONTEND_PORT, ensure your frontend's package.json start script respects the PORT environment variable or is configured for port $FRONTEND_PORT."
echo_blue "For example, for Create React App, 'npm start' typically respects the PORT environment variable."
echo_blue "If using Vite, it might be 'vite --port $FRONTEND_PORT'."

# Attempt to start with PORT variable, common for many Node.js frontends
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo_green "Frontend server started with PID $FRONTEND_PID."
cd ..

echo_blue "
--- Application Setup Complete ---
Backend API should be running at: http://localhost:$BACKEND_PORT
Frontend should be running at: http://localhost:$FRONTEND_PORT

To stop the servers, you can use:
kill $BACKEND_PID
kill $FRONTEND_PID
(Or use Ctrl+C in the terminals if you run them manually)
"

# Keep script running to keep background processes alive if needed, or manage them as child processes
wait $BACKEND_PID
wait $FRONTEND_PID
