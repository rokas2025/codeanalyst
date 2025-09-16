// Projects Routes - Manage user projects
import express from 'express'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/projects
 * Get user's projects
 */
router.get('/', async (req, res) => {
  try {
    // For development, return mock projects
    const projects = [
      {
        id: 'project-1',
        name: 'My Portfolio',
        type: 'url',
        source: 'https://myportfolio.com',
        createdAt: new Date().toISOString(),
        lastAnalyzed: new Date().toISOString()
      },
      {
        id: 'project-2', 
        name: 'E-commerce Site',
        type: 'github',
        source: 'https://github.com/user/ecommerce',
        createdAt: new Date().toISOString(),
        lastAnalyzed: null
      }
    ]

    res.json({
      success: true,
      projects
    })

  } catch (error) {
    logger.error('Get projects failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get projects'
    })
  }
})

export default router 