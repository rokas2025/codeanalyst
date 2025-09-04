@echo off
echo 🌐 ngrok Setup for CodeAnalyst
echo.

echo ⚠️  Important: You need to restart PowerShell/Command Prompt after ngrok installation
echo.

REM Check if ngrok is available
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ngrok not found in PATH
    echo 💡 Please restart your command prompt and try again
    echo 💡 Or manually run: ngrok config add-authtoken YOUR_API_KEY
    pause
    exit /b 1
)

echo ✅ ngrok found in PATH
echo.

REM Prompt for API key
set /p NGROK_API_KEY="🔐 Enter your ngrok API key: "

if "%NGROK_API_KEY%"=="" (
    echo ❌ API key is required
    pause
    exit /b 1
)

echo 🔧 Configuring ngrok with your API key...
ngrok config add-authtoken %NGROK_API_KEY%

if %errorlevel% neq 0 (
    echo ❌ Failed to configure ngrok
    pause
    exit /b 1
)

echo ✅ ngrok configured successfully!
echo.
echo 🚀 Now you can start the tunnel with:
echo    ngrok http 3001
echo.
pause
