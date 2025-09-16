// Analysis Worker - Background processing for all analysis types
import { WebsiteAnalyzer } from '../services/WebsiteAnalyzer.js'
import { GitHubService } from '../services/GitHubService.js'
import { ZipService } from '../services/ZipService.js'
import { CodeAnalyzer } from '../services/CodeAnalyzer.js'
import { AIAnalysisService } from '../services/AIAnalysisService.js'
import { DatabaseService } from '../services/DatabaseService.js'
import { queueService } from '../services/QueueService.js'
import { logger } from '../utils/logger.js'
import fs from 'fs'
import path from 'path'

// Global analyzer instances
let websiteAnalyzer = null
let aiAnalysisService = null

/**
 * Initialize all analyzers
 */
async function initializeAnalyzers() {
  try {
    // Initialize Queue Service first
    await queueService.initialize()
    
    // Initialize Website Analyzer
    websiteAnalyzer = new WebsiteAnalyzer()
    await websiteAnalyzer.initialize()
    
    // Initialize AI Analysis Service
    aiAnalysisService = new AIAnalysisService()
    
    logger.info('🔧 Analysis workers initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize analyzers:', error)
    throw error
  }
}

// Helper function to save JSON for debugging
const saveAnalysisJSON = (filename, data) => {
  try {
    const outputDir = '/Applications/MAMP/htdocs/CodeAnalyst'
    const filepath = path.join(outputDir, `${filename}_${Date.now()}.json`)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
    logger.info(`📁 Saved analysis data to: ${filepath}`)
  } catch (error) {
    logger.warn(`Failed to save JSON: ${error.message}`)
  }
}

/**
 * Process URL analysis jobs
 */
async function setupUrlAnalysisProcessor() {
  queueService.queues.urlAnalysis.process('analyze-url', async (job) => {
    const { analysisId, url, options = {} } = job.data
    
    try {
      logger.info(`🔄 Processing URL analysis job: ${analysisId}`)
             await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 10)

       // Initialize analyzer
       const websiteAnalyzer = new WebsiteAnalyzer()
       await websiteAnalyzer.initialize()
       await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 30)

       // Perform website analysis
       logger.info(`🌐 Analyzing website: ${url}`)
       const websiteResult = await websiteAnalyzer.analyzeWebsite(url, options)
       await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 70)

      // Save raw website analysis result for debugging
      saveAnalysisJSON('website_analysis', websiteResult)

      // Generate AI insights if requested
      let aiInsights = null
      if (options.includeAI !== false) {
        try {
          logger.info(`🤖 Generating AI insights for website analysis`)
          const aiAnalysisService = new AIAnalysisService()
          aiInsights = await aiAnalysisService.generateURLInsights(websiteResult, options.aiProfile || 'mixed')
          await DatabaseService.updateUrlAnalysisStatus(analysisId, 'processing', 90)
        } catch (aiError) {
          logger.warn(`AI insights generation failed: ${aiError.message}`)
        }
      }

      // Combine results in the format expected by frontend
      const finalResult = {
        id: analysisId,
        url: websiteResult.url,
        analyzedAt: websiteResult.analyzedAt,
        analysisTime: websiteResult.analysisTime,
        
        // Map the data structure properly for the frontend
        performance: {
          score: websiteResult.lighthouse?.performance || 0,
          metrics: websiteResult.lighthouse?.metrics || {},
          opportunities: websiteResult.lighthouse?.opportunities || []
        },
        
        lighthouse: {
          performance: websiteResult.lighthouse?.performance || 0,
          seo: websiteResult.lighthouse?.seo || 0,
          accessibility: websiteResult.lighthouse?.accessibility || 0,
          bestPractices: websiteResult.lighthouse?.bestPractices || 0,
          metrics: websiteResult.lighthouse?.metrics || {},
          opportunities: websiteResult.lighthouse?.opportunities || []
        },
        
        seo: {
          // Use comprehensive SEO score instead of basic Lighthouse
          score: websiteResult.comprehensiveSEO?.overallScore || websiteResult.lighthouse?.seo || 0,
          lighthouseScore: websiteResult.lighthouse?.seo || 0,
          
          // Basic page info
          title: websiteResult.basic?.title || '',
          description: websiteResult.basic?.description || '',
          keywords: websiteResult.basic?.keywords || [],
          headings: websiteResult.basic?.headingStructure || {},
          
          // Comprehensive analysis
          comprehensive: websiteResult.comprehensiveSEO || null,
          
          // Quick assessment
          contentDepth: websiteResult.comprehensiveSEO?.content?.analysis?.depth || null,
          technicalSEO: websiteResult.comprehensiveSEO?.technical || null,
          recommendations: websiteResult.comprehensiveSEO?.recommendations || [],
          criticalIssues: websiteResult.comprehensiveSEO?.criticalIssues || []
        },
        
        accessibility: {
          score: websiteResult.accessibility?.score || websiteResult.lighthouse?.accessibility || 0,
          issues: websiteResult.accessibility?.issues || [],
          details: websiteResult.accessibility?.details || []
        },
        
        security: {
          score: websiteResult.scores?.security || 75,
          headers: websiteResult.security?.headers || {},
          vulnerabilities: websiteResult.security?.vulnerabilities || []
        },
        
        // Extract simple tech names for frontend
        technologies: (() => {
          if (!websiteResult.technologies) return []
          if (Array.isArray(websiteResult.technologies)) {
            return websiteResult.technologies.map(tech => 
              typeof tech === 'string' ? tech : tech.name || tech
            )
          }
          if (websiteResult.technologies.technologies && Array.isArray(websiteResult.technologies.technologies)) {
            return websiteResult.technologies.technologies.map(tech => tech.name || tech)
          }
          return []
        })(),
        
        basic: websiteResult.basic || {},
        
        aiInsights: aiInsights,
        
        // Overall scores
        scores: websiteResult.scores || {},
        
        // Raw data for debugging
        raw: websiteResult
      }

      // Save final formatted result for debugging
      saveAnalysisJSON('final_analysis_result', finalResult)

             // Store result in database
       await DatabaseService.storeUrlAnalysisResult(analysisId, finalResult)
       await DatabaseService.updateUrlAnalysisStatus(analysisId, 'completed', 100)

      // Cleanup
      await websiteAnalyzer.cleanup()
      
      logger.info(`✅ URL analysis completed: ${analysisId}`)
      return finalResult

    } catch (error) {
      logger.error(`❌ URL analysis failed: ${analysisId}`, error)
             await DatabaseService.updateUrlAnalysisStatus(analysisId, 'failed', 0, error.message)
      throw error
    }
  })
}

