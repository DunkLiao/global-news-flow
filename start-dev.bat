@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ========================================
echo   NewsFlow - Start Dev Server
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Please install Node.js and reopen the terminal.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [INFO] node_modules missing. Running npm install...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

if not exist ".env" (
  echo [WARN] .env not found.
  echo        Copy .env.example to .env and set VITE_NEWS_API_KEY.
  echo.
)

echo Starting Vite dev server...
echo Open the local URL shown below ^(default: http://localhost:5173^)
echo Press Ctrl+C to stop the server.
echo.

call npm.cmd run dev
set "EXITCODE=!ERRORLEVEL!"

if not "!EXITCODE!"=="0" (
  echo.
  echo [ERROR] Dev server exited with code !EXITCODE!.
)

echo.
echo Dev server stopped. Press Ctrl+C in the server first, then close this window.
pause
endlocal
exit /b !EXITCODE!