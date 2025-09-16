// PostgreSQL-based Queue Service - Uses existing Supabase database
import { DatabaseService } from './DatabaseService.js'
import { logger } from '../utils/logger.js'

export class PostgresQueueService {
  constructor() {
    this.isProcessing = false
    this.processingInterval = null
  }

  /**
   * Add a job to the queue
   */
  async addJob(type, payload, options = {}) {
    try {
      const job = {
        type,
        payload,
        priority: options.priority || 0,
        max_attempts: options.maxAttempts || 3,
        run_at: options.delay ? new Date(Date.now() + options.delay) : new Date()
      }

      const query = `
        INSERT INTO job_queue (type, payload, priority, max_attempts, run_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `
      
      const result = await DatabaseService.query(query, [
        job.type,
        JSON.stringify(job.payload),
        job.priority,
        job.max_attempts,
        job.run_at
      ])

      const jobId = result.rows[0].id
      logger.info(`📥 Job queued: ${type} (${jobId})`)
      
      return jobId
    } catch (error) {
      logger.error('Failed to add job to queue:', error)
      throw error
    }
  }

  /**
   * Get next job to process
   */
  async getNextJob() {
    try {
      const query = `
        UPDATE job_queue 
        SET status = 'processing', 
            started_at = NOW(), 
            attempts = attempts + 1,
            updated_at = NOW()
        WHERE id = (
          SELECT id FROM job_queue 
          WHERE status = 'pending' 
            AND run_at <= NOW()
            AND attempts < max_attempts
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `
      
      const result = await DatabaseService.query(query)
      
      if (result.rows.length > 0) {
        const job = result.rows[0]
        job.payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload
        return job
      }
      
      return null
    } catch (error) {
      logger.error('Failed to get next job:', error)
      return null
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId, result = null) {
    try {
      const query = `
        UPDATE job_queue 
        SET status = 'completed', 
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `
      
      await DatabaseService.query(query, [jobId])
      logger.info(`✅ Job completed: ${jobId}`)
    } catch (error) {
      logger.error('Failed to complete job:', error)
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId, error) {
    try {
      const query = `
        UPDATE job_queue 
        SET status = CASE 
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'pending'
        END,
        error_message = $2,
        run_at = CASE 
          WHEN attempts < max_attempts THEN NOW() + INTERVAL '5 minutes'
          ELSE run_at
        END,
        updated_at = NOW()
        WHERE id = $1
      `
      
      await DatabaseService.query(query, [jobId, error.message])
      logger.warn(`❌ Job failed: ${jobId} - ${error.message}`)
    } catch (dbError) {
      logger.error('Failed to mark job as failed:', dbError)
    }
  }

  /**
   * Start processing jobs
   */
  async startProcessing() {
    if (this.isProcessing) {
      logger.warn('Job processing already started')
      return
    }

    this.isProcessing = true
    logger.info('🚀 Started PostgreSQL job queue processing')

    // Process jobs every 5 seconds
    this.processingInterval = setInterval(async () => {
      try {
        const job = await this.getNextJob()
        if (job) {
          await this.processJob(job)
        }
      } catch (error) {
        logger.error('Error in job processing loop:', error)
      }
    }, 5000)
  }

  /**
   * Stop processing jobs
   */
  async stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    logger.info('⏹️ Stopped PostgreSQL job queue processing')
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    try {
      logger.info(`🔄 Processing job: ${job.type} (${job.id})`)

      switch (job.type) {
        case 'url_analysis':
          await this.processUrlAnalysis(job)
          break
        case 'github_analysis':
          await this.processGithubAnalysis(job)
          break
        case 'zip_analysis':
          await this.processZipAnalysis(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      await this.completeJob(job.id)
    } catch (error) {
      logger.error(`Job processing failed: ${job.id}`, error)
      await this.failJob(job.id, error)
    }
  }

  /**
   * Process URL analysis job
   */
  async processUrlAnalysis(job) {
    const { analysisId, url, options } = job.payload
    
    // Import dynamically to avoid circular dependencies
    const { default: WebsiteAnalyzer } = await import('./WebsiteAnalyzer.js')
    const { default: AIAnalysisService } = await import('./AIAnalysisService.js')
    
    const websiteAnalyzer = new WebsiteAnalyzer()
    await websiteAnalyzer.initialize()
    
    await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 30)
    
    const websiteResult = await websiteAnalyzer.analyzeWebsite(url, options)
    await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 70)
    
    let aiInsights = null
    if (options.includeAI !== false) {
      const aiAnalysisService = new AIAnalysisService()
      aiInsights = await aiAnalysisService.generateURLInsights(websiteResult, options.aiProfile || 'mixed')
    }
    
    const finalResult = { ...websiteResult, aiInsights, completedAt: new Date().toISOString() }
    
    await DatabaseService.updateUrlAnalysisStatus(analysisId, 'completed', 100)
    await DatabaseService.updateUrlAnalysisData(analysisId, finalResult.analysisData)
    
    await websiteAnalyzer.cleanup()
  }

  /**
   * Process GitHub analysis job (placeholder)
   */
  async processGithubAnalysis(job) {
    const { analysisId } = job.payload
    logger.info(`Processing GitHub analysis: ${analysisId}`)
    // Implementation would go here
  }

  /**
   * Process ZIP analysis job (placeholder)
   */
  async processZipAnalysis(job) {
    const { analysisId } = job.payload
    logger.info(`Processing ZIP analysis: ${analysisId}`)
    // Implementation would go here
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM job_queue 
        GROUP BY status
      `
      
      const result = await DatabaseService.query(query)
      const stats = {}
      
      result.rows.forEach(row => {
        stats[row.status] = parseInt(row.count)
      })
      
      return stats
    } catch (error) {
      logger.error('Failed to get queue stats:', error)
      return {}
    }
  }
}

// Export singleton instance
export const postgresQueue = new PostgresQueueService()
