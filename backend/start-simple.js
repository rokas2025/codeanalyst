// Ultra-simple backend for Railway deployment testing
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

console.log('🚀 Starting CodeAnalyst Backend...')
console.log('📊 Port:', PORT)
console.log('🌍 Environment:', process.env.NODE_ENV)
console.log('🔗 Frontend URL:', process.env.FRONTEND_URL)

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  console.log('Health check requested')
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    frontend_url: process.env.FRONTEND_URL
  })
})

app.get('/api/health', (req, res) => {
  console.log('API health check requested')
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'CodeAnalyst Backend is running on Railway'
  })
})

// Basic auth endpoint
app.post('/api/auth/github/callback', (req, res) => {
  console.log('GitHub callback requested')
  res.json({
    success: false,
    message: 'Database connection needed for auth - this is a simplified version'
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CodeAnalyst Backend running on port ${PORT}`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`)
  console.log(`✅ Server started successfully!`)
})

export default app