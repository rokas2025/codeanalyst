// Code Analysis Route - Handles GitHub repos and ZIP file analysis
import express from 'express'
import multer from 'multer'
import { body, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { GitHubService } from '../services/GitHubService.js'
import { ZipService } from '../services/ZipService.js'
import { CodeAnalyzer } from '../services/CodeAnalyzer.js'
import { AIAnalysisService } from '../services/AIAnalysisService.js'
import { AICodeAnalysisService } from '../services/AICodeAnalysisService.js'
import { DatabaseService } from '../services/DatabaseService.js'
// Queue service disabled for Railway deployment (no Redis)
// import { queueService } from '../services/QueueService.js'
import { logger } from '../utils/logger.js'
import { authMiddleware } from '../middleware/auth.js'
import { db } from '../database/connection.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'zip-files')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4()
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueId}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'multipart/x-zip'
    ]
    
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
      cb(null, true)
    } else {
      cb(new Error('Only ZIP files are allowed'), false)
    }
  }
})

/**
 * POST /api/code-analysis/github
 * Analyze a GitHub repository
 */
router.post('/github', authMiddleware, [
  body('repoUrl')
    .matches(/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/)
    .withMessage('Valid GitHub repository URL is required'),
  body('branch')
    .optional()
    .isString()
    .withMessage('Branch must be a string'),
  body('options.aiProfile')
    .optional()
    .isIn(['technical', 'business', 'mixed'])
    .withMessage('aiProfile must be technical, business, or mixed'),
  body('options.includeTests')
    .optional()
    .isBoolean()
    .withMessage('includeTests must be boolean')
], async (req, res) => {
  try {
    logger.info('GitHub analysis request received:', {
      repoUrl: req.body.repoUrl,
      branch: req.body.branch,
      userId: req.user?.id
    })

    // Validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.error('GitHub analysis validation failed:', errors.array())
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { repoUrl, branch = 'main', options = {} } = req.body
    const userId = req.user.id
    const analysisId = uuidv4()

    // Parse GitHub URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!repoMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub repository URL format'
      })
    }

    const [, owner, repo] = repoMatch
    const repoName = repo.replace(/\.git$/, '')

    // Default analysis options
    const analysisOptions = {
      aiProfile: options.aiProfile || 'mixed',
      includeTests: options.includeTests !== false,
      includeDependencies: options.includeDependencies !== false,
      includeDocumentation: options.includeDocumentation !== false,
      deepAnalysis: options.deepAnalysis !== false,
      runSecurityScan: options.runSecurityScan !== false,
      calculateComplexity: options.calculateComplexity !== false,
      branch,
      ...options
    }

    logger.info(`📂 Starting GitHub repository analysis`, {
      analysisId,
      userId,
      repoUrl,
      owner,
      repo: repoName,
      branch,
      options: analysisOptions
    })

    // Check if repository is accessible
    try {
      const githubService = new GitHubService()
      let repoInfo
      
      // First try to access as public repository (no authentication required)
      try {
        repoInfo = await githubService.getRepoInfo(owner, repoName)
        logger.info(`✅ Public repository accessed: ${owner}/${repoName}`)
      } catch (publicAccessError) {
        // If public access fails, try with user's GitHub access token
        logger.info(`❌ Public access failed for ${owner}/${repoName}, trying with user token`)
        
        const user = await DatabaseService.getUserById(userId)
        if (!user?.github_access_token) {
          return res.status(400).json({
            success: false,
            error: 'GitHub account not connected',
            message: 'This repository appears to be private. Please connect your GitHub account to analyze private repositories.'
          })
        }

        repoInfo = await githubService.getRepoInfoWithToken(owner, repoName, user.github_access_token)
        logger.info(`✅ Private repository accessed with user token: ${owner}/${repoName}`)
      }
      
      // Check repository size (limit to 500MB)
      if (repoInfo.size > 500 * 1024) { // Size in KB
        return res.status(400).json({
          success: false,
          error: 'Repository too large',
          message: `Repository size (${Math.round(repoInfo.size / 1024)}MB) exceeds the 500MB limit`
        })
      }
    } catch (error) {
      logger.error('GitHub repository access failed:', {
        owner,
        repo: repoName,
        error: error.message
      })
      return res.status(400).json({
        success: false,
        error: 'Repository not accessible',
        message: 'Could not access the GitHub repository. Please check the URL and ensure it\'s correct.',
        details: error.message
      })
    }

    // Create initial analysis record
    const analysis = await DatabaseService.createCodeAnalysis({
      id: analysisId,
      userId,
      sourceType: 'github',
      sourceReference: repoUrl,
      status: 'pending',
      options: analysisOptions,
      metadata: {
        owner,
        repo: repoName,
        branch
      }
    })

    // 🔥 PREMIUM AI CODE ANALYSIS
    logger.info('🚀 Starting PREMIUM AI Code Analysis')
    
    // Check if premium AI analysis is requested
    if (analysisOptions.aiAnalysis === true || analysisOptions.premium === true) {
      // Start premium AI analysis (don't await - return immediately)
      processPremiumAIAnalysisAsync(analysisId, userId, repoUrl, owner, repoName, branch, analysisOptions)
    } else {
      // Start basic analysis (existing functionality)
      processGitHubAnalysisAsync(analysisId, userId, repoUrl, owner, repoName, branch, analysisOptions)
    }
    
    // Return immediate response with analysis ID
    res.json({
      success: true,
      analysisId,
      status: 'queued',
      message: 'GitHub repository analysis queued successfully',
      repository: {
        owner,
        repo: repoName,
        branch,
        url: repoUrl
      },
      estimatedTime: '3-10 minutes'
    })

  } catch (error) {
    logger.error('GitHub analysis request failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start GitHub analysis',
      message: error.message
    })
  }
})

/**
 * POST /api/code-analysis/zip
 * Analyze uploaded ZIP file
 */
