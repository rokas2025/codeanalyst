// AI Routes - AI service endpoints
import express from 'express'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/ai/status
 * Get AI service status
 */
router.get('/status', async (req, res) => {
  try {
    // Check AI service availability
    const status = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_AI_API_KEY,
      defaultProvider: 'openai'
    }

    res.json({
      success: true,
      status
    })

  } catch (error) {
    logger.error('Get AI status failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get AI status'
    })
  }
})

export default router 