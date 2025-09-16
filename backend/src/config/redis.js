// Redis Configuration - Optional Redis support
import Redis from 'ioredis'
import { logger } from '../utils/logger.js'

let redisClient = null
let isRedisEnabled = false

/**
 * Initialize Redis connection if available
 */
export async function initializeRedis() {
  try {
    // Check if Redis is enabled via environment variable
    if (process.env.REDIS_ENABLED !== 'true') {
      logger.info('📝 Redis disabled - using synchronous processing')
      return false
    }

    if (!process.env.REDIS_URL) {
      logger.warn('⚠️ REDIS_URL not found - Redis disabled')
      return false
    }

    // Create Redis connection
    redisClient = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    })

    // Test connection
    await redisClient.ping()
    isRedisEnabled = true
    
    logger.info('✅ Redis connected successfully')
    return true

  } catch (error) {
    logger.warn(`❌ Redis connection failed: ${error.message}`)
    logger.info('📝 Falling back to synchronous processing')
    redisClient = null
    isRedisEnabled = false
    return false
  }
}

/**
 * Get Redis client if available
 */
export function getRedisClient() {
  return redisClient
}

/**
 * Check if Redis is enabled and available
 */
export function isRedisAvailable() {
  return isRedisEnabled && redisClient && redisClient.status === 'ready'
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit()
      logger.info('✅ Redis connection closed')
    } catch (error) {
      logger.error('❌ Error closing Redis:', error)
    }
  }
}
