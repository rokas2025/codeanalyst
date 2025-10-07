// URL Analysis Route - Complete implementation with database and queue
import express from 'express'
import { body, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../services/DatabaseService.js'
// Queue service disabled for Railway deployment (no Redis)
// import { queueService } from '../services/QueueService.js'
import { logger } from '../utils/logger.js'
import { authMiddleware } from '../middleware/auth.js'
import { PageSpeedService } from '../services/PageSpeedService.js'
import { MozillaObservatoryService } from '../services/MozillaObservatoryService.js'
import { SSLLabsService } from '../services/SSLLabsService.js'

const router = express.Router()

// Initialize services
const pageSpeedService = new PageSpeedService()
const mozillaObservatoryService = new MozillaObservatoryService()
const sslLabsService = new SSLLabsService()

/**
 * Get troubleshooting suggestions based on error category
 */
function getSuggestions(category) {
  const suggestions = {
    browser_protocol: [
      'The website is likely using anti-bot protection',
      'Try again with a different URL',
      'Contact support if this persists with multiple sites'
    ],
    timeout: [
      'The website is slow to respond',
      'Try again later when the site might be less busy',
      'Check if the website loads normally in your browser'
    ],
    network: [
      'Verify the URL is correct',
      'Check if the website is accessible in your browser',
      'The website might be temporarily down'
    ],
    navigation: [
      'The website detected and blocked automated access',
      'This is common with Google, Facebook, and other large sites',
      'Try a different website or contact support'
    ],
    script_blocked: [
      'The website has strong anti-automation protection',
      'This indicates sophisticated bot detection',
      'Try analyzing a different page or website'
    ],
    session_closed: [
      'Browser session was terminated by anti-bot protection',
      'The website actively blocks automated analysis',
      'Consider using a different URL'
    ],
    server: [
      'This appears to be a server-side issue',
      'Please try again in a few minutes',
      'Contact support if the problem persists'
    ]
  }
  
  return suggestions[category] || suggestions.server
}

/**
 * POST /api/url-analysis/analyze
 * Analyze a website URL with real content extraction
 */
router.post('/analyze', authMiddleware, [
  body('url')
    .isURL({ require_protocol: true })
    .withMessage('Valid URL with protocol (http/https) is required'),
  body('options.includeScreenshots')
    .optional()
    .isBoolean()
    .withMessage('includeScreenshots must be boolean'),
  body('options.deepAnalysis')
    .optional()
    .isBoolean()
    .withMessage('deepAnalysis must be boolean'),
  body('options.aiProfile')
    .optional()
    .isIn(['technical', 'business', 'mixed'])
    .withMessage('aiProfile must be technical, business, or mixed')
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { url, options = {} } = req.body
    const userId = req.user.id
    const analysisId = uuidv4()

    // Default options
    const analysisOptions = {
      includeScreenshots: options.includeScreenshots || false,
      deepAnalysis: options.deepAnalysis || true,
      aiProfile: options.aiProfile || 'mixed',
      includeLighthouse: true,
      includeAccessibility: true,
      includeSecurity: true,
      includePerformance: true,
      includeSEO: true,
      ...options
    }

    logger.info(`🌐 Starting real URL analysis for ${url}`, {
      analysisId,
      userId,
      options: analysisOptions
    })

    // Create initial analysis record in database
    await DatabaseService.createUrlAnalysis({
      id: analysisId,
      userId,
      url,
      status: 'pending',
      progress: 0,
      options: analysisOptions
    })

    // Process analysis synchronously (no Redis queues on Railway)
    try {
      logger.info(`🚀 Processing URL analysis synchronously: ${analysisId}`)
      
      // Update status to processing
      await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 10)

      // Import required services dynamically
      const { default: WebsiteAnalyzer } = await import('../services/WebsiteAnalyzer.js')
      const { default: AIAnalysisService } = await import('../services/AIAnalysisService.js')
      
      // Initialize analyzer
      const websiteAnalyzer = new WebsiteAnalyzer()
      await websiteAnalyzer.initialize()
      await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 30)

      // Perform website analysis
      logger.info(`🌐 Analyzing website: ${url}`)
      const websiteResult = await websiteAnalyzer.analyzeWebsite(url, analysisOptions)
      
      // Debug: Log the analysis result
      logger.info(`📊 Website analysis result:`, {
        url,
        hasData: !!websiteResult,
        dataKeys: websiteResult ? Object.keys(websiteResult) : 'null',
        titleExists: !!(websiteResult && websiteResult.title),
        technologiesCount: websiteResult && websiteResult.technologies ? websiteResult.technologies.length : 0
      })
      
      await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 70)

      // Generate AI insights if requested
      let aiInsights = null
      if (analysisOptions.includeAI !== false) {
        try {
          logger.info(`🤖 Generating AI insights for website analysis`)
          const aiAnalysisService = new AIAnalysisService()
          aiInsights = await aiAnalysisService.generateURLInsights(websiteResult, analysisOptions.aiProfile || 'mixed')
          await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 90)
        } catch (aiError) {
          logger.warn(`AI insights generation failed: ${aiError.message}`)
        }
      }

      // Combine results in the format expected by frontend
      const finalResult = {
        id: analysisId,
        url,
        status: 'completed',
        progress: 100,
        analysisData: {
          websiteAnalysis: websiteResult,
          aiInsights,
          metadata: {
            analyzedAt: new Date().toISOString(),
            analysisOptions,
            processingTime: 'synchronous',
            version: '1.0.0'
          }
        }
      }

      // Update database with completed analysis
      await DatabaseService.updateUrlAnalysisStatus(analysisId, 'completed', 100)
      
      // Extract the actual website data for database storage
      logger.info(`💾 Raw websiteResult:`, websiteResult)
      
      const dbData = {
        title: websiteResult?.basic?.title || null,
        technologies: websiteResult?.technologies || [],
        html_content: websiteResult?.basic?.html || '',
        basic_website_data: websiteResult?.basic || {},
        performance_metrics: websiteResult?.lighthouse || websiteResult?.performance || {},
        seo_analysis: websiteResult?.comprehensiveSEO || websiteResult?.seo || {},
        accessibility_analysis: websiteResult?.accessibility || {},
        security_analysis: websiteResult?.security || {}
      }
      
      logger.info(`💾 Storing analysis data:`, {
        hasTitle: !!dbData.title,
        hasTechnologies: !!(dbData.technologies && dbData.technologies.length),
        hasHtmlContent: !!dbData.html_content,
        dataKeys: Object.keys(dbData),
        basicKeys: Object.keys(dbData.basic_website_data),
        performanceKeys: Object.keys(dbData.performance_metrics),
        seoKeys: Object.keys(dbData.seo_analysis)
      })
      
      await DatabaseService.updateUrlAnalysisData(analysisId, dbData)

      // Return completed analysis immediately
      res.json({
        success: true,
        analysisId,
        status: 'completed',
        data: finalResult,
        message: 'Website analysis completed successfully!',
        processingTime: 'immediate'
      })

    } catch (analysisError) {
      logger.error(`URL analysis failed: ${analysisError.message}`, analysisError)
      await DatabaseService.updateUrlAnalysisStatus(analysisId, 'failed', 0, analysisError.message)
      
      // Enhanced error details for debugging 422 issues
      const errorDetails = {
        url,
        analysisId,
        timestamp: new Date().toISOString(),
        error_type: analysisError.constructor.name,
        error_message: analysisError.message,
        error_stack: process.env.NODE_ENV === 'development' ? analysisError.stack : null,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip || req.connection.remoteAddress,
        request_headers: {
          accept: req.headers.accept,
          'accept-language': req.headers['accept-language'],
          'sec-fetch-dest': req.headers['sec-fetch-dest'],
          'sec-fetch-mode': req.headers['sec-fetch-mode']
        },
        environment: {
          node_env: process.env.NODE_ENV,
          platform: process.platform,
          chrome_executable: process.env.CHROME_EXECUTABLE || 'auto-detect',
          puppeteer_args: 'anti-detection-enabled'
        }
      }
      
      // Determine appropriate error response based on error type
      let errorCode = 'ANALYSIS_FAILED'
      let statusCode = 500
      let userMessage = analysisError.message
      let debugCategory = 'server'

    if (analysisError.message.includes('Protocol error') || analysisError.message.includes('Connection closed') || analysisError.message.includes('detached Frame')) {
      errorCode = 'BROWSER_PROTOCOL_ERROR'
      statusCode = 502 // Bad Gateway - server/browser issue, not user input issue
      userMessage = 'Website blocked our analysis or has dynamic content that interfered with scanning.'
      debugCategory = 'browser_protocol'
      errorDetails.bot_detection_likely = true
    } else if (analysisError.message.includes('Timed out') || analysisError.message.includes('timeout')) {
      errorCode = 'ANALYSIS_TIMEOUT'
      statusCode = 502 // Server couldn't complete the request in time
      userMessage = 'Website analysis timed out. The site may be very slow or unresponsive.'
      debugCategory = 'timeout'
      errorDetails.timeout_duration = '30s'
    } else if (analysisError.message.includes('net::ERR_') || analysisError.message.includes('DNS')) {
      errorCode = 'WEBSITE_NOT_ACCESSIBLE'
      statusCode = 502 // Bad Gateway - can't reach target
      userMessage = 'Website could not be reached. Please check if the URL is correct and the site is accessible.'
      debugCategory = 'network'
    } else if (analysisError.message.includes('Navigation failed') || analysisError.message.includes('net::ERR_FAILED')) {
      errorCode = 'NAVIGATION_FAILED'
      statusCode = 502 // Bad Gateway - navigation blocked
      userMessage = 'Failed to navigate to the website. This often indicates anti-bot protection or the site is blocking automated access.'
      debugCategory = 'navigation'
      errorDetails.bot_detection_likely = true
    } else if (analysisError.message.includes('evaluateOnNewDocument') || analysisError.message.includes('Runtime.evaluate')) {
      errorCode = 'BROWSER_SCRIPT_BLOCKED'
      statusCode = 502 // Bad Gateway - scripts blocked
      userMessage = 'Browser automation was detected and blocked by the website.'
      debugCategory = 'script_blocked'
      errorDetails.bot_detection_confirmed = true
    } else if (analysisError.message.includes('Target closed') || analysisError.message.includes('Session closed')) {
      errorCode = 'BROWSER_SESSION_CLOSED'
      statusCode = 502 // Bad Gateway - session terminated
      userMessage = 'Browser session was terminated unexpectedly by anti-bot protection.'
      debugCategory = 'session_closed'
      errorDetails.bot_detection_likely = true
    }
      
      // Add debug category to error details
      errorDetails.debug_category = debugCategory
      errorDetails.error_code = errorCode
      
      res.status(statusCode).json({
        success: false,
        analysisId,
        error: errorCode,
        message: userMessage,
        technicalDetails: analysisError.message,
        debugInfo: errorDetails,
        troubleshooting: {
          category: debugCategory,
          suggestions: getSuggestions(debugCategory),
          retry_recommended: statusCode === 422 && !errorDetails.bot_detection_confirmed
        }
      })
    }

  } catch (error) {
    logger.error('URL analysis request failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start URL analysis',
      message: error.message
    })
  }
})

