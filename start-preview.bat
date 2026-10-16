@echo off
setlocal
cd /d "%~dp0"
echo Starting Narendra's interactive portfolio preview...
start "Portfolio preview" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"
python -m http.server 8000
pause
