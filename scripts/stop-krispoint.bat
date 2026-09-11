@echo off
title KrisPoint Medical - Stopping Services
color 0C

echo ============================================
echo   KrisPoint Medical - Stopping All Services
echo ============================================
echo.

echo Stopping Voice Server...
taskkill /FI "WINDOWTITLE eq Voice Server*" /F >nul 2>&1

echo Stopping Ollama...
taskkill /FI "WINDOWTITLE eq Ollama AI*" /F >nul 2>&1
taskkill /IM ollama.exe /F >nul 2>&1

echo Stopping Node.js servers...
taskkill /FI "WINDOWTITLE eq KrisPoint*" /F >nul 2>&1

echo.
echo All KrisPoint services stopped.
echo.
pause
