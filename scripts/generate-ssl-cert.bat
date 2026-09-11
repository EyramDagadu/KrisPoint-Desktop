@echo off
title KrisPoint - SSL Certificate Generator
color 0B

echo ============================================
echo   KrisPoint SSL Certificate Generator
echo ============================================
echo.

cd /d "%~dp0.."

if not exist "ssl" mkdir ssl

echo This will generate a self-signed SSL certificate for HTTPS.
echo.

set "GIT_SSL=C:\Program Files\Git\usr\bin\openssl.exe"

if exist "%GIT_SSL%" (
    echo Found OpenSSL in Git for Windows
    echo Generating certificate...
    echo.
    "%GIT_SSL%" req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ssl\key.pem -out ssl\cert.pem -subj "/C=GH/ST=Ghana/L=Accra/O=KrisPoint/CN=KrisPoint"
    goto checkfiles
)

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ssl\key.pem -out ssl\cert.pem -subj "/C=GH/ST=Ghana/L=Accra/O=KrisPoint/CN=KrisPoint" 2>nul
if not errorlevel 1 goto checkfiles

echo OpenSSL not found.
echo.
echo Please install Git for Windows from:
echo https://git-scm.com/download/win
echo.
echo Then run this script again.
pause
goto end

:checkfiles
echo.
if exist "ssl\cert.pem" if exist "ssl\key.pem" (
    echo ============================================
    echo   SUCCESS! Certificate created.
    echo ============================================
    echo.
    echo Files: ssl\cert.pem and ssl\key.pem
    echo Valid for 10 years.
    echo.
) else (
    echo ERROR: Files not created.
)
pause

:end
