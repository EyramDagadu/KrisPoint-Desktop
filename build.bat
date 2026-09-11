@echo off
echo ========================================
echo KrisPoint Medical - Production Build
echo ========================================
echo.

echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Building for production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo.
echo Output folder: build/
echo.
echo To run the production server:
echo   node build/index.js
echo ========================================
pause
