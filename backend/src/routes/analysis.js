// Analysis Routes - General analysis endpoints
import express from 'express'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/analysis/stats
 * Get analysis statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock statistics for development
    const stats = {
      totalAnalyses: 42,
      urlAnalyses: 25,
      codeAnalyses: 17,
      avgScore: 78.5,
      topTechnologies: [
        { name: 'React', count: 15 },
        { name: 'Node.js', count: 12 },
        { name: 'WordPress', count: 8 },
        { name: 'Vue.js', count: 5 }
      ]
    }

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    logger.error('Get analysis stats failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis stats'
    })
  }
})

export default router 