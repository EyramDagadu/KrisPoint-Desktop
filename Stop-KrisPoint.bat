@echo off
REM ========================================
REM  KrisPoint Service Shutdown
REM  Cleanly stops only KrisPoint services
REM ========================================

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo.
echo ========================================
echo  KrisPoint - Stopping Services
echo ========================================
echo.

REM ----------------------------------------
REM Stop Web App (only the one on port 5000)
REM ----------------------------------------
echo [1/3] Stopping web application (port 5000)...

REM Find the PID of the process listening on port 5000 and kill only that
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    set WEB_PID=%%a
)

if defined WEB_PID (
    taskkill /F /PID %WEB_PID% /T >nul 2>&1
    if errorlevel 1 (
        echo       Could not stop process on port 5000
    ) else (
        echo       Web application stopped (PID: %WEB_PID%)
    )
) else (
    echo       No process found on port 5000
)

REM ----------------------------------------
REM Stop Voice Server (only port 8000)
REM ----------------------------------------
echo [2/3] Stopping voice recognition server (port 8000)...

REM Find the PID of the process listening on port 8000 and kill only that
set VOICE_PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    set VOICE_PID=%%a
)

if defined VOICE_PID (
    taskkill /F /PID %VOICE_PID% /T >nul 2>&1
    if errorlevel 1 (
        echo       Could not stop process on port 8000
    ) else (
        echo       Voice server stopped (PID: %VOICE_PID%)
    )
) else (
    echo       No process found on port 8000
)

REM ----------------------------------------
REM Ollama (leave running)
REM ----------------------------------------
echo [3/3] Ollama AI service...
echo       Leaving Ollama running (shared service)
echo       To stop manually: taskkill /F /IM ollama.exe
echo.

echo ========================================
echo  KrisPoint services stopped
echo ========================================
echo.
pause