/**
 * Process GitHub repository analysis jobs
 */
function setupGitHubAnalysisProcessor() {
  queueService.queues.githubAnalysis.process('analyze-github', 3, async (job) => {
  const { analysisId, userId, repoUrl, owner, repo, branch, options } = job.data
  
  try {
    logger.info(`📂 Processing GitHub analysis job: ${analysisId}`)
    
    // Update status to analyzing
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 10)
    
    // Step 1: Clone/Download Repository (30% progress)
    job.progress(10)
    const repoData = await GitHubService.downloadRepository(owner, repo, branch)
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 30)
    
    // Step 2: Analyze Code Structure (60% progress)
    job.progress(30)
    const codeAnalysis = await CodeAnalyzer.analyzeCodebase(repoData.localPath, options)
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 60)
    
    // Step 3: Store code analysis data
    job.progress(60)
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
    
    // Step 4: AI Analysis (90% progress)
    job.progress(80)
    
    const aiInputData = {
      sourceType: 'github',
      repository: { owner, repo, branch },
      codeStructure: codeAnalysis,
      files: codeAnalysis.keyFiles, // Important files for AI review
      metrics: {
        quality: codeAnalysis.qualityScore,
        complexity: codeAnalysis.complexity,
        testCoverage: codeAnalysis.testCoverage
      }
    }
    
    const aiResults = await aiAnalysisService.generateCodeInsights(aiInputData, codeAnalysis.keyFiles || [], { profile: options.aiProfile || 'mixed' })
    
    // Step 5: Store AI results and complete (100% progress)
    job.progress(100)
    await DatabaseService.updateCodeAnalysisAI(analysisId, {
      system_overview: aiResults.systemOverview,
      technical_structure: aiResults.technicalStructure,
      maintenance_needs: aiResults.maintenanceNeeds,
      ai_explanations: aiResults.explanations,
      business_recommendations: aiResults.businessRecommendations,
      risk_assessment: aiResults.riskAssessment
    })
    
    // Clean up downloaded repository
    await GitHubService.cleanup(repoData.localPath)
    
    // Mark as completed
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'completed', 100)
    
    logger.info(`✅ GitHub analysis completed: ${analysisId}`)
    return { success: true, analysisId }
    
  } catch (error) {
    logger.error(`❌ GitHub analysis failed: ${analysisId}`, error)
    
    // Mark as failed
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'failed', 0, error.message)
    
    throw error
  }
  })
}

