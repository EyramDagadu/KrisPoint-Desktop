@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-local-windows.ps1"
if errorlevel 1 (
    echo.
    echo KrisPoint setup did not complete.
    pause
    exit /b 1
)

echo.
echo KrisPoint setup completed successfully.
pause