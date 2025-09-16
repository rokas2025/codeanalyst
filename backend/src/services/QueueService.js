// Queue Service - Redis + Bull implementation for background job processing
import Queue from 'bull'
import { createClient } from 'redis'
import { logger } from '../utils/logger.js'

class QueueService {
  constructor() {
    this.redisClient = null
    this.queues = {}
    this.isInitialized = false
  }

  /**
   * Initialize Redis connection and queues
   */
  async initialize() {
    try {
      // Create Redis client
      this.redisClient = createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null
      })

      this.redisClient.on('error', (err) => {
        logger.logError('Redis connection error', err)
      })

      this.redisClient.on('connect', () => {
        logger.info('📡 Redis connected successfully')
      })

      await this.redisClient.connect()

      // Initialize queues
      await this.initializeQueues()

      this.isInitialized = true
      logger.info('🚀 Queue service initialized successfully')

    } catch (error) {
      logger.logError('Queue service initialization failed', error)
      throw error
    }
  }

  /**
   * Initialize Bull queues
   */
  async initializeQueues() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0
    }

    // URL Analysis Queue
    this.queues.urlAnalysis = new Queue('URL Analysis', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 50,
        removeOnFail: 20
      }
    })

    // Code Analysis Queue  
    this.queues.codeAnalysis = new Queue('Code Analysis', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 50,
        removeOnFail: 20
      }
    })

    // GitHub Analysis Queue
    this.queues.githubAnalysis = new Queue('GitHub Analysis', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 30,
        removeOnFail: 10
      }
    })

    // ZIP Analysis Queue
    this.queues.zipAnalysis = new Queue('ZIP Analysis', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        removeOnComplete: 30,
        removeOnFail: 10
      }
    })

    // AI Processing Queue
    this.queues.aiProcessing = new Queue('AI Processing', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    })

    logger.info('📋 All queues initialized successfully')
  }

  /**
   * Add URL analysis job
   */
  async addUrlAnalysisJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Queue service not initialized')
      }

      const job = await this.queues.urlAnalysis.add('analyze-url', data, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        ...options
      })

      logger.info(`📤 URL analysis job queued: ${job.id}`, {
        analysisId: data.analysisId,
        url: data.url
      })

      return job
    } catch (error) {
      logger.logError('Failed to queue URL analysis job', error, data)
      throw error
    }
  }

  /**
   * Add code analysis job
   */
  async addCodeAnalysisJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Queue service not initialized')
      }

      const queueName = data.sourceType === 'github' ? 'githubAnalysis' : 
                       data.sourceType === 'zip' ? 'zipAnalysis' : 'codeAnalysis'

      const job = await this.queues[queueName].add(`analyze-${data.sourceType}`, data, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        ...options
      })

      logger.info(`📤 Code analysis job queued: ${job.id}`, {
        analysisId: data.analysisId,
        sourceType: data.sourceType,
        sourceReference: data.sourceReference
      })

      return job
    } catch (error) {
      logger.logError('Failed to queue code analysis job', error, data)
      throw error
    }
  }

  /**
   * Add AI processing job
   */
  async addAIProcessingJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Queue service not initialized')
      }

      const job = await this.queues.aiProcessing.add('ai-analysis', data, {
        priority: options.priority || 5, // Higher priority for AI processing
        delay: options.delay || 0,
        ...options
      })

      logger.info(`📤 AI processing job queued: ${job.id}`, {
        analysisId: data.analysisId,
        aiProvider: data.aiProvider
      })

      return job
    } catch (error) {
      logger.logError('Failed to queue AI processing job', error, data)
      throw error
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      const job = await this.queues[queueName].getJob(jobId)
      if (!job) {
        return null
      }

      return {
        id: job.id,
        data: job.data,
        progress: job.progress,
        state: await job.getState(),
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
        delay: job.delay
      }
    } catch (error) {
      logger.logError('Failed to get job status', error, { queueName, jobId })
      throw error
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      const queue = this.queues[queueName]
      
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.getPaused()
      ])

      return {
        name: queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      }
    } catch (error) {
      logger.logError('Failed to get queue statistics', error, { queueName })
      throw error
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    try {
      const stats = {}
      
      for (const queueName of Object.keys(this.queues)) {
        stats[queueName] = await this.getQueueStats(queueName)
      }

      return stats
    } catch (error) {
      logger.logError('Failed to get all queue statistics', error)
      throw error
    }
  }

  /**
   * Clean completed jobs
   */
  async cleanQueue(queueName, gracePeriod = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      const queue = this.queues[queueName]
      await queue.clean(gracePeriod, 'completed')
      await queue.clean(gracePeriod, 'failed')

      logger.info(`🧹 Cleaned queue: ${queueName}`)
    } catch (error) {
      logger.logError('Failed to clean queue', error, { queueName })
      throw error
    }
  }

  /**
   * Clean all queues
   */
  async cleanAllQueues(gracePeriod = 24 * 60 * 60 * 1000) {
    try {
      for (const queueName of Object.keys(this.queues)) {
        await this.cleanQueue(queueName, gracePeriod)
      }
      logger.info('🧹 All queues cleaned')
    } catch (error) {
      logger.logError('Failed to clean all queues', error)
      throw error
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      await this.queues[queueName].pause()
      logger.info(`⏸️  Queue paused: ${queueName}`)
    } catch (error) {
      logger.logError('Failed to pause queue', error, { queueName })
      throw error
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      await this.queues[queueName].resume()
      logger.info(`▶️  Queue resumed: ${queueName}`)
    } catch (error) {
      logger.logError('Failed to resume queue', error, { queueName })
      throw error
    }
  }

  /**
   * Remove job
   */
  async removeJob(queueName, jobId) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`)
      }

      const job = await this.queues[queueName].getJob(jobId)
      if (job) {
        await job.remove()
        logger.info(`🗑️  Job removed: ${queueName}/${jobId}`)
        return true
      }
      return false
    } catch (error) {
      logger.logError('Failed to remove job', error, { queueName, jobId })
      throw error
    }
  }

  /**
   * Get Redis health status
   */
  async getRedisHealth() {
    try {
      if (!this.redisClient) {
        return { status: 'disconnected', message: 'Redis client not initialized' }
      }

      const ping = await this.redisClient.ping()
      const info = await this.redisClient.info('memory')
      
      return {
        status: 'connected',
        ping,
        memory: this.parseRedisMemoryInfo(info),
        uptime: await this.redisClient.info('server')
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      }
    }
  }

  /**
   * Parse Redis memory info
   */
  parseRedisMemoryInfo(info) {
    const lines = info.split('\r\n')
    const memory = {}
    
    lines.forEach(line => {
      if (line.includes('used_memory_human:')) {
        memory.used = line.split(':')[1]
      }
      if (line.includes('used_memory_peak_human:')) {
        memory.peak = line.split(':')[1]
      }
    })
    
    return memory
  }

  /**
   * Shutdown queue service
   */
  async shutdown() {
    try {
      logger.info('🔄 Shutting down queue service...')

      // Close all queues
      for (const [name, queue] of Object.entries(this.queues)) {
        await queue.close()
        logger.info(`📴 Queue closed: ${name}`)
      }

      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.quit()
        logger.info('📴 Redis connection closed')
      }

      this.isInitialized = false
      logger.info('✅ Queue service shutdown complete')

    } catch (error) {
      logger.logError('Queue service shutdown failed', error)
      throw error
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const redis = await this.getRedisHealth()
      const stats = await this.getAllQueueStats()

      return {
        status: this.isInitialized && redis.status === 'connected' ? 'healthy' : 'unhealthy',
        redis,
        queues: stats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Create singleton instance
const queueService = new QueueService()

export { queueService }
export default queueService 