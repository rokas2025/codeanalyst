@echo off
echo 🚀 Starting CodeAnalyst Backend
echo.

REM Change to backend directory
cd backend

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your API keys before continuing
    echo Press any key after editing .env file...
    pause
)

REM Start backend server
echo 📦 Starting backend server on port 3001...
npm start
