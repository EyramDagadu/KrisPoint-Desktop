@echo off
echo ========================================
echo KrisPoint Medical - Production Server
echo ========================================
echo.

:: Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if not exist "build\index.js" (
    echo ERROR: Build folder not found!
    echo Please run build.bat first.
    pause
    exit /b 1
)

:: Create logs directory
if not exist "logs" mkdir logs

echo Starting services...
echo.

:: Start Ollama AI service (if installed)
where ollama >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Starting Ollama AI service...
    start "Ollama AI Service" /MIN cmd /c "ollama serve"
    timeout /t 3 /nobreak >nul
    echo       Ollama started on port 11434
) else (
    echo [1/3] Ollama not found - AI refinement will be unavailable
    echo       Install Ollama from https://ollama.com
)

:: Start Voice Recognition Server using the existing batch file
if exist "vosk-server\START_VOICE_SERVER.bat" (
    echo [2/3] Starting Voice Recognition server on port 8000...
    start "Voice Recognition Server" cmd /c "cd /d "%SCRIPT_DIR%vosk-server" & START_VOICE_SERVER.bat"
    timeout /t 5 /nobreak >nul
    echo       Voice server window opened
) else (
    echo [2/3] Voice server not found - voice recognition will be unavailable
)

:: Load environment variables from .env if it exists
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

:: Apply the Hospital PostgreSQL rollout before starting the web server.
:: Solo uses SQLite and must not run the PostgreSQL migration.
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

:: Start main web server
echo [3/3] Starting KrisPoint web server on port 5000...
echo.
echo ========================================
echo All services started!
echo.
echo Access the application at:
echo   http://localhost:5000
echo   http://192.168.1.1:5000 (LAN)
echo.
echo Services running:
echo   - Web Server: port 5000 (this window)
echo   - Voice Server: port 8000 (separate window)
echo   - Ollama AI: port 11434 (separate window)
echo.
echo Press Ctrl+C to stop the web server.
echo Use stop.bat to stop all services.
echo ========================================
echo.

set NODE_ENV=production
set PORT=5000
node build\index.js
