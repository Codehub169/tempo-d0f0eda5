#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
# Treat unset variables as an error when substituting.
# Pipelines fail if any command fails, not just the last one.
set -e
set -u
set -o pipefail

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

echo_yellow() {
  echo -e "\033[1;33m$1\033[0m"
}

# Helper function to run commands as the postgres user
run_as_pg() {
    if [ "$(id -u)" -eq 0 ]; then # If script is run as root
        if command -v sudo >/dev/null 2>&1; then
            sudo -u postgres -- "$@"
        elif command -v su >/dev/null 2>&1; then
            # Use su to execute the command as postgres user
            # Construct command string safely for the inner shell
            local cmd_string
            cmd_string=$(printf '%q ' "$@")
            su - postgres -s /bin/bash -c "$cmd_string"
        else
            echo_red "Neither sudo nor su found. Cannot run commands as postgres user when script is run as root."
            echo_red "Database operations will likely fail."
            return 1
        fi
    else # If script is not run as root
        if ! command -v sudo >/dev/null 2>&1; then # Corrected syntax: added 'then'
            echo_red "Error: sudo command not found. Required for non-root execution to run commands as postgres."
            return 1
        fi
        sudo -u postgres -- "$@"
    fi
}


# --- Check Dependencies and Attempt Installation --- 
echo_blue "Checking and attempting to install missing dependencies..."

