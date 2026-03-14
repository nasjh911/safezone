#!/bin/bash
echo "========================================"
echo "  SafeZone — Deploy to Vercel"
echo "========================================"
echo ""

# Check git
if ! command -v git &> /dev/null; then
    echo "ERROR: Git not installed. Install from https://git-scm.com"
    exit 1
fi

# Init or push
if [ ! -d ".git" ]; then
    echo "Step 1: Initializing git..."
    git init
    git add .
    git commit -m "SafeZone v1 — initial deploy"
    echo ""
    echo "========================================"
    echo "  ACTION REQUIRED"
    echo "========================================"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a repo named: safezone"
    echo "3. Copy the repo URL"
    echo ""
    read -p "Paste your GitHub repo URL: " REPO_URL
    git remote add origin $REPO_URL
    git branch -M main
    git push -u origin main
else
    echo "Step 1: Pushing latest changes..."
    git add .
    git commit -m "SafeZone update — $(date)"
    git push
fi

echo ""
echo "========================================"
echo "  DONE! Now deploy on Vercel:"
echo "========================================"
echo ""
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Click 'Add New Project'"
echo "4. Import your 'safezone' repository"
echo "5. Click Deploy"
echo ""
echo "Your app will be live in ~60 seconds!"