/**
 * GET /api/url-analysis/status/:analysisId
 * Check the status of a URL analysis
 */
router.get('/status/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const analysis = await DatabaseService.getUrlAnalysis(analysisId, userId)
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      })
    }

    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        url: analysis.url,
        status: analysis.status,
        progress: analysis.progress || 0,
        startedAt: analysis.created_at,
        completedAt: analysis.completed_at,
        error: analysis.error_message
      }
    })

  } catch (error) {
    logger.error('Failed to get analysis status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis status'
    })
  }
})

/**
 * GET /api/url-analysis/result/:analysisId
 * Get the complete analysis results
 */
router.get('/result/:analysisId', authMiddleware, async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const analysis = await DatabaseService.getUrlAnalysisWithResults(analysisId, userId)
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      })
    }

    if (analysis.status !== 'completed') {
      return res.status(202).json({
        success: false,
        error: 'Analysis not completed yet',
        status: analysis.status,
        progress: analysis.progress || 0
      })
    }

    // Log for debugging
    logger.info(`📊 Returning analysis result for ${analysisId}`, {
      analysisId,
      hasComprehensiveSEO: !!(analysis.seo_analysis?.comprehensive?.overallScore),
      comprehensiveScore: analysis.seo_analysis?.comprehensive?.overallScore,
      seoKeys: Object.keys(analysis.seo_analysis || {}),
      userId
    })

    // Return comprehensive results
    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        url: analysis.url,
        title: analysis.title,
        status: analysis.status,
        
        // Website data
        technologies: analysis.technologies,
        basic: analysis.basic_website_data,
        performance: analysis.performance_metrics,
        seo: analysis.seo_analysis,
        accessibility: analysis.accessibility_analysis,
        security: analysis.security_analysis,
        lighthouse: analysis.performance_metrics,
        
        // AI insights
        aiInsights: analysis.ai_insights,
        businessRecommendations: analysis.business_recommendations,
        technicalRecommendations: analysis.technical_recommendations,
        riskAssessment: analysis.risk_assessment,
        
        // Metadata
        analysisDate: analysis.created_at,
        completedAt: analysis.completed_at,
        duration: analysis.analysis_duration_ms,
        confidenceScore: analysis.confidence_score
      }
    })

  } catch (error) {
    logger.error('Failed to get analysis result:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis result'
    })
  }
})

