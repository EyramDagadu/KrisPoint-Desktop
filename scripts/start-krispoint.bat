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

REM Load non-secret startup configuration, including the edition selector.
REM Secrets remain in the process environment and are never printed.
if exist "%KRISPOINT%\.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%KRISPOINT%\.env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

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
if /I not "%VITE_KRISPOINT_EDITION%"=="solo" (
    echo Applying Hospital database migration...
    call npm run db:migrate:hospital
    if errorlevel 1 (
        echo ERROR: Hospital database migration failed. Web server not started.
        pause
        exit /b 1
    )
) else (
    echo Solo edition detected - skipping Hospital PostgreSQL migration.
)

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
