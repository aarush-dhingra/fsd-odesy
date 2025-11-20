# PowerShell script to start Node API
Write-Host "Starting Node API..." -ForegroundColor Green

# Navigate to Node API directory
Set-Location -Path "$PSScriptRoot\node-api"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with the following variables:" -ForegroundColor Yellow
    Write-Host "  MONGODB_URI=your_mongodb_connection_string" -ForegroundColor Cyan
    Write-Host "  JWT_SECRET=your_jwt_secret_key" -ForegroundColor Cyan
    Write-Host "  ML_API_BASE_URL=http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  PORT=5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to continue anyway..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Start the server
Write-Host "Starting Node API on http://localhost:5000" -ForegroundColor Green
npm run dev

