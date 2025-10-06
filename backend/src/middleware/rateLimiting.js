// Enhanced rate limiting middleware for content generation and AI operations
import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger.js'

/**
 * Generic rate limiting configuration
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`)
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000) || 900
      })
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip
    },
    ...options
  }

  return rateLimit(defaultOptions)
}

/**
 * Content generation rate limiting - most restrictive
 */
export const contentGenerationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Plan-based rate limits
    const userPlan = req.user?.plan || 'free'
    const limits = {
      free: 5,        // 5 generations per hour
      basic: 20,      // 20 generations per hour  
      premium: 100,   // 100 generations per hour
      enterprise: 500 // 500 generations per hour
    }
    return limits[userPlan] || limits.free
  },
  message: (req) => {
    const userPlan = req.user?.plan || 'free'
    return {
      success: false,
      error: 'Content generation limit exceeded',
      message: `You've reached your ${userPlan} plan limit for AI content generation. Upgrade your plan for higher limits.`,
      plan: userPlan,
      upgradeUrl: '/pricing'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `content_gen_${req.user?.id || req.ip}`,
  handler: (req, res) => {
    logger.warn(`Content generation rate limit exceeded`, {
      userId: req.user?.id,
      ip: req.ip,
      plan: req.user?.plan,
      userAgent: req.get('User-Agent')
    })
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: req.rateLimit?.message || 'Too many requests'
    })
  }
})

/**
 * Content management operations (CRUD) - moderate limits
 */
export const contentManagementRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const userPlan = req.user?.plan || 'free'
    const limits = {
      free: 100,      // 100 operations per 15 min
      basic: 300,     // 300 operations per 15 min
      premium: 1000,  // 1000 operations per 15 min
      enterprise: 5000 // 5000 operations per 15 min
    }
    return limits[userPlan] || limits.free
  },
  keyGenerator: (req) => `content_mgmt_${req.user?.id || req.ip}`,
  message: {
    success: false,
    error: 'Content management limit exceeded',
    message: 'Too many content operations. Please wait before trying again.'
  }
})

/**
 * Template and settings operations - lenient limits
 */
export const templateRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 operations per 15 min for all users
  keyGenerator: (req) => `template_${req.user?.id || req.ip}`,
  message: {
    success: false,
    error: 'Template operation limit exceeded',
    message: 'Too many template requests. Please wait before trying again.'
  }
})

/**
 * AI provider-specific rate limiting to prevent API quota exhaustion
 */
export const aiProviderRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Conservative limits to protect API quotas
    const provider = req.body?.provider || 'openai'
    const limits = {
      openai: 20,    // 20 requests per minute
      anthropic: 15, // 15 requests per minute
      google: 25     // 25 requests per minute
    }
    return limits[provider] || 10
  },
  keyGenerator: (req) => {
    const provider = req.body?.provider || 'openai'
    return `ai_${provider}_${req.user?.id || req.ip}`
  },
  message: {
    success: false,
    error: 'AI service limit exceeded',
    message: 'Too many AI requests. Please wait a moment before trying again.'
  },
  handler: (req, res) => {
    logger.warn(`AI provider rate limit exceeded`, {
      provider: req.body?.provider,
      userId: req.user?.id,
      ip: req.ip
    })
    res.status(429).json({
      success: false,
      error: 'AI service limit exceeded',
      message: 'Too many AI requests. Please wait a moment before trying again.'
    })
  }
})

/**
 * Burst protection for expensive operations
 */
export const burstProtectionRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Maximum 10 requests per minute
  keyGenerator: (req) => `burst_${req.user?.id || req.ip}`,
  message: {
    success: false,
    error: 'Request rate too high',
    message: 'Please slow down your requests and try again.'
  }
})

/**
 * Cost-based rate limiting for premium operations
 */
export const createCostBasedRateLimit = (costPerOperation = 0.01) => {
  return createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
      const userPlan = req.user?.plan || 'free'
      // Budget per hour in USD
      const budgets = {
        free: 0.50,      // $0.50 per hour
        basic: 5.00,     // $5.00 per hour
        premium: 25.00,  // $25.00 per hour
        enterprise: 100.00 // $100.00 per hour
      }
      
      const budget = budgets[userPlan] || budgets.free
      return Math.floor(budget / costPerOperation)
    },
    keyGenerator: (req) => `cost_${req.user?.id || req.ip}`,
    message: (req) => {
      const userPlan = req.user?.plan || 'free'
      return {
        success: false,
        error: 'Usage budget exceeded',
        message: `You've reached your ${userPlan} plan's hourly usage budget. Upgrade for higher limits.`,
        plan: userPlan
      }
    }
  })
}