router.post('/zip', authMiddleware, upload.single('zipFile'), [
  body('options.aiProfile')
    .optional()
    .isIn(['technical', 'business', 'mixed'])
    .withMessage('aiProfile must be technical, business, or mixed')
], async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No ZIP file uploaded'
      })
    }

    // Validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { options = {} } = req.body
    const userId = req.user.id
    const analysisId = uuidv4()

    // Default analysis options
    const analysisOptions = {
      aiProfile: options.aiProfile || 'mixed',
      includeTests: options.includeTests !== false,
      includeDependencies: options.includeDependencies !== false,
      includeDocumentation: options.includeDocumentation !== false,
      deepAnalysis: options.deepAnalysis !== false,
      runSecurityScan: options.runSecurityScan !== false,
      calculateComplexity: options.calculateComplexity !== false,
      ...options
    }

    logger.info(`📦 Starting ZIP file analysis`, {
      analysisId,
      userId,
      filename: req.file.originalname,
      size: req.file.size,
      options: analysisOptions
    })

    // Basic ZIP validation
    try {
      const zipService = new ZipService()
      await zipService.validateZipFile(req.file.path, req.file.originalname)
    } catch (error) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      logger.error('ZIP validation failed:', error)
      return res.status(400).json({
        success: false,
        error: 'Invalid ZIP file',
        message: error.message
      })
    }

    // Create initial analysis record
    const analysis = await DatabaseService.createCodeAnalysis({
      id: analysisId,
      userId,
      sourceType: 'zip',
      sourceReference: req.file.originalname,
      status: 'pending',
      options: analysisOptions,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        uploadPath: req.file.path
      }
    })

    // Process ZIP analysis synchronously (no Redis queues on Railway)
    try {
      logger.info(`🚀 Processing ZIP analysis synchronously: ${analysisId}`)
      
      await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 10)

      // Step 1: Extract ZIP file
      const zipService = new ZipService()
      const extractedData = await zipService.extractZipFile(req.file.path, analysisId, req.file.originalname)
      await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 30)
      
      // Step 2: Analyze Code Structure
      const codeAnalyzer = new CodeAnalyzer()
      const codeAnalysis = await codeAnalyzer.analyzeCodebase(extractedData.extractPath, analysisOptions)
      await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 60)
      
      // Step 3: Store code analysis data
      await DatabaseService.updateCodeAnalysisData(analysisId, {
        total_files: codeAnalysis.totalFiles,
        total_lines: codeAnalysis.totalLines,
        languages: codeAnalysis.languages,
        frameworks: codeAnalysis.frameworks,
        code_quality_score: codeAnalysis.qualityScore,
        technical_debt_percentage: codeAnalysis.technicalDebt,
        test_coverage_percentage: codeAnalysis.testCoverage,
        complexity_score: codeAnalysis.complexity,
        test_results: codeAnalysis.testResults,
        build_results: codeAnalysis.buildResults,
        static_analysis_results: codeAnalysis.staticAnalysis
      })
      
      // Step 4: AI Analysis
      let aiInsights = null
      if (analysisOptions.includeAI !== false) {
        try {
          logger.info(`🤖 Generating AI insights for code analysis`)
          const { default: AIAnalysisService } = await import('../services/AIAnalysisService.js')
          const aiAnalysisService = new AIAnalysisService()
          
          const aiInputData = {
            sourceType: 'zip',
            filename: req.file.originalname,
            codeStructure: codeAnalysis,
            files: codeAnalysis.keyFiles,
            metrics: {
              quality: codeAnalysis.qualityScore,
              complexity: codeAnalysis.complexity,
              testCoverage: codeAnalysis.testCoverage
            }
          }
          
          aiInsights = await aiAnalysisService.generateCodeInsights(aiInputData, analysisOptions.aiProfile || 'mixed')
          await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 90)
        } catch (aiError) {
          logger.warn(`AI insights generation failed: ${aiError.message}`)
        }
      }

      const finalResult = {
        ...codeAnalysis,
        aiInsights,
        completedAt: new Date().toISOString()
      }

      await DatabaseService.updateCodeAnalysisStatus(analysisId, 'completed', 100)
      await DatabaseService.updateCodeAnalysisData(analysisId, finalResult)

      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      
      res.json({
        success: true,
        analysisId,
        status: 'completed',
        data: finalResult,
        message: 'ZIP file analysis completed successfully!',
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          analyzedAt: new Date().toISOString()
        },
        processingTime: 'immediate'
      })

    } catch (analysisError) {
      logger.error(`ZIP analysis failed: ${analysisError.message}`, analysisError)
      await DatabaseService.updateCodeAnalysisStatus(analysisId, 'failed', 0, analysisError.message)
      
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      
      res.status(500).json({
        success: false,
        analysisId,
        error: 'Analysis failed',
        message: analysisError.message
      })
    }

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    
    logger.error('ZIP analysis request failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to queue ZIP analysis',
      message: error.message
    })
  }
})

/**
 * GET /api/code-analysis/status/:analysisId
 * Check the status of a code analysis
 */
router.get('/status/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const analysis = await DatabaseService.getCodeAnalysis(analysisId, userId)
    
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
        sourceType: analysis.source_type,
        sourceReference: analysis.source_reference,
        status: analysis.status,
        progress: analysis.progress || 0,
        startedAt: analysis.created_at,
        completedAt: analysis.completed_at,
        error: analysis.error_message,
        metadata: analysis.metadata
      }
    })

  } catch (error) {
    logger.error('Failed to get code analysis status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis status'
    })
  }
})

/**
 * GET /api/code-analysis/result/:analysisId
 * Get the complete code analysis results
 */
