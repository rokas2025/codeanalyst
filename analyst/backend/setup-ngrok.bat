@echo off
echo 🚀 Setting up ngrok for CodeAnalyst Backend
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ngrok not found. Please install ngrok first:
    echo 💡 Download from: https://ngrok.com/download
    echo 💡 Or use: winget install --id ngrok.ngrok
    pause
    exit /b 1
)

echo ✅ ngrok found
echo.

REM Prompt for API key
set /p NGROK_API_KEY="Enter your ngrok API key: "

if "%NGROK_API_KEY%"=="" (
    echo ❌ API key is required
    pause
    exit /b 1
)

echo 🔐 Configuring ngrok with API key...
ngrok config add-authtoken %NGROK_API_KEY%

if %errorlevel% neq 0 (
    echo ❌ Failed to configure ngrok
    pause
    exit /b 1
)

echo ✅ ngrok configured successfully
echo.

echo 📦 Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

echo 🔧 Checking .env file...
if not exist .env (
    echo 📝 Creating .env file from example...
    copy env.example .env
    echo ⚠️  Please edit .env file with your actual configuration
    echo 💡 You'll need to add your API keys and database credentials
    notepad .env
)

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start the backend with ngrok tunnel, run:
echo    npm run start:ngrok
echo.
echo 📋 After starting, you'll get an ngrok URL like:
echo    https://abc123.ngrok-free.app
echo.
echo 🌐 Use this URL as your VITE_API_URL in Vercel:
echo    VITE_API_URL=https://your-ngrok-url.ngrok-free.app/api
echo.
pause
