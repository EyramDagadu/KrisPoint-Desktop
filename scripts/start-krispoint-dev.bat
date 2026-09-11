@echo off
title KrisPoint Medical - Development Mode
color 0B

echo ============================================
echo   KrisPoint Medical - Development Mode
echo ============================================
echo.

REM Set working directory to KrisPoint root
cd /d "%~dp0.."

REM Configure services for network access
set OLLAMA_HOST=0.0.0.0
set OLLAMA_ORIGINS=*
set VOICE_HOST=0.0.0.0
set VOICE_PORT=8000

REM Configure Web Server port
set PORT=5000
set HOST=0.0.0.0

echo [1/3] Starting Ollama AI Service...
start "Ollama AI" cmd /c "ollama serve"
timeout /t 3 /nobreak >nul
echo       Ollama started on port 11434

echo.
echo [2/3] Starting Voice Recognition Server...
cd vosk-server
start "Voice Server" cmd /c "START_VOICE_SERVER.bat"
cd ..
timeout /t 2 /nobreak >nul
echo       Voice server started on port 8000

echo.
echo [3/3] Starting KrisPoint Dev Server...
echo       Running on port 5000 with hot reload...
echo.
echo ============================================
echo   Services Running:
echo   - Web:   http://localhost:5000
echo   - Voice: ws://localhost:8000
echo   - AI:    http://localhost:11434
echo ============================================
echo.

npm run dev

echo.
echo All services stopped. Goodbye!
pause