attempt_install() {
    local package_to_install="$1" # e.g., nodejs, postgresql-client
    local command_to_check="$2"   # e.g., node, psql
    local human_readable_name="$3" # e.g., Node.js, PostgreSQL client
    local install_instructions_node="For Debian/Ubuntu: curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt-get install -y nodejs. For Fedora: dnf install nodejs. For macOS: brew install node."
    local install_instructions_psql="For Debian/Ubuntu: apt-get install -y postgresql-client. For Fedora: dnf install postgresql. For macOS: brew install postgresql."

    local SUDO_PREFIX=""
    local EXEC_SHELL_CMD="bash -"

    if [ "$(id -u)" -ne 0 ]; then # If not root
        if ! command -v sudo >/dev/null 2>&1; then
            echo_red "Error: sudo command not found, but required for non-root execution."
            echo_red "Please install sudo or run this script as root."
            exit 1
        fi
        SUDO_PREFIX="sudo "
        EXEC_SHELL_CMD="sudo -E bash -"
    fi

    if ! command -v "$command_to_check" >/dev/null 2>&1; then
        echo_red "$human_readable_name ($command_to_check) is not detected."
        echo_blue "Attempting to install $human_readable_name..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt-get >/dev/null 2>&1; then
                echo_blue "Detected Debian/Ubuntu based system. Attempting installation with apt-get."
                if [ -n "$SUDO_PREFIX" ]; then echo_blue "You might be prompted for your sudo password."; fi
                ${SUDO_PREFIX}apt-get update -y >/dev/null
                if [ "$command_to_check" == "node" ]; then
                    echo_blue "Attempting to install Node.js (LTS) and npm via NodeSource..."
                    if ! command -v curl >/dev/null 2>&1; then ${SUDO_PREFIX}apt-get install -y curl >/dev/null; fi
                    curl -fsSL https://deb.nodesource.com/setup_lts.x | ${EXEC_SHELL_CMD} >/dev/null 
                    ${SUDO_PREFIX}apt-get install -y nodejs
                elif [ "$command_to_check" == "npm" ] && [ "$package_to_install" == "npm" ]; then
                    echo_blue "npm is usually installed with Node.js. If Node.js was just installed, npm should be present."
                    echo_blue "If npm is still missing, attempting to install it separately (this might indicate an issue with Node.js installation)."
                    ${SUDO_PREFIX}apt-get install -y npm
                elif [ "$command_to_check" == "psql" ]; then
                    ${SUDO_PREFIX}apt-get install -y postgresql-client
                fi
            elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
                local pkg_manager="yum"
                if command -v dnf >/dev/null 2>&1; then pkg_manager="dnf"; fi
                echo_blue "Detected Fedora/RHEL based system. Attempting installation with $pkg_manager."
                if [ -n "$SUDO_PREFIX" ]; then echo_blue "You might be prompted for your sudo password."; fi
                if [ "$command_to_check" == "node" ]; then
                    echo_blue "Attempting to install Node.js and npm..."
                    ${SUDO_PREFIX}"$pkg_manager" install -y nodejs npm # nodejs on dnf often includes npm
                elif [ "$command_to_check" == "npm" ] && [ "$package_to_install" == "npm" ]; then
                     ${SUDO_PREFIX}"$pkg_manager" install -y npm
                elif [ "$command_to_check" == "psql" ]; then
                    ${SUDO_PREFIX}"$pkg_manager" install -y postgresql # 'postgresql' package usually provides client tools
                fi
            else
                echo_red "Could not determine package manager for Linux."
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew >/dev/null 2>&1; then
                echo_blue "Detected macOS. Attempting installation with Homebrew."
                if [ "$command_to_check" == "node" ]; then # brew install node installs npm too
                    brew install node
                elif [ "$command_to_check" == "npm" ] && [ "$package_to_install" == "npm" ]; then
                    echo_blue "npm is installed with Node.js via Homebrew. If 'brew install node' succeeded, npm should be available."
                elif [ "$command_to_check" == "psql" ]; then
                    brew install postgresql
                    echo_blue "Homebrew installs PostgreSQL server and client. Ensure server is running if needed (e.g., 'brew services start postgresql')."
                fi
            else
                echo_red "Homebrew not found on macOS. Please install Homebrew first: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            fi
        else
            echo_red "Unsupported OS for automatic installation: $OSTYPE."
        fi

        # Re-check after attempting installation
        if ! command -v "$command_to_check" >/dev/null 2>&1; then
            echo_red "Failed to install $human_readable_name automatically or $command_to_check is still not in PATH."
            if [ "$command_to_check" == "node" ]; then echo_red "Please install Node.js (which includes npm) manually. Instructions: $install_instructions_node"; fi
            if [ "$command_to_check" == "psql" ]; then echo_red "Please install PostgreSQL client (psql) manually. Instructions: $install_instructions_psql"; fi
            exit 1
        else
            echo_green "$human_readable_name ($command_to_check) seems to be installed now."
        fi
    else
        echo_green "$human_readable_name ($command_to_check) found."
    fi
}

# Check for Node.js
attempt_install "nodejs" "node" "Node.js"

# Check for npm (Node Package Manager)
attempt_install "npm" "npm" "npm"

# Check for psql (PostgreSQL client)
attempt_install "postgresql-client" "psql" "PostgreSQL client (psql)"

echo_green "All critical dependencies checked and/or installation attempted."


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
BACKEND_PORT_CONFIG=${BACKEND_PORT:-3001} # Use a different variable name to avoid conflict with exported PORT for frontend

# Frontend Port (Fixed to 9000 as per requirements)
FRONTEND_PORT_CONFIG=9000

# Export environment variables for backend and other scripts
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"
export PGDATABASE="$DB_NAME"
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export JWT_SECRET="$JWT_SECRET"
export PORT="$BACKEND_PORT_CONFIG" # Port for the backend server

echo_green "Environment variables set for this session."

# --- Database Setup ---
echo_blue "Attempting to set up PostgreSQL database '$DB_NAME' for user '$DB_USER'..."

