# PowerShell script to start ML API
Write-Host "Starting ML API..." -ForegroundColor Green

# Navigate to ML API directory
Set-Location -Path "$PSScriptRoot\ml-api"

# Check if virtual environment exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
pip show fastapi | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Start the server
Write-Host "Starting ML API on http://localhost:8000" -ForegroundColor Green
uvicorn main:app --reload --port 8000

