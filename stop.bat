@echo off
echo ========================================
echo KrisPoint Medical - Stop All Services
echo ========================================
echo.

echo Stopping Node.js web server...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Node.js stopped
) else (
    echo   Node.js was not running
)

echo Stopping Python voice server...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Python stopped
) else (
    echo   Python was not running
)

echo Stopping Ollama AI service...
taskkill /F /IM ollama.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Ollama stopped
) else (
    echo   Ollama was not running
)

echo.
echo ========================================
echo All KrisPoint services stopped.
echo ========================================
pause