router.get('/result/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const analysis = await DatabaseService.getCodeAnalysisWithResults(analysisId, userId)
    
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

    // Return comprehensive results
    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        sourceType: analysis.source_type,
        sourceReference: analysis.source_reference,
        status: analysis.status,
        
        // Code structure
        totalFiles: analysis.total_files,
        totalLines: analysis.total_lines,
        languages: analysis.languages,
        frameworks: analysis.frameworks,
        
        // Quality metrics
        codeQualityScore: analysis.code_quality_score,
        technicalDebtPercentage: analysis.technical_debt_percentage,
        testCoveragePercentage: analysis.test_coverage_percentage,
        complexityScore: analysis.complexity_score,
        
        // AI analysis
        systemOverview: analysis.system_overview,
        technicalStructure: analysis.technical_structure,
        maintenanceNeeds: analysis.maintenance_needs,
        aiExplanations: analysis.ai_explanations,
        businessRecommendations: analysis.business_recommendations,
        riskAssessment: analysis.risk_assessment,
        
        // Execution results
        testResults: analysis.test_results,
        buildResults: analysis.build_results,
        staticAnalysisResults: analysis.static_analysis_results,
        
        // Metadata
        analysisDate: analysis.created_at,
        completedAt: analysis.completed_at,
        duration: analysis.analysis_duration_ms,
        metadata: analysis.metadata
      }
    })

  } catch (error) {
    logger.error('Failed to get code analysis result:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis result'
    })
  }
})

/**
 * GET /api/code-analysis/history
 * Get user's code analysis history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const sourceType = req.query.sourceType // 'github' or 'zip' filter

    const { analyses, total } = await DatabaseService.getUserCodeAnalyses(userId, {
      page,
      limit,
      sourceType,
      orderBy: 'created_at',
      order: 'DESC'
    })

    res.json({
      success: true,
      analyses: analyses.map(analysis => ({
        id: analysis.id,
        sourceType: analysis.source_type,
        sourceReference: analysis.source_reference,
        status: analysis.status,
        createdAt: analysis.created_at,
        completedAt: analysis.completed_at,
        totalFiles: analysis.total_files,
        totalLines: analysis.total_lines,
        languages: analysis.languages,
        codeQualityScore: analysis.code_quality_score,
        metadata: analysis.metadata
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Failed to get code analysis history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis history'
    })
  }
})

/**
 * DELETE /api/code-analysis/:analysisId
 * Delete a code analysis and associated files
 */
router.delete('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params
    const userId = req.user.id

    const analysis = await DatabaseService.getCodeAnalysis(analysisId, userId)
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      })
    }

    // Clean up uploaded files if it's a ZIP analysis
    if (analysis.source_type === 'zip' && analysis.metadata?.uploadPath) {
      try {
        await fs.unlink(analysis.metadata.uploadPath)
        logger.info(`Cleaned up ZIP file: ${analysis.metadata.uploadPath}`)
      } catch (error) {
        logger.warn(`Failed to clean up ZIP file: ${error.message}`)
      }
    }

    const deleted = await DatabaseService.deleteCodeAnalysis(analysisId, userId)
    
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
    logger.error('Failed to delete code analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis'
    })
  }
})

/**
 * GET /api/code-analysis/history
 * Get user's analysis history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    
    const query = `
      SELECT id, source_type, status, progress, metadata, created_at, completed_at, error_message
      FROM code_analyses 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `
    
    const result = await db.query(query, [userId])
    
    const analyses = result.rows.map(row => ({
      id: row.id,
      sourceType: row.source_type,
      status: row.status,
      progress: row.progress,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      metadata: row.metadata,
      errorMessage: row.error_message
    }))
    
    res.json({
      success: true,
      analyses
    })
    
  } catch (error) {
    logger.error('Failed to get analysis history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    })
  }
})

/**
 * GET /api/code-analysis/history
 * Get analysis history for the user
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0
    
    const query = `
      SELECT id, source_type, source_reference, status, progress, 
             total_files, total_lines, languages, code_quality_score,
             created_at, completed_at, error_message
      FROM code_analyses 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `
    
    const result = await db.query(query, [userId, limit, offset])
    
    const analyses = result.rows.map(row => ({
      id: row.id,
      sourceType: row.source_type,
      sourceReference: row.source_reference,
      status: row.status,
      progress: row.progress,
      totalFiles: row.total_files,
      totalLines: row.total_lines,
      languages: row.languages || [],
      codeQualityScore: row.code_quality_score,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message
    }))
    
    res.json({
      success: true,
      analyses,
      total: result.rows.length
    })
    
  } catch (error) {
    logger.error('Failed to get analysis history:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/code-analysis/latest/:repoUrl
 * Get latest successful analysis for a repository
 */
