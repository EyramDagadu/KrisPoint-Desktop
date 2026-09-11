@echo off
title KrisPoint Medical - Server Launcher
color 0A

echo ============================================
echo     KrisPoint Medical - Starting Services
echo ============================================
echo.

REM Get script directory and go to parent (KrisPoint root)
cd /d "%~dp0"
cd ..

REM Store current directory as root
set "KRISPOINT=%CD%"
echo KrisPoint folder: %KRISPOINT%
echo.

REM Configure environment
set OLLAMA_HOST=0.0.0.0
set OLLAMA_ORIGINS=*
set VOICE_HOST=0.0.0.0
set VOICE_PORT=8000
set PORT=5000
set HOST=0.0.0.0

echo [1/3] Starting Ollama AI Service...
start "Ollama AI" cmd /c "ollama serve"
timeout /t 3 /nobreak >nul
echo       Ollama started on port 11434

echo.
echo [2/3] Starting Voice Recognition Server...
start "Voice Server" cmd /c "cd /d "%KRISPOINT%\vosk-server" && START_VOICE_SERVER.bat"
timeout /t 2 /nobreak >nul
echo       Voice server started on port 8000

echo.
echo [3/3] Starting KrisPoint Web Server...

if exist "%KRISPOINT%\ssl\cert.pem" (
    echo       HTTPS mode enabled
) else (
    echo       HTTP mode
)

echo.
cd /d "%KRISPOINT%"
node server-https.js
pause
