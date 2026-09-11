@echo off
title KrisPoint Web Server
cd /d "c:\KrisPoint-Server\KrisPoint-Teaching-Hospital-Whisper"
set PORT=5000
set HOST=0.0.0.0
echo Starting KrisPoint Web Server...
echo.
node server-https.js
pause
