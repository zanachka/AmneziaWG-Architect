@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM AmneziaWG Architect — Local Server Launcher (Windows CMD)
REM Запускает serve.ps1 через PowerShell
REM ─────────────────────────────────────────────────────────────────────────
setlocal

set "SCRIPT_DIR=%~dp0"
set "PORT=%1"
if "%PORT%"=="" set "PORT=8080"

where pwsh >nul 2>&1
if %errorlevel%==0 (
    pwsh -ExecutionPolicy Bypass -File "%SCRIPT_DIR%serve.ps1" -Port %PORT%
    exit /b %errorlevel%
)

where powershell >nul 2>&1
if %errorlevel%==0 (
    powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%serve.ps1" -Port %PORT%
    exit /b %errorlevel%
)

echo [FAIL] PowerShell not found. Install PowerShell or run serve.ps1 manually.
exit /b 1
