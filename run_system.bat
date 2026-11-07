@echo off
title AI Smart Attendance System Launcher
echo ======================================================================
echo    AI-Powered Smart Attendance System (7th-Sem B.Tech CSE Project)
echo ======================================================================
echo.
echo [1/3] Initializing Backend (FastAPI + Biometric AI Engine + Built SPA)...
start "Attendance Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

where npm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [2/3] Initializing Frontend Dev Server (Vite + React SPA)...
    start "Attendance Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
    timeout /t 3 /nobreak >nul
    echo [3/3] Opening Web Portal in Default Browser...
    start "" "http://localhost:5173"
    set PORTAL_URL=http://localhost:5173
) else (
    echo [2/3] Node/NPM not detected in PATH; using built SPA directly via FastAPI Backend...
    timeout /t 3 /nobreak >nul
    echo [3/3] Opening Web Portal in Default Browser...
    start "" "http://localhost:8000"
    set PORTAL_URL=http://localhost:8000
)

echo.
echo ======================================================================
echo System successfully launched!
echo - Web Application:   %PORTAL_URL%
echo - API Documentation: http://localhost:8000/docs
echo.
echo Demo Admin Login:    admin@college.edu / admin123
echo Demo Faculty Login:  faculty@college.edu / faculty123
echo Demo Student Login:  2103001 / student123
echo ======================================================================
echo Keep the backend terminal window open while using the app.
pause