/**
 * GET /api/url-analysis/history
 * Get user's URL analysis history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const { analyses, total } = await DatabaseService.getUserUrlAnalyses(userId, {
      page,
      limit,
      orderBy: 'created_at',
      order: 'DESC'
    })

    res.json({
      success: true,
      analyses: analyses.map(analysis => ({
        id: analysis.id,
        url: analysis.url,
        title: analysis.title,
        status: analysis.status,
        createdAt: analysis.created_at,
        completedAt: analysis.completed_at,
        technologies: analysis.technologies,
        confidenceScore: analysis.confidence_score
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Failed to get analysis history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis history'
    })
  }
})

/**
 * DELETE /api/url-analysis/:analysisId
 * Delete a URL analysis
 */
router.delete('/:analysisId', authMiddleware, async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const deleted = await DatabaseService.deleteUrlAnalysis(analysisId, userId)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      })
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    })

  } catch (error) {
    logger.error('Failed to delete analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis'
    })
  }
})

/**
 * POST /api/url-analysis/pagespeed
 * Analyze URL with Google PageSpeed Insights
 */
router.post('/pagespeed', authMiddleware, [
  body('url').isURL().withMessage('Valid URL is required'),
  body('strategy').optional().isIn(['mobile', 'desktop']).withMessage('Strategy must be mobile or desktop')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { url, strategy = 'mobile' } = req.body

    logger.info(`PageSpeed analysis requested for: ${url} (${strategy})`)

    const result = await pageSpeedService.analyzeUrl(url, strategy)

    res.json(result)

  } catch (error) {
    logger.error('PageSpeed analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'PageSpeed analysis failed'
    })
  }
})

