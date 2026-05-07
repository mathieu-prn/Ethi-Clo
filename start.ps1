#!/usr/bin/env pwsh

# Ethi-Clo Startup Script for PowerShell

Write-Host "Starting Ethi-Clo Development Environment..." -ForegroundColor Green
Write-Host ""

# Ensure we're in the project root
Push-Location $PSScriptRoot

# Install Python dependencies if not already installed
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow
$env:Path = "$PSScriptRoot\venv\Scripts;$env:Path"
python -m pip install -q -r requirements.txt

# Start Flask backend in a new PowerShell window
Write-Host "Starting Flask backend on localhost:5000..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit -Command {`n  cd '$PSScriptRoot'`n  & '$PSScriptRoot\venv\Scripts\python.exe' app.py`n}"

# Wait for backend to start
Start-Sleep -Seconds 2

# Start Vite frontend in a new PowerShell window
Write-Host "Starting Vite frontend on localhost:5173..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit -Command {`n  cd '$PSScriptRoot\front'`n  npm run dev`n}"

Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure your .env file contains GEMINI_API_KEY" -ForegroundColor Yellow

Pop-Location
