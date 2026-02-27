#!/bin/bash

# Quick Setup Script for Linux/Mac
# Run this script from the project root directory: ./setup.sh
# Make executable first: chmod +x setup.sh

echo "========================================"
echo "  SafeLanka Setup Script"
echo "========================================"
echo ""

# Check Python installation
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ $PYTHON_VERSION found"
else
    echo "✗ Python not found. Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

# Check Node.js installation
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION found"
else
    echo "✗ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo ""
echo "========================================"
echo "  Setting up Backend"
echo "========================================"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend/server
pip3 install -r ../requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ Failed to install Python dependencies"
    exit 1
fi
echo "✓ Python dependencies installed"

# Run migrations
echo "Running database migrations..."
python3 manage.py migrate

if [ $? -ne 0 ]; then
    echo "✗ Database migration failed"
    exit 1
fi
echo "✓ Database migrations completed"

# Create admin user
echo "Creating admin user..."
python3 create_admin.py
echo "✓ Admin user ready"

# Import crime data
echo "Importing crime data..."
python3 import_crime_data.py
echo "✓ Crime data imported"

echo ""
echo "========================================"
echo "  Setting up Frontend"
echo "========================================"
echo ""

# Install Node dependencies
cd ../../frontend/safelanka-frontend
echo "Installing Node.js dependencies (this may take a few minutes)..."
npm install

if [ $? -ne 0 ]; then
    echo "✗ Failed to install Node.js dependencies"
    exit 1
fi
echo "✓ Node.js dependencies installed"

# Return to project root
cd ../..

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend (in one terminal):"
echo "   cd backend/server"
echo "   python3 manage.py runserver 8002"
echo ""
echo "2. Start Frontend (in another terminal):"
echo "   cd frontend/safelanka-frontend"
echo "   npm run dev"
echo ""
echo "Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Access Points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8002"
echo "   Admin Panel: http://localhost:8002/admin"
echo ""
