@echo off
title KrisPoint Web Server
cd /d "c:\KrisPoint-Server\KrisPoint-Teaching-Hospital-Whisper"
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)
set PORT=5000
set HOST=0.0.0.0
echo Starting KrisPoint Web Server...
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
node server-https.js
pause
