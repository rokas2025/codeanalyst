// Simple backend starter without database dependencies
// For development/testing when database is not available

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://codeanalyst.vercel.app',
  credentials: true
}))

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Logging
app.use(morgan('combined'))

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mode: 'simple-no-database'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'not-configured',
      queue: 'not-configured',
      ai: 'configured'
    }
  })
})

// Simple GitHub OAuth endpoints for testing
app.get('/api/auth/github', (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID || 'not-configured'
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email,read:user`
  
  res.redirect(githubAuthUrl)
})

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query
  
  if (!code) {
    res.status(400).json({ error: 'Authorization code not provided' })
    return
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      res.status(400).json({ error: tokenData.error_description || 'Failed to get access token' })
      return
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'CodeAnalyst-App'
      }
    })

    const userData = await userResponse.json()

    // Create a simple token (in production, use proper JWT)
    const userToken = Buffer.from(JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      github_token: tokenData.access_token,
      created_at: new Date().toISOString()
    })).toString('base64')

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'https://codeanalyst.vercel.app'
    res.redirect(`${frontendUrl}/auth/callback?token=${userToken}`)

  } catch (error) {
    console.error('GitHub OAuth error:', error)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
})

// Basic URL analysis endpoint (simplified)
app.post('/api/url-analysis/analyze', (req, res) => {
  const { url } = req.body
  
  if (!url) {
    res.status(400).json({ error: 'URL is required' })
    return
  }

  // Return a mock analysis for now
  const analysisId = Date.now().toString()
  res.json({
    success: true,
    analysisId,
    status: 'completed',
    message: 'Simple analysis mode - database features disabled'
  })
})

// Static file serving
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
    path: req.originalUrl
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CodeAnalyst Backend (Simple Mode) running on port ${PORT}`)
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://codeanalyst.vercel.app'}`)
  console.log(`⚠️  Running in simple mode - database features disabled`)
  console.log(`🔑 GitHub OAuth: ${process.env.GITHUB_CLIENT_ID ? 'Configured' : 'Not configured'}`)
})

export default app
