@echo off
REM KrisPoint Voice Recognition Server Launcher
REM This starts the WebSocket server for GPU-accelerated medical speech recognition

echo ========================================
echo  KrisPoint Voice Recognition Server
echo ========================================
echo.

cd /d "%~dp0"
set "VENV_PYTHON=%~dp0.venv\Scripts\python.exe"

REM Check if Python 3.10 is installed
if not exist "%VENV_PYTHON%" (
    echo Voice dependencies are not installed yet.
    call "%~dp0INSTALL_DEPENDENCIES.bat"
    if errorlevel 1 exit /b 1
)
if not exist "%VENV_PYTHON%" (
    echo ERROR: Python 3.11 environment is not installed
    echo.
    echo Please install Python 3.11 from python.org
    echo.
    pause
    exit /b 1
)

echo [1/4] Python 3.11 environment:
"%VENV_PYTHON%" --version
echo.

REM Check if .env file exists (optional for faster-whisper)
if not exist ".env" (
    echo [2/4] Creating .env from .env.example...
    copy ".env.example" ".env" >nul
    echo Edit .env and add HF_TOKEN before first MedASR download.
    pause
    exit /b 1
) else (
    echo [2/4] Configuration file found
)
echo.

REM Check if dependencies are installed
echo [3/4] Checking Python dependencies...
"%VENV_PYTHON%" -c "import faster_whisper; import torch; import transformers; import websockets" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Dependencies are incomplete. Run INSTALL_DEPENDENCIES.bat.
    pause
    exit /b 1
) else (
    echo Dependencies OK
)
echo.

REM Get local IP address for user
echo [4/4] Starting voice recognition server...
echo.
echo Your computer's IP address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo %%a
)
echo.
echo KrisPoint connects locally at ws://127.0.0.1:8000
echo.
echo ========================================
echo  Server Starting - DO NOT CLOSE
echo ========================================
echo.

REM Start the server with the isolated Python environment
cd src
"%VENV_PYTHON%" websocket_server.py

REM If server exits, pause to show error
echo.
echo ========================================
echo Server stopped
echo ========================================
pause
