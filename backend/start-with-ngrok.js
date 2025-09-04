#!/usr/bin/env node

// Start backend with ngrok tunnel
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting CodeAnalyst Backend with ngrok tunnel...')

// Check if .env exists
const envPath = join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create it from env.example')
  process.exit(1)
}

// Start the backend server
console.log('📦 Starting backend server...')
const backend = spawn('npm', ['start'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
})

backend.on('error', (error) => {
  console.error('❌ Failed to start backend:', error)
  process.exit(1)
})

// Wait a moment for backend to start
setTimeout(() => {
  console.log('🌐 Starting ngrok tunnel...')
  
  // Start ngrok tunnel
  const ngrok = spawn('ngrok', ['http', '3001', '--log=stdout'], {
    stdio: 'inherit',
    shell: true
  })

  ngrok.on('error', (error) => {
    console.error('❌ Failed to start ngrok:', error)
    console.log('💡 Make sure ngrok is installed and authenticated')
    console.log('💡 Run: ngrok config add-authtoken YOUR_API_KEY')
    process.exit(1)
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down...')
    backend.kill()
    ngrok.kill()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down...')
    backend.kill()
    ngrok.kill()
    process.exit(0)
  })

}, 3000)

console.log('✅ Backend with ngrok tunnel starting...')
console.log('📋 Next steps:')
console.log('1. Wait for ngrok URL to appear')
console.log('2. Copy the https://xxx.ngrok-free.app URL')
console.log('3. Update your Vercel environment variables')
console.log('4. Deploy frontend to Vercel')
