@echo off
echo 🚀 Starting CodeAnalyst Backend with ngrok tunnel
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found
    echo 💡 Please run setup-ngrok.bat first
    pause
    exit /b 1
)

echo 📦 Starting backend server...
start "Backend Server" cmd /k "npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🌐 Starting ngrok tunnel on port 3001...
ngrok http 3001

echo.
echo 🛑 ngrok tunnel stopped
echo 💡 Backend server is still running in the other window
pause
