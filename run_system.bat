@echo off
title AI Smart Attendance System Launcher
echo ======================================================================
echo    AI-Powered Smart Attendance System (7th-Sem B.Tech CSE Project)
echo ======================================================================
echo.
echo [1/3] Initializing Backend (FastAPI + Biometric AI Engine)...
start "Attendance Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Initializing Frontend (Vite + React SPA)...
start "Attendance Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [3/3] Opening Web Portal in Default Browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ======================================================================
echo System successfully launched!
echo - Web Application:   http://localhost:5173
echo - API Documentation: http://localhost:8000/docs
echo.
echo Demo Faculty Login:  faculty@college.edu / faculty123
echo Demo Student Login:  2021CSE042 / student123
echo ======================================================================
echo Keep the backend and frontend terminal windows open while using the app.
pause
