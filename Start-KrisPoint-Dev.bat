@echo off
REM ========================================
REM  KrisPoint Development Launcher
REM  Starts all 3 services with one click
REM ========================================

REM Change to the directory where this batch file is located
cd /d "%~dp0"

title KrisPoint - Starting Services...

echo.
echo ========================================
echo  KrisPoint Medical - Development Mode
echo ========================================
echo.

REM ----------------------------------------
REM Pre-flight checks
REM ----------------------------------------
echo Checking configuration...

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo [ERROR] .env file not found!
    echo.
    echo Please create a .env file with:
    echo   DATABASE_URL=postgresql://user:password@localhost:5432/krispoint
    echo   ENCRYPTION_KEY=your_64_character_hex_key
    echo.
    echo You can copy .env.example to .env and edit it.
    echo.
    pause
    exit /b 1
)
echo   .env file found

REM Clear Vite cache to prevent chunk errors on Windows
if exist "node_modules\.vite" (
    echo   Clearing Vite cache in node_modules...
    rmdir /s /q "node_modules\.vite" >nul 2>&1
)
if exist ".vite" (
    echo   Clearing Vite cache in root...
    rmdir /s /q ".vite" >nul 2>&1
)

echo.
echo Starting all services...
echo.

REM Get local IP address
echo Your computer's IP address(es):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo   %%a
)
echo.

REM ----------------------------------------
REM Step 1: Check and Start Ollama (AI)
REM ----------------------------------------
echo [1/3] Checking Ollama AI service...

REM Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>nul | find /I "ollama.exe" >nul
if errorlevel 1 (
    echo       Ollama not running. Attempting to start...
    
    REM Try to start Ollama if it's installed
    where ollama >nul 2>&1
    if errorlevel 1 (
        echo.
        echo       [WARNING] Ollama not found on PATH.
        echo       AI refinement features will be unavailable.
        echo       Download from: https://ollama.com
        echo.
    ) else (
        start /min "Ollama Server" ollama serve
        echo       Starting Ollama server...
        timeout /t 3 /nobreak >nul
        
        REM Check if mistral model is available
        ollama list 2>nul | find /I "mistral" >nul
        if errorlevel 1 (
            echo       [INFO] Mistral model not found. Pulling now...
            echo       This may take a few minutes on first run.
            start /wait ollama pull mistral:7b
        )
        echo       Ollama ready with Mistral 7B
    )
) else (
    echo       Ollama already running
)
echo.

REM ----------------------------------------
REM Step 2: Start Voice Recognition Server
REM ----------------------------------------
echo [2/3] Starting Voice Recognition Server...

REM Check if Python 3.10 is installed
py -3.10 --version >nul 2>&1
if errorlevel 1 (
    echo       [WARNING] Python 3.10 not found.
    echo       Voice recognition will be unavailable.
    echo       Install Python 3.10 from python.org
    echo.
) else (
    REM Check if voice server is already running on port 8000
    netstat -an | find ":8000" | find "LISTENING" >nul
    if errorlevel 1 (
        REM Start voice server in minimized window
        pushd vosk-server\src
        start /min "KrisPoint Voice Server" py -3.10 websocket_server.py
        popd
        echo       Voice server starting on port 8000...
        timeout /t 2 /nobreak >nul
    ) else (
        echo       Voice server already running on port 8000
    )
)
echo.

REM ----------------------------------------
REM Step 3: Start Web Application
REM ----------------------------------------
echo [3/3] Starting KrisPoint Web Application...

REM Check if port 5000 is already in use
netstat -an | find ":5000" | find "LISTENING" >nul
if not errorlevel 1 (
    echo.
    echo       [WARNING] Port 5000 is already in use!
    echo       KrisPoint may already be running.
    echo       Run Stop-KrisPoint.bat first, then try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  All services starting!
echo ========================================
echo.
echo  Web App:    http://localhost:5000
echo  Voice:      ws://localhost:8000
echo  Ollama AI:  http://localhost:11434
echo.
echo  For network access, use your IP address
echo  instead of localhost.
echo.
echo ========================================
echo  DO NOT CLOSE THIS WINDOW
echo  Press Ctrl+C to stop the web server
echo ========================================
echo.

REM Start the development server (this blocks)
npm run dev

REM If we get here, the server was stopped
echo.
echo Web server stopped.
echo.
echo To stop all services, run: Stop-KrisPoint.bat
pause