/**
 * Process ZIP file analysis jobs
 */
function setupZipAnalysisProcessor() {
  queueService.queues.zipAnalysis.process('analyze-zip', 3, async (job) => {
  const { analysisId, userId, zipFilePath, originalFilename, options } = job.data
  
  try {
    logger.info(`📦 Processing ZIP analysis job: ${analysisId}`)
    
    // Update status to analyzing
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 10)
    
    // Step 1: Extract ZIP file (30% progress)
    job.progress(10)
    const extractedData = await ZipService.extractZipFile(zipFilePath)
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 30)
    
    // Step 2: Analyze Code Structure (60% progress)
    job.progress(30)
    const codeAnalysis = await CodeAnalyzer.analyzeCodebase(extractedData.extractPath, options)
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'analyzing', 60)
    
    // Step 3: Store code analysis data
    job.progress(60)
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
    
    // Step 4: AI Analysis (90% progress)
    job.progress(80)
    
    const aiInputData = {
      sourceType: 'zip',
      filename: originalFilename,
      codeStructure: codeAnalysis,
      files: codeAnalysis.keyFiles, // Important files for AI review
      metrics: {
        quality: codeAnalysis.qualityScore,
        complexity: codeAnalysis.complexity,
        testCoverage: codeAnalysis.testCoverage
      }
    }
    
    const aiResults = await aiAnalysisService.generateCodeInsights(aiInputData, codeAnalysis.keyFiles || [], { profile: options.aiProfile || 'mixed' })
    
    // Step 5: Store AI results and complete (100% progress)
    job.progress(100)
    await DatabaseService.updateCodeAnalysisAI(analysisId, {
      system_overview: aiResults.systemOverview,
      technical_structure: aiResults.technicalStructure,
      maintenance_needs: aiResults.maintenanceNeeds,
      ai_explanations: aiResults.explanations,
      business_recommendations: aiResults.businessRecommendations,
      risk_assessment: aiResults.riskAssessment
    })
    
    // Clean up extracted files
    await ZipService.cleanup(extractedData.extractPath)
    
    // Mark as completed
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'completed', 100)
    
    logger.info(`✅ ZIP analysis completed: ${analysisId}`)
    return { success: true, analysisId }
    
  } catch (error) {
    logger.error(`❌ ZIP analysis failed: ${analysisId}`, error)
    
    // Mark as failed
    await DatabaseService.updateCodeAnalysisStatus(analysisId, 'failed', 0, error.message)
    
    throw error
  }
  })
}



/**
 * Start all analysis workers
 */
export async function startAnalysisWorker() {
  try {
    await initializeAnalyzers()
    
    // Setup job processors
    setupUrlAnalysisProcessor()
    setupGitHubAnalysisProcessor()
    setupZipAnalysisProcessor()
    
    logger.info('🚀 Analysis workers started successfully')
    logger.info(`📊 Queue Configuration:`)
    logger.info(`   - URL Analysis: Max 5 concurrent jobs`)
    logger.info(`   - GitHub Analysis: Max 3 concurrent jobs`)
    logger.info(`   - ZIP Analysis: Max 3 concurrent jobs`)
    
  } catch (error) {
    logger.error('Failed to start analysis workers:', error)
    throw error
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownWorkers() {
  try {
    await queueService.shutdown()
    
    if (websiteAnalyzer) {
      await websiteAnalyzer.cleanup()
    }
    
    logger.info('🛑 Analysis workers shut down gracefully')
  } catch (error) {
    logger.error('Error during worker shutdown:', error)
  }
}

// Graceful shutdown on process signals
process.on('SIGTERM', shutdownWorkers)
process.on('SIGINT', shutdownWorkers)

export default {
  startAnalysisWorker,
  shutdownWorkers
}

// Auto-start when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startAnalysisWorker().catch(error => {
    logger.error('Failed to start analysis worker:', error)
    process.exit(1)
  })
} 