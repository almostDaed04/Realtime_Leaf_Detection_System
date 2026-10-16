@echo off
title Leaf Identification System Runner
echo ========================================================
echo Starting Leaf Identification System (All Services)
echo ========================================================
echo.

echo [1/3] Starting AI Service (FastAPI) on http://localhost:8000 ...
start "LeafScan - AI Service (Port 8000)" cmd /k "cd /d %~dp0ai-service && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Backend Server (Express) on http://localhost:5000 ...
start "LeafScan - Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Starting Frontend (React + Vite) on http://localhost:5173 ...
start "LeafScan - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo All 3 services have been launched in separate windows!
echo - Frontend:   http://localhost:5173
echo - Backend:    http://localhost:5000
echo - AI Service: http://localhost:8000/docs
echo ========================================================
echo.
pause
