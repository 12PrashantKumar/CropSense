@echo off
setlocal
title CropSense Startup

echo.
echo  =========================================
echo   CropSense  ^|  Starting Application
echo  =========================================
echo.

REM ── Check model file ──────────────────────────────────────────────
if not exist "model\crop_disease_model.keras" (
    echo  [ERROR] Model file missing: model\crop_disease_model.keras
    echo.
    echo  Fix options:
    echo    1. Copy crop_disease_model.keras into the model\ folder
    echo    2. Run:  python setup.py --train   (needs dataset^)
    echo.
    pause
    exit /b 1
)

if not exist "model\class_indices.json" (
    echo  [ERROR] Class indices missing: model\class_indices.json
    echo  Copy this file from the machine where the model was trained.
    echo.
    pause
    exit /b 1
)

echo  [OK] Model files found.
echo.

REM ── Start Backend ─────────────────────────────────────────────────
echo  Starting backend on http://localhost:8000 ...
start "CropSense Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM ── Start Frontend ────────────────────────────────────────────────
echo  Starting frontend on http://localhost:3000 ...
start "CropSense Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo  Open your browser at:  http://localhost:3000
echo.
pause
