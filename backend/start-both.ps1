# PowerShell script to start both backend services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Both Backend Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start ML API in a new window
Write-Host "Starting ML API in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-ml-api.ps1"

# Wait a bit for ML API to start
Start-Sleep -Seconds 3

# Start Node API in a new window
Write-Host "Starting Node API in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-node-api.ps1"

Write-Host ""
Write-Host "Both services are starting in separate windows." -ForegroundColor Green
Write-Host "ML API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Node API: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

