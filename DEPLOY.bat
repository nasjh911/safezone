@echo off
echo ========================================
echo   SafeZone — Deploy to Vercel
echo ========================================
echo.

:: Check git
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not installed.
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b
)

:: Check node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed.
    echo Download from: https://nodejs.org
    pause
    exit /b
)

:: Check if already a git repo
if not exist ".git" (
    echo Step 1: Initializing git...
    git init
    git add .
    git commit -m "SafeZone v1 — initial deploy"
    echo.
    echo ========================================
    echo   ACTION REQUIRED
    echo ========================================
    echo.
    echo 1. Go to https://github.com/new
    echo 2. Create a repo named: safezone
    echo 3. Copy the repo URL (looks like: https://github.com/YOURNAME/safezone.git)
    echo.
    set /p REPO_URL="Paste your GitHub repo URL here: "
    git remote add origin %REPO_URL%
    git branch -M main
    git push -u origin main
) else (
    echo Step 1: Pushing latest changes to GitHub...
    git add .
    git commit -m "SafeZone update — %date% %time%"
    git push --force origin main
)

echo.
echo ========================================
echo   DONE! Now deploy on Vercel:
echo ========================================
echo.
echo 1. Go to https://vercel.com
echo 2. Sign in with GitHub
echo 3. Click "Add New Project"
echo 4. Import your "safezone" repository
echo 5. Click Deploy
echo.
echo Your app will be live in ~60 seconds!
echo.
pause