/**
 * Dynamic rate limiting based on system load
 */
export const createAdaptiveRateLimit = (baseLimit = 100) => {
  return createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Reduce limits during high system load (simplified version)
      const systemLoad = process.cpuUsage()
      const loadFactor = Math.min(systemLoad.user / 1000000, 1) // Normalize
      const adjustedLimit = Math.max(Math.floor(baseLimit * (1 - loadFactor)), 10)
      
      return adjustedLimit
    },
    keyGenerator: (req) => `adaptive_${req.user?.id || req.ip}`,
    message: {
      success: false,
      error: 'System capacity limit',
      message: 'System is currently under high load. Please try again later.'
    }
  })
}

/**
 * IP-based rate limiting for anonymous users
 */
export const anonymousRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for anonymous users
  keyGenerator: (req) => req.ip,
  skip: (req) => !!req.user, // Skip if user is authenticated
  message: {
    success: false,
    error: 'Anonymous user limit exceeded',
    message: 'Too many requests from this IP. Please sign in for higher limits.'
  }
})

/**
 * Geographic rate limiting (basic implementation)
 */
export const createGeographicRateLimit = (regions = {}) => {
  return createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Simple country detection (would need IP geolocation service)
      const country = req.headers['cf-ipcountry'] || 'unknown'
      return regions[country] || regions.default || 100
    },
    keyGenerator: (req) => {
      const country = req.headers['cf-ipcountry'] || 'unknown'
      return `geo_${country}_${req.user?.id || req.ip}`
    }
  })
}

/**
 * Rate limiting middleware factory for different operation types
 */
export const createOperationRateLimit = (operationType, options = {}) => {
  const operationLimits = {
    // AI Operations
    generation: { windowMs: 60 * 60 * 1000, max: 10 },
    regeneration: { windowMs: 60 * 60 * 1000, max: 20 },
    analysis: { windowMs: 15 * 60 * 1000, max: 50 },
    
    // Content Operations
    create: { windowMs: 15 * 60 * 1000, max: 100 },
    read: { windowMs: 15 * 60 * 1000, max: 1000 },
    update: { windowMs: 15 * 60 * 1000, max: 200 },
    delete: { windowMs: 15 * 60 * 1000, max: 50 },
    
    // Template Operations
    template_load: { windowMs: 15 * 60 * 1000, max: 500 },
    template_save: { windowMs: 15 * 60 * 1000, max: 100 },
    
    // User Operations
    settings_update: { windowMs: 15 * 60 * 1000, max: 50 },
    profile_update: { windowMs: 15 * 60 * 1000, max: 20 }
  }

  const config = operationLimits[operationType] || { windowMs: 15 * 60 * 1000, max: 100 }
  
  return createRateLimit({
    ...config,
    ...options,
    keyGenerator: (req) => `${operationType}_${req.user?.id || req.ip}`,
    message: {
      success: false,
      error: `${operationType} rate limit exceeded`,
      message: `Too many ${operationType} operations. Please wait before trying again.`
    }
  })
}

/**
 * Middleware to log rate limit usage for monitoring
 */
export const rateLimitLogger = (req, res, next) => {
  const originalSend = res.json
  
  res.json = function(data) {
    if (res.statusCode === 429) {
      logger.warn('Rate limit hit', {
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
    }
    
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Rate limit status middleware for client-side display
 */
export const rateLimitStatus = (req, res, next) => {
  // Add rate limit headers for client awareness
  res.set({
    'X-RateLimit-Remaining-Generation': req.rateLimit?.remaining || 'unknown',
    'X-RateLimit-Reset-Generation': req.rateLimit?.reset || 'unknown'
  })
  
  next()
}

// Export commonly used combinations
export const contentCreatorRateLimits = {
  generation: contentGenerationRateLimit,
  management: contentManagementRateLimit,
  templates: templateRateLimit,
  burst: burstProtectionRateLimit
}

export default {
  contentGenerationRateLimit,
  contentManagementRateLimit,
  templateRateLimit,
  aiProviderRateLimit,
  burstProtectionRateLimit,
  anonymousRateLimit,
  createRateLimit,
  createCostBasedRateLimit,
  createAdaptiveRateLimit,
  createGeographicRateLimit,
  createOperationRateLimit,
  rateLimitLogger,
  rateLimitStatus,
  contentCreatorRateLimits
}