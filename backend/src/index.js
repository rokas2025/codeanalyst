// CodeAnalyst Backend Server - Development Mode
// Handles all analysis processing, AI integration, and data storage

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Import database and services
import { initDatabase } from './database/connection.js'
import { queueService } from './services/QueueService.js'
import { autoSeed } from '../scripts/auto-seed.js'

// Import workers
import { startAnalysisWorker } from './workers/analysisWorker.js'

// Import routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import analysisRoutes from './routes/analysis.js'
import urlAnalysisRoutes from './routes/urlAnalysis.js'
import codeAnalysisRoutes from './routes/codeAnalysis.js'
import aiRoutes from './routes/ai.js'
import chatRoutes from './routes/chat.js'
import contentAnalysisRoutes from './routes/contentAnalysis.js'
import contentCreatorRoutes from './routes/contentCreator.js'
import settingsRoutes from './routes/settings.js'
import wordpressRoutes from './routes/wordpress.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'
import { logger } from './utils/logger.js'

// Import database (optional for development)
// import { initDatabase } from './database/connection.js'

// Import workers (optional for development) 
// import { startAnalysisWorker } from './workers/analysisWorker.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// CORS must be configured BEFORE helmet to work properly
app.use(cors({ origin: true, credentials: true }))

// Security middleware - COMPLETELY DISABLED for testing
// app.use(helmet())

// Rate limiting (DISABLED FOR TESTING)
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)
*/

// Analysis-specific rate limiting (DISABLED FOR TESTING)
/*
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 analyses per hour for free users
  message: 'Analysis limit exceeded. Please upgrade your plan for more analyses.'
})
*/

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CodeAnalyst Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      contentCreator: '/api/content-creator'
    }
  })
})

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    services: {
      database: 'connected',
      queue: 'disabled (Railway free tier)',
      ai: 'available'
    }
  })
})

// Debug endpoint to check OpenAI configuration (no auth required)
app.post('/api/debug-openai', async (req, res) => {
  try {
    console.log('🐛 DEBUG: Checking OpenAI configuration on Railway...')

    // Test OpenAI configuration
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const keyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'NOT SET'

    console.log('OpenAI API Key exists:', hasOpenAI)
    console.log('OpenAI API Key prefix:', keyPrefix)

    let openaiTest = 'not tested'
    let dbTest = 'not tested'

    // Test database connection
    try {
      const result = await db.query('SELECT COUNT(*) FROM content_templates WHERE is_active = true')
      dbTest = `${result.rows[0].count} templates found`
      console.log('Database test:', dbTest)
    } catch (dbError) {
      dbTest = `Database error: ${dbError.message}`
      console.error('Database test failed:', dbError)
    }

    // Test OpenAI if key exists
    if (hasOpenAI) {
      try {
        const OpenAI = (await import('openai')).default
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const testResponse = await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "OpenAI working" in exactly 2 words.' }],
          max_tokens: 10,
          temperature: 0
        })

        openaiTest = `Success: ${testResponse.choices[0].message.content}`
        console.log('OpenAI test:', openaiTest)
      } catch (openaiError) {
        openaiTest = `OpenAI error: ${openaiError.message}`
        console.error('OpenAI test failed:', openaiError)
      }
    }

    res.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        openai_key_exists: hasOpenAI,
        openai_key_prefix: keyPrefix,
        openai_test: openaiTest,
        database_test: dbTest,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('🐛 DEBUG ERROR:', error)
    res.json({
      success: false,
      error: error.message,
      debug: {
        openai_key_exists: !!process.env.OPENAI_API_KEY,
        error_stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      queue: 'disabled (Railway free tier)',
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
app.use('/api/content-creator', authMiddleware, contentCreatorRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/wordpress', wordpressRoutes)

// Static file serving
app.use('/uploads', express.static(join(__dirname, '../uploads')))

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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
async function startServer() {
  try {
    // Initialize database
    logger.info('📦 Initializing database...')
    await initDatabase()
    logger.info('✅ Database initialized successfully')

    // Auto-seed content templates
    logger.info('🌱 Running auto-seeding for content templates...')
    try {
      await autoSeed()
      logger.info('✅ Auto-seeding completed successfully')
    } catch (error) {
      logger.warn('⚠️ Auto-seeding failed (non-critical):', error.message)
    }

    // Queue service disabled for Railway deployment
    logger.info('⚠️ Queue service disabled - Redis not available on Railway free tier')
    logger.info('💡 Analysis will run synchronously instead of background queues')

    // Analysis worker disabled for Railway deployment
    logger.info('⚠️ Analysis worker disabled - Redis not available on Railway free tier')
    logger.info('💡 Analysis requests will be processed synchronously')

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 CodeAnalyst Backend Server running on port ${PORT}`)
      logger.info(`📊 API Base URL: http://localhost:${PORT}/api`)
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`)
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
      logger.info(`🚀 Production mode: Full analysis with database, queue workers, and AI`)
      logger.info(`💾 Storage: PostgreSQL database with Redis queue management`)
      logger.info(`🤖 AI: OpenAI, Anthropic, Google Gemini integration`)
      logger.info(`📊 Analysis: Puppeteer, Lighthouse, Pa11y, GitHub, ZIP files`)
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app 