router.get('/latest/:repoUrl', authMiddleware, async (req, res) => {
  try {
    const repoUrl = decodeURIComponent(req.params.repoUrl)
    const userId = req.user.id
    
    const query = `
      SELECT id, source_type, status, progress, metadata, created_at, completed_at, error_message,
             system_overview, technical_structure, maintenance_needs, ai_explanations, 
             business_recommendations, risk_assessment, 
             total_files, total_lines, languages, frameworks, code_quality_score, 
             technical_debt_percentage, test_coverage_percentage, complexity_score
      FROM code_analyses 
      WHERE source_reference = $1 AND user_id = $2 AND status = 'completed' AND total_files IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    const result = await db.query(query, [repoUrl, userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No successful analysis found for this repository'
      })
    }
    
    const row = result.rows[0]
    const analysis = {
      id: row.id,
      sourceType: row.source_type,
      status: row.status,
      progress: row.progress,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      metadata: row.metadata,
      errorMessage: row.error_message,
      results: {
        systemOverview: row.system_overview,
        technicalStructure: row.technical_structure,
        maintenanceNeeds: row.maintenance_needs,
        aiExplanations: row.ai_explanations,
        businessRecommendations: row.business_recommendations,
        riskAssessment: row.risk_assessment,
        totalFiles: row.total_files,
        totalLines: row.total_lines,
        languages: row.languages,
        frameworks: row.frameworks,
        codeQualityScore: row.code_quality_score,
        technicalDebtPercentage: row.technical_debt_percentage,
        testCoveragePercentage: row.test_coverage_percentage,
        complexityScore: row.complexity_score
      }
    }
    
    res.json({
      success: true,
      analysis
    })
    
  } catch (error) {
    logger.error('Failed to get latest analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/code-analysis/:id
 * Get specific analysis by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    logger.info(`🔍 Fetching analysis ${id} for user ${userId}`)
    
    const query = `
      SELECT id, source_type, status, progress, metadata, created_at, completed_at, error_message,
             system_overview, technical_structure, maintenance_needs, ai_explanations, 
             business_recommendations, risk_assessment, 
             total_files, total_lines, languages, frameworks, code_quality_score, 
             technical_debt_percentage, test_coverage_percentage, complexity_score
      FROM code_analyses 
      WHERE id = $1 AND user_id = $2
    `
    
    const result = await db.query(query, [id, userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      })
    }
    
    const row = result.rows[0]
    const analysis = {
      id: row.id,
      sourceType: row.source_type,
      status: row.status,
      progress: row.progress,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      metadata: row.metadata,
      errorMessage: row.error_message,
      results: row.status === 'completed' ? {
        systemOverview: row.system_overview,
        technicalStructure: row.technical_structure,
        maintenanceNeeds: row.maintenance_needs,
        aiExplanations: row.ai_explanations,
        businessRecommendations: row.business_recommendations,
        riskAssessment: row.risk_assessment,
        totalFiles: row.total_files,
        totalLines: row.total_lines,
        languages: row.languages,
        frameworks: row.frameworks,
        codeQualityScore: row.code_quality_score,
        technicalDebtPercentage: row.technical_debt_percentage,
        testCoveragePercentage: row.test_coverage_percentage,
        complexityScore: row.complexity_score
      } : null
    }
    
    res.json({
      success: true,
      analysis
    })
    
  } catch (error) {
    logger.error('Failed to get analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    })
  }
})

// TEMP FIX: Async GitHub analysis processor (bypasses queue system)
async function processGitHubAnalysisAsync(analysisId, userId, repoUrl, owner, repoName, branch, analysisOptions) {
  try {
    logger.info(`🔍 Starting GitHub analysis: ${analysisId}`)
    
    // Update status to analyzing
    await db.query(`
      UPDATE code_analyses 
      SET status = 'analyzing', progress = 10
      WHERE id = $1
    `, [analysisId])

    // Get user's GitHub access token for private repos
    const user = await db.query('SELECT github_access_token FROM users WHERE id = $1', [userId])
    const accessToken = user.rows[0]?.github_access_token

    // Initialize GitHub service and get repo info
    const githubService = new GitHubService()
    const repoInfo = await githubService.getRepoInfoWithToken(owner, repoName, accessToken)
    
    logger.info(`📁 Repository info retrieved: ${repoInfo.name} (${repoInfo.size}KB)`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 30
      WHERE id = $1
    `, [analysisId])

    // Fetch repository content via API (no cloning!)
    const repoContent = await githubService.fetchRepositoryContent(owner, repoName, accessToken, branch)
    logger.info(`📡 Repository content fetched: ${repoContent.analyzedFiles} files`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 50
      WHERE id = $1
    `, [analysisId])

    // Analyze the code from API content
    const codeAnalyzer = new CodeAnalyzer()
    const analysisResult = await codeAnalyzer.analyzeAPIContent(repoContent, analysisOptions)
    
    // Add file structure to technical structure
    if (analysisResult.technicalStructure) {
      analysisResult.technicalStructure.files = repoContent.files || []
      analysisResult.technicalStructure.fileStructure = repoContent.files || []
    } else {
      analysisResult.technicalStructure = {
        files: repoContent.files || [],
        fileStructure: repoContent.files || []
      }
    }
    
    logger.info(`📊 Code analysis completed for: ${repoName}`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 80
      WHERE id = $1
    `, [analysisId])

    // Store results in database
    await db.query(`
      UPDATE code_analyses 
      SET 
        status = 'completed',
        progress = 100,
        completed_at = NOW(),
        system_overview = $2,
        technical_structure = $3,
        maintenance_needs = $4,
        ai_explanations = $5,
        business_recommendations = $6,
        risk_assessment = $7,
        total_files = $8,
        total_lines = $9,
        languages = $10,
        frameworks = $11,
        code_quality_score = $12,
        technical_debt_percentage = $13,
        test_coverage_percentage = $14,
        complexity_score = $15
      WHERE id = $1
    `, [
      analysisId,
      JSON.stringify(analysisResult.systemOverview || {}),
      JSON.stringify(analysisResult.technicalStructure || {}),
      JSON.stringify(analysisResult.maintenanceNeeds || {}),
      JSON.stringify(analysisResult.aiExplanations || {}),
      JSON.stringify(analysisResult.businessRecommendations || {}),
      JSON.stringify(analysisResult.riskAssessment || {}),
      analysisResult.totalFiles || 0,
      analysisResult.totalLines || 0,
      Object.keys(analysisResult.languages || {}),
      analysisResult.frameworks || [],
      analysisResult.codeQualityScore || 0,
      analysisResult.technicalDebtPercentage || 0,
      analysisResult.testCoveragePercentage || 0,
      analysisResult.complexityScore || 0
    ])

    logger.info(`✅ GitHub analysis completed successfully: ${analysisId}`)

    // No cleanup needed - we used API instead of cloning!

  } catch (error) {
    logger.error(`❌ GitHub analysis failed: ${error.message}`, error)
    
    // Update status to failed
    await db.query(`
      UPDATE code_analyses 
      SET status = 'failed', error_message = $2
      WHERE id = $1
    `, [analysisId, error.message])
  }
}

