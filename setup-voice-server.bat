@echo off
REM Convenience entry point from the KrisPoint project root.
call "%~dp0vosk-server\INSTALL_DEPENDENCIES.bat"
exit /b %errorlevel%
