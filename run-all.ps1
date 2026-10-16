Write-Host "========================================================" -ForegroundColor Green
Write-Host "Starting Leaf Identification System (All Services)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/3] Starting AI Service (FastAPI) on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\ai-service'; & '.\venv\Scripts\Activate.ps1'; uvicorn main:app --reload --port 8000"

Write-Host "[2/3] Starting Backend Server (Express) on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npm run dev"

Write-Host "[3/3] Starting Frontend (React + Vite) on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Write-Host "`nAll 3 services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "Frontend:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:    http://localhost:5000" -ForegroundColor Yellow
Write-Host "AI Service: http://localhost:8000/docs" -ForegroundColor Yellow