// Generate intelligent project summary based on actual code analysis
async function generateIntelligentProjectSummary(analysis, repoContent) {
  const packageJsonFile = repoContent.files.find(f => f.path === 'package.json')
  const readmeFile = repoContent.files.find(f => f.path.toLowerCase().includes('readme'))
  
  let summary = ''
  let projectName = 'application'
  let technologies = []
  let features = []
  
  // Extract project name and description from package.json
  if (packageJsonFile && packageJsonFile.content) {
    try {
      const packageJson = JSON.parse(packageJsonFile.content)
      if (packageJson.name) {
        projectName = packageJson.name.replace(/[-_]/g, ' ')
      }
      if (packageJson.description) {
        summary = packageJson.description + '. '
      }
      
      // Detect technologies from dependencies
      const deps = {...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {})}
      if (deps.react) technologies.push('React')
      if (deps.vue) technologies.push('Vue.js')
      if (deps.angular) technologies.push('Angular')
      if (deps.express) technologies.push('Express.js')
      if (deps.next) technologies.push('Next.js')
      if (deps['@nestjs/core']) technologies.push('NestJS')
      if (deps.fastify) technologies.push('Fastify')
      if (deps.vite) technologies.push('Vite')
      if (deps.webpack) technologies.push('Webpack')
      if (deps.tailwindcss) technologies.push('Tailwind CSS')
      if (deps.typescript) technologies.push('TypeScript')
      
    } catch (error) {
      logger.warn('Failed to parse package.json for summary generation')
    }
  }
  
  // Detect features and architecture from file structure
  const fileNames = repoContent.files.map(f => f.path.toLowerCase())
  
  if (fileNames.some(f => f.includes('api') || f.includes('route'))) {
    features.push('API endpoints')
  }
  if (fileNames.some(f => f.includes('component'))) {
    features.push('reusable components')
  }
  if (fileNames.some(f => f.includes('auth'))) {
    features.push('authentication system')
  }
  if (fileNames.some(f => f.includes('database') || f.includes('db'))) {
    features.push('database integration')
  }
  if (fileNames.some(f => f.includes('test'))) {
    features.push('testing framework')
  }
  if (fileNames.some(f => f.includes('doc'))) {
    features.push('documentation')
  }
  
  // Build intelligent summary
  if (!summary) {
    summary = `This ${projectName} appears to be a `
    
    if (technologies.includes('React') && technologies.includes('Express.js')) {
      summary += 'full-stack web application built with React for the frontend and Express.js for the backend'
    } else if (technologies.includes('React')) {
      summary += 'React-based web application'
    } else if (technologies.includes('Vue.js')) {
      summary += 'Vue.js web application'
    } else if (technologies.includes('Angular')) {
      summary += 'Angular web application'
    } else if (technologies.includes('Express.js')) {
      summary += 'Node.js backend application using Express.js'
    } else if (technologies.includes('Next.js')) {
      summary += 'Next.js full-stack application'
    } else {
      summary += 'web application'
    }
    
    if (technologies.length > 0) {
      summary += '. It utilizes modern technologies including ' + technologies.slice(0, 4).join(', ')
    }
    
    if (features.length > 0) {
      summary += '. The application includes ' + features.slice(0, 3).join(', ')
    }
    
    summary += '. The codebase follows modern development practices and is structured for maintainability and scalability.'
  }
  
  return summary
}

// Generate detailed project type description 
async function generateProjectTypeDescription(analysis, repoContent) {
  const packageJsonFile = repoContent.files.find(f => f.path === 'package.json')
  
  if (packageJsonFile && packageJsonFile.content) {
    try {
      const packageJson = JSON.parse(packageJsonFile.content)
      const deps = {...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {})}
      
      // Detailed architecture description based on actual dependencies
      let description = 'The application follows a '
      
      if (deps.react && deps.express) {
        description += 'typical modern web application architecture with a frontend built using React and a backend built using Express. The application is modular with clear separation of concerns, which is evident from the structure of the components and pages. The use of async/await for handling promises is a good practice.'
      } else if (deps.react) {
        description += 'React-based frontend architecture with component-driven development. The application uses modern React patterns and hooks for state management.'
      } else if (deps.express) {
        description += 'RESTful API architecture built with Express.js, featuring middleware-based request processing and modular route handling.'
      } else if (deps.next) {
        description += 'Next.js full-stack architecture with server-side rendering capabilities and API routes for backend functionality.'
      } else {
        description += 'modern web application architecture with clear separation of concerns and modular design.'
      }
      
      // Add technology stack details
      const modernTools = []
      if (deps.vite) modernTools.push('Vite')
      if (deps.tailwindcss) modernTools.push('Tailwind CSS')
      if (deps.typescript) modernTools.push('TypeScript')
      if (deps.postcss) modernTools.push('PostCSS')
      if (deps.eslint) modernTools.push('ESLint')
      
      if (modernTools.length > 0) {
        description += ` The application also uses modern libraries and tools such as ${modernTools.join(', ')}.`
      }
      
      return description
      
    } catch (error) {
      logger.warn('Failed to parse package.json for project type generation')
    }
  }
  
  return 'Modern web application with well-structured architecture and contemporary development practices.'
}

// Transform languages to match the old format (file extensions instead of language names)
function transformLanguagesToOldFormat(files) {
  const extensions = new Set()
  
  for (const file of files) {
    if (file.path) {
      const ext = path.extname(file.path).toLowerCase()
      if (ext) {
        extensions.add(ext)
      } else {
        // For files without extension, add empty string like the old format
        extensions.add('')
      }
    }
  }
  
  return Array.from(extensions).sort()
}

