// Authentication Middleware - JWT implementation
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger.js'
import { DatabaseService } from '../services/DatabaseService.js'

/**
 * JWT authentication middleware
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Handle development tokens
    if (token.startsWith('dev-token-')) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@codeanalyst.com',
        name: 'Development User',
        plan: 'free'
      }
      return next()
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await DatabaseService.getUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      })
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      githubId: user.github_id,
      githubUsername: user.github_username,
      plan: user.plan
    }
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired'
      })
    }
    
    logger.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

export default authMiddleware 