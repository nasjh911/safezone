@echo off
echo ================================
echo   SafeZone - Starting...
echo ================================
echo.
if exist node_modules (
  echo Dependencies already installed, skipping...
) else (
  echo Installing dependencies...
  call npm install
)
echo.
echo Launching SafeZone...
echo Open http://localhost:5173 in your browser
echo.
call npm run dev
pause
