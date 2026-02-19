# Quick Setup Script for Windows PowerShell
# Run this script from the project root directory: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeLanka Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✓ $pythonVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Red
    exit 1
}

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend\server
pip install -r ..\requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python dependencies installed" -ForegroundColor Green

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database migrations completed" -ForegroundColor Green

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Yellow
python create_admin.py
Write-Host "✓ Admin user ready" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install Node dependencies
Set-Location ..\..\frontend\safelanka-frontend
Write-Host "Installing Node.js dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green

# Return to project root
Set-Location ..\..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend (in one terminal):" -ForegroundColor Cyan
Write-Host "   cd backend\server" -ForegroundColor White
Write-Host "   python manage.py runserver 8002" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Frontend (in another terminal):" -ForegroundColor Cyan
Write-Host "   cd frontend\safelanka-frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8002" -ForegroundColor White
Write-Host "   Admin Panel: http://localhost:8002/admin" -ForegroundColor White
Write-Host ""