# Check if database exists
echo_blue "Checking if database '$DB_NAME' exists..."
if run_as_pg psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo_green "Database '$DB_NAME' already exists. Skipping creation steps."
else
  echo_blue "Database '$DB_NAME' does not exist. Proceeding with setup..."
  if [ "$(id -u)" -ne 0 ]; then # Only show sudo prompt warning if not root
    echo_blue "You might be prompted for your system password for 'sudo -u postgres' commands or equivalent."
  fi
  echo_blue "Example manual commands (run as postgres user or with 'sudo -u postgres psql' / 'su - postgres -c "psql ..."'):"
  echo_blue "  CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD';"
  echo_blue "  CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
  echo_blue "  GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";"
  
  set +e # Temporarily disable exit on error for db setup steps that might gracefully fail

  DB_PASSWORD_ESCAPED=${DB_PASSWORD//\'/\'\'} # Corrected: Escape single quotes in password for SQL

  echo_blue "Attempting to create user '$DB_USER' (if not exists)..."
  # Check if user exists before attempting to create
  # Use -v for variable to prevent SQL injection on DB_USER
  if run_as_pg psql -v v_db_user="$DB_USER" -tc "SELECT 1 FROM pg_roles WHERE rolname = :'v_db_user'" | grep -q 1; then
    echo_yellow "User '$DB_USER' already exists. Attempting to update password."
    run_as_pg psql -c "ALTER USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD_ESCAPED';"
    if [ $? -ne 0 ]; then echo_red "Failed to update password for user '$DB_USER'. Check logs."; else echo_green "Password updated for user '$DB_USER'."; fi
  else
    run_as_pg psql -c "CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD_ESCAPED';"
    if [ $? -ne 0 ]; then echo_red "Failed to create user '$DB_USER'. Manual intervention may be required."; else echo_green "User '$DB_USER' created successfully."; fi
  fi

  echo_blue "Attempting to create database '$DB_NAME' owned by '$DB_USER' (if not exists)..."
  run_as_pg createdb -O "$DB_USER" "$DB_NAME"
  DB_CREATION_STATUS=$?
  if [ $DB_CREATION_STATUS -ne 0 ]; then
    echo_yellow "Failed to create database '$DB_NAME' owned by '$DB_USER' (Code: $DB_CREATION_STATUS). This might be because it exists or other reasons."
    echo_blue "Attempting to create database '$DB_NAME' by 'postgres' user (if not exists) and grant privileges later..."
    run_as_pg createdb "$DB_NAME"
    DB_CREATION_FALLBACK_STATUS=$?
    if [ $DB_CREATION_FALLBACK_STATUS -ne 0 ]; then
        echo_yellow "Failed to create database '$DB_NAME' as 'postgres' user (Code: $DB_CREATION_FALLBACK_STATUS). It might already exist or other issues occurred."
    else
        echo_green "Database '$DB_NAME' created by 'postgres' user."
    fi
  else
    echo_green "Database '$DB_NAME' created successfully and owned by '$DB_USER'."
  fi
  
  echo_blue "Attempting to grant all privileges to '$DB_USER' on '$DB_NAME' (if needed)..."
  run_as_pg psql -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";"
  GRANT_STATUS=$?
  if [ $GRANT_STATUS -ne 0 ]; then
      echo_yellow "Could not grant all privileges on '$DB_NAME' to '$DB_USER' (Code: $GRANT_STATUS). This may be okay if user owns the database or has privileges via other means. Check manually if issues arise."
  else
      echo_green "All privileges granted to '$DB_USER' on '$DB_NAME'."
  fi
  
  set -e # Re-enable exit on error
fi

# Initialize database schema
INIT_SQL_PATH="backend/db/init.sql"
if [ -f "$INIT_SQL_PATH" ]; then
  echo_blue "Initializing database schema from $INIT_SQL_PATH..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$INIT_SQL_PATH"
  echo_green "Database schema initialized."
else
  echo_red "$INIT_SQL_PATH not found. Skipping schema initialization."
fi

# --- Backend Setup --- 
echo_blue "Setting up backend..."
if [ ! -d "backend" ]; then echo_red "'backend' directory not found!"; exit 1; fi
cd backend
if [ ! -f "package.json" ]; then echo_red "'backend/package.json' not found!"; exit 1; fi
npm install
echo_green "Backend dependencies installed."

# Start backend server in the background
echo_blue "Starting backend server on port $BACKEND_PORT_CONFIG..."
# Create a .env file for the backend if it doesn't exist
cat << EOF > .env
PGUSER=$DB_USER
PGHOST=$DB_HOST
PGDATABASE=$DB_NAME
PGPASSWORD=$DB_PASSWORD
PGPORT=$DB_PORT
JWT_SECRET=$JWT_SECRET
PORT=$BACKEND_PORT_CONFIG
EOF
echo_green "Backend .env file created/updated."

# Ensure logs directory exists if backend tries to write logs there
# mkdir -p logs

npm start &
BACKEND_PID=$!
echo_green "Backend server started with PID $BACKEND_PID."
cd ..

# --- Frontend Setup --- 
echo_blue "Setting up frontend..."
if [ ! -d "frontend" ]; then echo_red "'frontend' directory not found!"; exit 1; fi
cd frontend
if [ ! -f "package.json" ]; then echo_red "'frontend/package.json' not found!"; exit 1; fi
npm install
echo_green "Frontend dependencies installed."

# Start frontend server on port 9000
echo_blue "Starting frontend server on port $FRONTEND_PORT_CONFIG..."
# Create a .env file for the frontend if it doesn't exist, to specify API URL
REACT_APP_API_URL="http://localhost:$BACKEND_PORT_CONFIG/api"
cat << EOF > .env
REACT_APP_API_URL=$REACT_APP_API_URL
PORT=$FRONTEND_PORT_CONFIG
EOF

echo_green "Frontend .env file created/updated."

echo_blue "To run frontend on port $FRONTEND_PORT_CONFIG, ensure your frontend's package.json start script respects the PORT environment variable or is configured for port $FRONTEND_PORT_CONFIG."

# Attempt to start with PORT variable, common for many Node.js frontends
PORT=$FRONTEND_PORT_CONFIG npm start &
FRONTEND_PID=$!
echo_green "Frontend server started with PID $FRONTEND_PID."
cd ..

# Trap to clean up background processes on script exit
cleanup() {
    echo_blue "\nShutting down servers..."
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
        echo_green "Backend server (PID $BACKEND_PID) stopped."
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
        echo_green "Frontend server (PID $FRONTEND_PID) stopped."
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

echo_blue "\n--- Application Setup Complete ---
Backend API should be running at: http://localhost:$BACKEND_PORT_CONFIG
Frontend should be running at: http://localhost:$FRONTEND_PORT_CONFIG

Press Ctrl+C to stop all servers and exit this script.
"

# Keep script running and wait for background processes
# Wait for PIDs individually to handle cases where one might exit before the other
# If one exits, the script will continue until the other exits or script is terminated.
BACKEND_WAIT_STATUS=0
FRONTEND_WAIT_STATUS=0

if [ -n "$BACKEND_PID" ]; then
    wait "$BACKEND_PID" || BACKEND_WAIT_STATUS=$?
    if [ "$BACKEND_WAIT_STATUS" -ne 0 ]; then 
        echo_red "Backend server (PID $BACKEND_PID) exited unexpectedly with status $BACKEND_WAIT_STATUS."
    fi
else
    echo_yellow "Backend server was not started or PID not captured."
fi

if [ -n "$FRONTEND_PID" ]; then
    wait "$FRONTEND_PID" || FRONTEND_WAIT_STATUS=$?
    if [ "$FRONTEND_WAIT_STATUS" -ne 0 ]; then 
        echo_red "Frontend server (PID $FRONTEND_PID) exited unexpectedly with status $FRONTEND_WAIT_STATUS."
    fi
else
    echo_yellow "Frontend server was not started or PID not captured."
fi

echo_blue "All servers have been shut down."
