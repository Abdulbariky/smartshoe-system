#!/bin/bash

# Kill any existing process on port 5000
echo "Stopping any existing processes on port 5000..."
sudo kill -9 $(sudo lsof -t -i:5000) 2>/dev/null || true

# Activate virtual environment
source venv/bin/activate

# Set production environment
export FLASK_ENV=production

# Start gunicorn
echo "Starting Gunicorn server..."
gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile - --error-logfile - wsgi:app