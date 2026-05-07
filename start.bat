@echo off
REM Ethi-Clo Startup Script

echo Starting Ethi-Clo Development Environment...
echo.

REM Check if Python virtual environment is activated
cd /d "%~dp0"

REM Start Flask backend
echo Starting Flask backend on localhost:5000...
start "Flask Backend" python app.py

REM Wait a moment for the backend to start
timeout /t 2 /nobreak

REM Start Vite frontend
echo Starting Vite frontend on localhost:5173...
start "Vite Frontend" cmd /k "cd front && npm run dev"

echo.
echo Both servers are starting!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:5000
echo.
pause