// Transform dependency analysis to match the old format that had rich dependency lists
async function transformDependenciesToOldFormat(dependencyAnalysis, files) {
  const result = {
    production: [],
    development: [],
    scripts: []
  }
  
  // Find package.json to extract actual dependency names
  const packageJsonFile = files.find(f => f.path === 'package.json')
  if (packageJsonFile && packageJsonFile.content) {
    try {
      const packageJson = JSON.parse(packageJsonFile.content)
      
      // Extract production dependencies
      if (packageJson.dependencies) {
        result.production = Object.keys(packageJson.dependencies)
      }
      
      // Extract development dependencies  
      if (packageJson.devDependencies) {
        result.development = Object.keys(packageJson.devDependencies)
      }
      
      // Extract scripts
      if (packageJson.scripts) {
        result.scripts = Object.keys(packageJson.scripts)
      }
      
    } catch (error) {
      logger.warn('Failed to parse package.json for dependency transformation:', error)
    }
  }
  
  return result
}

// Generate rich AI recommendations based on code analysis
async function generateRichAIRecommendations(codeAnalysisResult, aiResults) {
  const recommendations = []
  
  // Generate testing recommendations based on actual coverage
  const testCoverage = codeAnalysisResult.testCoveragePercentage || 0
  if (testCoverage < 80) {
    recommendations.push({
      area: 'Test Coverage',
      type: 'testing_improvement',
      files: ['test files'],
      priority: testCoverage < 20 ? 'urgent' : 'high',
      codeExample: '// Add comprehensive unit tests for better coverage',
      description: `Increase test coverage from ${testCoverage}% to at least 80%`,
      businessImpact: 'Reduced bugs and improved code reliability'
    })
  }
  
  // Generate security recommendations based on analysis
  if (codeAnalysisResult.securityIssues && codeAnalysisResult.securityIssues.length > 0) {
    for (const issue of codeAnalysisResult.securityIssues) {
      recommendations.push({
        area: issue.description || 'Security Issue',
        type: 'security_fix',
        files: issue.files || ['security-related'],
        priority: issue.severity === 'high' ? 'urgent' : 'high',
        codeExample: `// SECURITY FIX: ${issue.description}`,
        description: `Fix security vulnerability: ${issue.description}`,
        businessImpact: 'Enhanced security and risk reduction'
      })
    }
  }
  
  // Generate quality recommendations based on actual score
  const qualityScore = codeAnalysisResult.codeQualityScore || 70
  if (qualityScore < 80) {
    recommendations.push({
      area: 'Code Quality',
      type: 'code_improvement',
      files: ['multiple'],
      priority: qualityScore < 50 ? 'urgent' : 'high',
      codeExample: '// TODO: Improve code quality and maintainability',
      description: `Improve overall code quality from ${qualityScore}/100 to at least 80/100`,
      businessImpact: 'Improved code quality and maintainability'
    })
  }
  
  // Generate dependency recommendations
  if (codeAnalysisResult.outdatedDependencies && codeAnalysisResult.outdatedDependencies > 0) {
    recommendations.push({
      area: 'Dependency Updates',
      type: 'maintenance',
      files: ['package.json', 'requirements.txt'],
      priority: 'medium',
      codeExample: '// Update outdated dependencies to latest versions',
      description: `Update ${codeAnalysisResult.outdatedDependencies} outdated dependencies`,
      businessImpact: 'Improved security and performance'
    })
  }
  
  // Add AI-generated recommendations from aiResults if available
  if (aiResults?.maintenanceNeeds?.aiRecommendations) {
    recommendations.push(...aiResults.maintenanceNeeds.aiRecommendations)
  }
  
  return recommendations
}

