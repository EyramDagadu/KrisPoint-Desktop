@echo off
:: KrisPoint Voice Server - Dependency Installer
:: Run this ONCE after installing KrisPoint to set up the voice recognition system

echo ========================================
echo KrisPoint Voice Server Setup
echo ========================================
echo.

:: Create an isolated environment with the supported Python.
echo [1/4] Checking for Python 3.11...
py -3.11 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python 3.11 (64-bit) not found!
    echo.
    echo Please install Python 3.10 or later from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

py -3.11 --version
echo Python found!
echo.

cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo Creating isolated voice environment...
    py -3.11 -m venv ".venv"
    if errorlevel 1 exit /b 1
)
set "VENV_PYTHON=%~dp0.venv\Scripts\python.exe"

:: Install dependencies
echo [2/4] Installing voice recognition packages...
echo This may take a few minutes...
echo.

"%VENV_PYTHON%" -m pip install --upgrade pip
"%VENV_PYTHON%" -m pip install -r "%~dp0requirements.txt"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo [3/4] Verifying installation...
"%VENV_PYTHON%" -c "import faster_whisper; import torch; import transformers; import websockets; print('All packages installed successfully!')"

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Some packages may not have installed correctly.
    echo Please try running this script again.
    pause
    exit /b 1
)
echo [4/4] Voice environment ready.
echo Edit "%~dp0.env" and add HF_TOKEN before first MedASR download.
exit /b 0

echo.
echo ========================================
echo SUCCESS! Voice server is ready to use.
echo ========================================
echo.
echo You can now close this window and start KrisPoint.
echo The voice recognition will work automatically.
echo.
pause
