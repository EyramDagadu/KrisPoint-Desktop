@echo off
echo ========================================
echo KrisPoint Medical - Production Build
echo ========================================
echo.

echo Installing dependencies...
call pnpm install --frozen-lockfile
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pnpm install failed
    pause
    exit /b 1
)

echo.
echo Building for production...
call pnpm run build:hospital
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo.
echo Output folder: artifacts/krispoint/build/
echo.
echo To run the production server:
echo   node artifacts/krispoint/build/index.js
echo ========================================
pause
