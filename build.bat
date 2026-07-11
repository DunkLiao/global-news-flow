@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ========================================
echo   NewsFlow - Production Build
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

echo Running typecheck and production build...
echo.

call npm.cmd run build
set "EXITCODE=!ERRORLEVEL!"

if not "!EXITCODE!"=="0" (
  echo.
  echo [ERROR] Build failed with code !EXITCODE!.
  pause
  exit /b !EXITCODE!
)

echo.
echo ========================================
echo   Build succeeded
echo   Output: %CD%\dist
echo ========================================
echo.
echo Preview with: npm run preview
echo.
pause
endlocal
exit /b 0