/**
 * POST /api/url-analysis/pagespeed/both
 * Analyze URL with both mobile and desktop strategies
 */
router.post('/pagespeed/both', authMiddleware, [
  body('url').isURL().withMessage('Valid URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { url } = req.body

    logger.info(`PageSpeed analysis (both strategies) requested for: ${url}`)

    const result = await pageSpeedService.analyzeWithBothStrategies(url)

    res.json(result)

  } catch (error) {
    logger.error('PageSpeed analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'PageSpeed analysis failed'
    })
  }
})

/**
 * POST /api/url-analysis/security
 * Analyze URL with Mozilla Observatory
 */
router.post('/security', authMiddleware, [
  body('url').isURL().withMessage('Valid URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { url } = req.body

    logger.info(`Security analysis requested for: ${url}`)

    const result = await mozillaObservatoryService.analyzeSecurity(url)

    res.json(result)

  } catch (error) {
    logger.error('Security analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Security analysis failed'
    })
  }
})

/**
 * POST /api/url-analysis/ssl
 * Analyze SSL/TLS with SSL Labs (rate limited!)
 */
router.post('/ssl', authMiddleware, [
  body('hostname').notEmpty().withMessage('Hostname is required'),
  body('fromCache').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { hostname, fromCache = true } = req.body

    logger.info(`SSL analysis requested for: ${hostname}`)

    const result = await sslLabsService.analyzeSSL(hostname, fromCache)

    res.json(result)

  } catch (error) {
    logger.error('SSL analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'SSL analysis failed'
    })
  }
})

/**
 * GET /api/url-analysis/ssl/rate-limit-info/:hostname
 * Check SSL Labs rate limit status for a hostname
 */
router.get('/ssl/rate-limit-info/:hostname', authMiddleware, async (req, res) => {
  try {
    const { hostname } = req.params

    const info = sslLabsService.getCachedScanInfo(hostname)

    res.json({
      success: true,
      ...info
    })

  } catch (error) {
    logger.error('SSL rate limit check error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check rate limit status'
    })
  }
})

export default router 