// 🔥 PREMIUM AI Analysis Processor (THE REAL DEAL)
async function processPremiumAIAnalysisAsync(analysisId, userId, repoUrl, owner, repoName, branch, analysisOptions) {
  try {
    logger.info(`🤖 Starting PREMIUM AI analysis: ${analysisId}`)
    
    // Update status to analyzing
    await db.query(`
      UPDATE code_analyses 
      SET status = 'analyzing', progress = 5
      WHERE id = $1
    `, [analysisId])

    // Get user's GitHub access token for private repo access
    const userResult = await db.query('SELECT github_access_token FROM users WHERE id = $1', [userId])
    const accessToken = userResult.rows[0]?.github_access_token
    
    if (!accessToken) {
      throw new Error('GitHub access token not found. Please reconnect your GitHub account.')
    }

    // Initialize services  
    const githubService = new GitHubService()
    const codeAnalyzer = new CodeAnalyzer()
    const aiAnalysisService = new AIAnalysisService()
    
    logger.info(`🚀 Starting comprehensive repository analysis and AI insights...`)
    
    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 15
      WHERE id = $1
    `, [analysisId])

    // Step 1: Get repository info
    const repoInfo = await githubService.getRepoInfoWithToken(owner, repoName, accessToken)
    logger.info(`📁 Repository info retrieved: ${repoInfo.name} (${repoInfo.size}KB)`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 30
      WHERE id = $1
    `, [analysisId])

    // Step 2: Fetch repository content via API (same as basic analysis)
    const repoContent = await githubService.fetchRepositoryContent(owner, repoName, accessToken, branch)
    logger.info(`📡 Repository content fetched: ${repoContent.analyzedFiles} files`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 50
      WHERE id = $1
    `, [analysisId])

    // Step 3: Analyze the actual code content (this gives us real metrics)
    const codeAnalysisResult = await codeAnalyzer.analyzeAPIContent(repoContent, analysisOptions)
    logger.info(`📊 Code analysis completed for: ${repoName}`)
    
    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 70
      WHERE id = $1
    `, [analysisId])

    // Step 4: Generate AI insights based on real code analysis
    const aiInputData = {
      sourceType: 'github',
      repository: { owner, repo: repoName, branch },
      codeStructure: codeAnalysisResult,
      files: repoContent.files || [],
      metrics: {
        quality: codeAnalysisResult.codeQualityScore || 70,
        complexity: codeAnalysisResult.complexityScore || 5,
        testCoverage: codeAnalysisResult.testCoveragePercentage || 0
      }
    }
    
    logger.info(`🧠 Generating AI insights with comprehensive analysis...`)
    const aiResults = await aiAnalysisService.generateCodeInsights(aiInputData, repoContent.files.slice(0, 10) || [], { 
      profile: analysisOptions.aiProfile || 'mixed'
    })
    
    // Step 5: Generate rich AI recommendations based on real analysis
    const aiRecommendations = await generateRichAIRecommendations(codeAnalysisResult, aiResults)
    
    // Combine real code analysis with AI insights
    const premiumAnalysis = {
      ...codeAnalysisResult,
      aiResults,
      improvements: aiRecommendations,
      summary: {
        totalFiles: codeAnalysisResult.totalFiles,
        totalLines: codeAnalysisResult.totalLines,
        languages: codeAnalysisResult.languages
      }
    }
    
    logger.info(`🧠 AI analysis completed with ${premiumAnalysis.improvements?.length || 0} improvement areas identified`)

    // Update progress
    await db.query(`
      UPDATE code_analyses 
      SET progress = 80
      WHERE id = $1
    `, [analysisId])

    // Store PREMIUM results in database with enhanced structure
    await db.query(`
      UPDATE code_analyses 
      SET 
        status = 'completed',
        progress = 100,
        completed_at = NOW(),
        system_overview = $2,
        technical_structure = $3,
        maintenance_needs = $4,
        ai_explanations = $5,
        business_recommendations = $6,
        risk_assessment = $7,
        total_files = $8,
        total_lines = $9,
        languages = $10,
        frameworks = $11,
        code_quality_score = $12,
        technical_debt_percentage = $13,
        test_coverage_percentage = $14,
        complexity_score = $15
      WHERE id = $1
    `, [
      analysisId,
      JSON.stringify({
        summary: await generateIntelligentProjectSummary(premiumAnalysis, repoContent),
        projectType: await generateProjectTypeDescription(premiumAnalysis, repoContent), 
        aiPowered: true,
        timestamp: new Date().toISOString(),
        analysisQuality: 'high'
      }),
      JSON.stringify({
        architecture: premiumAnalysis.aiResults?.technicalStructure?.architecture || premiumAnalysis.aiAnalysis?.architecture || 'AI analysis',
        dependencies: await transformDependenciesToOldFormat(premiumAnalysis.dependencies, repoContent.files),
        aiInsights: premiumAnalysis.aiResults?.technicalStructure?.aiInsights || premiumAnalysis.aiAnalysis || {},
        files: repoContent.files || [],
        fileStructure: repoContent.files || []
      }),
      JSON.stringify({
        criticalIssues: premiumAnalysis.aiAnalysis?.technicalDebt || [],
        securityVulnerabilities: premiumAnalysis.aiAnalysis?.security?.vulnerabilities || [],
        codeSmells: premiumAnalysis.aiAnalysis?.codeQuality?.weaknesses || [],
        technicalDebt: premiumAnalysis.aiAnalysis?.codeQuality?.score || 0,
        aiRecommendations: premiumAnalysis.improvements || []
      }),
      JSON.stringify({
        summary: premiumAnalysis.aiResults?.aiExplanations?.summary || premiumAnalysis.aiAnalysis?.overview || 'Comprehensive AI analysis performed',
        recommendations: premiumAnalysis.aiResults?.aiExplanations?.recommendations || premiumAnalysis.aiAnalysis?.technicalDebt || [],
        businessImpact: premiumAnalysis.aiResults?.aiExplanations?.businessImpact || premiumAnalysis.aiAnalysis?.businessImpact || 'Analysis completed',
        riskAssessment: premiumAnalysis.aiResults?.aiExplanations?.riskAssessment || premiumAnalysis.aiAnalysis?.security?.recommendations || [],
        aiProvider: 'GPT-4/Claude',
        analysisType: 'Premium AI Analysis'
      }),
      JSON.stringify({
        priority: premiumAnalysis.aiAnalysis?.priority || 'medium',
        aiGenerated: true,
        riskLevel: premiumAnalysis.aiAnalysis?.security?.score > 7 ? 'low' : 'medium',
        investmentNeeded: 'AI-calculated estimate',
        businessValue: 'high',
        aiGenerated: true
      }),
      JSON.stringify({
        securityRisks: {
          score: premiumAnalysis.aiAnalysis?.security?.score || 7,
          critical: [],
          high: premiumAnalysis.aiAnalysis?.security?.vulnerabilities || [],
          medium: [],
          low: [],
          totalIssues: premiumAnalysis.aiAnalysis?.security?.vulnerabilities?.length || 0
        },
        performanceRisks: {
          score: premiumAnalysis.aiAnalysis?.performance?.score || 7,
          issues: premiumAnalysis.aiAnalysis?.performance?.bottlenecks || [],
          recommendations: premiumAnalysis.aiAnalysis?.performance?.optimizations || []
        },
        maintainabilityRisks: {
          technicalDebt: premiumAnalysis.aiAnalysis?.codeQuality?.score || 7,
          testCoverage: parseInt(premiumAnalysis.aiAnalysis?.testing?.coverage || '0'),
          codeComplexity: 5
        }
      }),
      premiumAnalysis.totalFiles || 0,
      premiumAnalysis.totalLines || 0,
      transformLanguagesToOldFormat(repoContent.files),
      [], // Keep frameworks empty like the old analysis
      premiumAnalysis.codeQualityScore || 70,
      premiumAnalysis.technicalDebtPercentage || 30,
      premiumAnalysis.testCoveragePercentage || 0,
      premiumAnalysis.complexityScore || 5
    ])

    logger.info(`✅ PREMIUM AI analysis completed successfully: ${analysisId}`)
    
    // Optional: Generate PR suggestions if requested
    if (analysisOptions.createPRs) {
      logger.info(`🔄 Generating PR suggestions for improvements...`)
      
      try {
        const prSuggestions = await generatePRSuggestions(premiumAnalysis, repoUrl, accessToken)
        logger.info(`✅ Generated ${prSuggestions.length} PR suggestions`)
        
        // Store PR suggestions in the database
        await db.query(`
          UPDATE code_analyses 
          SET metadata = metadata || $2
          WHERE id = $1
        `, [analysisId, JSON.stringify({ prSuggestions })])
        
      } catch (error) {
        logger.error(`Failed to generate PR suggestions: ${error.message}`)
      }
    }

    // Optional: Generate documentation if requested
    if (analysisOptions.generateDocs) {
      logger.info(`📝 Generating AI-powered documentation...`)
      
      try {
        const documentation = await generateDocumentation(premiumAnalysis, repoUrl, accessToken)
        logger.info(`✅ Generated ${documentation.length} documentation files`)
        
        // Store documentation in the database
        await db.query(`
          UPDATE code_analyses 
          SET metadata = metadata || $2
          WHERE id = $1
        `, [analysisId, JSON.stringify({ documentation })])
        
      } catch (error) {
        logger.error(`Failed to generate documentation: ${error.message}`)
      }
    }

  } catch (error) {
    logger.error(`❌ PREMIUM AI analysis failed: ${error.message}`, error)
    
    // Update status to failed
    await db.query(`
      UPDATE code_analyses 
      SET status = 'failed', error_message = $2
      WHERE id = $1
    `, [analysisId, error.message])
  }
}

