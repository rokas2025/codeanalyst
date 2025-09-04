// CodeAnalyst Backend Server - Without Redis for quick testing
// This version skips Redis and workers to get the basic API running

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Import database
import { initDatabase } from './src/database/connection.js'

// Import routes
import authRoutes from './src/routes/auth.js'
import projectRoutes from './src/routes/projects.js'
import analysisRoutes from './src/routes/analysis.js'
import urlAnalysisRoutes from './src/routes/urlAnalysis.js'
import codeAnalysisRoutes from './src/routes/codeAnalysis.js'
import aiRoutes from './src/routes/ai.js'
import chatRoutes from './src/routes/chat.js'
import contentAnalysisRoutes from './src/routes/contentAnalysis.js'

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js'
import { authMiddleware } from './src/middleware/auth.js'
import { logger } from './src/utils/logger.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mode: 'simplified',
    services: {
      database: 'connected',
      queue: 'disabled',
      ai: 'available'
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      queue: 'disabled',
      ai: 'available'
    }
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', authMiddleware, projectRoutes)
app.use('/api/analysis', authMiddleware, analysisRoutes)
app.use('/api/url-analysis', authMiddleware, urlAnalysisRoutes)
app.use('/api/code-analysis', authMiddleware, codeAnalysisRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/content-analysis', contentAnalysisRoutes)

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

// Start server without Redis
async function startServer() {
  try {
    // Initialize database only
    logger.info('📦 Initializing database...')
    await initDatabase()
    logger.info('✅ Database initialized successfully')

    // Skip Redis and workers for now
    logger.info('⚠️  Redis and workers disabled for quick startup')
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 CodeAnalyst Backend Server running on port ${PORT}`)
      logger.info(`📊 API Base URL: http://localhost:${PORT}/api`)
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`)
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
      logger.info(`🚀 Simplified mode: Database + API only (no Redis/workers)`)
      logger.info(`💾 Storage: Supabase PostgreSQL database`)
      logger.info(`🤖 AI: OpenAI integration available`)
      logger.info(`⚠️  Background analysis disabled - analyses run synchronously`)
    })
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
