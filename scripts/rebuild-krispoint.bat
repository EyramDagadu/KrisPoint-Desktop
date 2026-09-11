@echo off
title KrisPoint Medical - Rebuild
color 0E

echo ============================================
echo   KrisPoint Medical - Rebuilding App
echo ============================================
echo.

cd /d "%~dp0.."

echo Cleaning old build...
if exist "build" rmdir /s /q build

echo.
echo Building fresh...
call npm run build

echo.
echo ============================================
echo   Build complete! Run start-krispoint.bat
echo ============================================
pause