// 🔄 Generate PR Suggestions based on AI analysis
async function generatePRSuggestions(premiumAnalysis, repoUrl, accessToken) {
  const suggestions = []
  
  if (!premiumAnalysis.improvements || premiumAnalysis.improvements.length === 0) {
    return suggestions
  }

  for (const improvement of premiumAnalysis.improvements) {
    if (improvement.type === 'security_fix') {
      suggestions.push({
        title: `🔒 Security Fix: ${improvement.area}`,
        description: improvement.description,
        priority: improvement.priority,
        files: improvement.files,
        codeChanges: improvement.codeExample,
        branch: `security-fix-${Date.now()}`,
        type: 'security'
      })
    } else if (improvement.type === 'code_improvement') {
      suggestions.push({
        title: `✨ Code Improvement: ${improvement.area}`,
        description: improvement.description,
        priority: improvement.priority,
        files: improvement.files,
        codeChanges: improvement.codeExample,
        branch: `improvement-${Date.now()}`,
        type: 'enhancement'
      })
    }
  }

  // Add AI-generated test improvements
  if (premiumAnalysis.aiAnalysis?.testing?.gaps) {
    suggestions.push({
      title: '🧪 Add Missing Tests',
      description: 'Implement comprehensive test coverage based on AI analysis',
      priority: 'medium',
      files: ['tests/'],
      codeChanges: `// Generated test templates
// TODO: Implement tests for ${premiumAnalysis.aiAnalysis.testing.gaps.join(', ')}`,
      branch: `add-tests-${Date.now()}`,
      type: 'testing'
    })
  }

  return suggestions
}

// 📝 Generate Documentation based on AI analysis
async function generateDocumentation(premiumAnalysis, repoUrl, accessToken) {
  const docs = []

  if (premiumAnalysis.aiAnalysis?.overview) {
    docs.push({
      type: 'README',
      title: 'Updated README.md',
      content: `# ${repoUrl.split('/').pop()}

## Overview
${premiumAnalysis.aiAnalysis.overview}

## Architecture
${premiumAnalysis.aiAnalysis.architecture || 'Modern application architecture'}

## Setup Instructions
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run the application

## Code Quality
- Overall Score: ${premiumAnalysis.aiAnalysis.codeQuality?.score || 'N/A'}/10
- Technical Debt: ${premiumAnalysis.aiAnalysis.codeQuality?.reasoning || 'See analysis'}

## Security
${premiumAnalysis.aiAnalysis.security?.recommendations?.join('\n- ') || 'No security recommendations'}

## Performance
${premiumAnalysis.aiAnalysis.performance?.optimizations?.join('\n- ') || 'No performance recommendations'}

---
*Generated by AI CodeAnalyst*
`
    })
  }

  return docs
}

/**
 * DELETE /api/code-analysis/:id
 * Delete analysis by ID
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    // First check if analysis exists and belongs to user
    const checkQuery = `
      SELECT id FROM code_analyses 
      WHERE id = $1 AND user_id = $2
    `
    
    const checkResult = await db.query(checkQuery, [id, userId])
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found or access denied'
      })
    }
    
    // Delete the analysis
    await db.query('DELETE FROM code_analyses WHERE id = $1 AND user_id = $2', [id, userId])
    
    logger.info(`🗑️ Analysis deleted: ${id} by user ${userId}`)
    
    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    })
    
  } catch (error) {
    logger.error('Failed to delete analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Fetch GitHub file structure on-demand for existing analyses
router.post('/github/files', authMiddleware, async (req, res) => {
  try {
    const { owner, repo, branch = 'main' } = req.body
    const userId = req.user.id
    
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: 'Owner and repo are required'
      })
    }
    
    logger.info(`🔍 Fetching file structure for ${owner}/${repo}`)
    
    // Get user's GitHub access token
    const user = await db.query('SELECT github_access_token FROM users WHERE id = $1', [userId])
    const accessToken = user.rows[0]?.github_access_token
    
    // Initialize GitHub service and fetch files
    const githubService = new GitHubService()
    const repoContent = await githubService.fetchRepositoryContent(owner, repo, accessToken, branch)
    
    res.json({
      success: true,
      files: repoContent.files || [],
      totalFiles: repoContent.files?.length || 0
    })
    
  } catch (error) {
    logger.error('Failed to fetch GitHub files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file structure'
    })
  }
})

export default router 