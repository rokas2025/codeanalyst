// Error Handler Middleware
import { logger } from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  })

  // Default error response
  const response = {
    success: false,
    error: 'Internal server error'
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    response.error = 'Validation failed'
    response.details = err.message
    return res.status(400).json(response)
  }

  if (err.name === 'UnauthorizedError') {
    response.error = 'Authentication required'
    return res.status(401).json(response)
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    response.error = 'File too large'
    return res.status(413).json(response)
  }

  // Development vs production error details
  if (process.env.NODE_ENV === 'development') {
    response.message = err.message
    response.stack = err.stack
  }

  res.status(err.status || 500).json(response)
}

export default errorHandler 