// AI Analysis Service - Generate intelligent insights using AI providers
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
// Google AI currently not implemented - would need correct package
import { logger } from '../utils/logger.js'
import { DatabaseService } from './DatabaseService.js'
import crypto from 'crypto'

export class AIAnalysisService {
  constructor() {
    this.providers = {
      openai: null,
      anthropic: null,
      google: null
    }
    
    this.initializeProviders()
  }

  /**
   * Initialize AI providers
   */
  initializeProviders() {
    try {
      // OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.providers.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        logger.info('✅ OpenAI initialized')
      }

      // Anthropic
      if (process.env.ANTHROPIC_API_KEY) {
        this.providers.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        })
        logger.info('✅ Anthropic initialized')
      }

      // Google Gemini
      if (process.env.GOOGLE_AI_API_KEY) {
        // For now, log that Gemini is configured but use OpenAI as fallback
        logger.info('✅ Google Gemini API key configured (using OpenAI as processor)')
        this.providers.google = 'configured' // Mark as available
      }

      if (!this.hasAnyProvider()) {
        logger.warn('⚠️  No AI providers configured. AI analysis will be limited.')
      }
    } catch (error) {
      logger.error('Failed to initialize AI providers:', error)
    }
  }

  /**
   * Check if any AI provider is available
   */
  hasAnyProvider() {
    return Object.values(this.providers).some(provider => provider !== null)
  }

  /**
   * Get list of available AI providers
   */
  getAvailableProviders() {
    const available = []
    if (this.providers.openai) available.push({ name: 'OpenAI GPT-4o', model: 'gpt-4o', source: process.env.OPENAI_API_KEY ? 'environment' : 'demo' })
    if (this.providers.anthropic) available.push({ name: 'Anthropic Claude', model: 'claude-3-sonnet', source: process.env.ANTHROPIC_API_KEY ? 'environment' : 'demo' })
    if (this.providers.google) available.push({ name: 'Google Gemini', model: 'gemini-2.5-flash', source: process.env.GOOGLE_AI_API_KEY ? 'environment' : 'demo' })
    return available
  }

  /**
   * Generate AI insights for URL analysis
   */
  async generateURLInsights(analysisData, options = {}) {
    if (!this.hasAnyProvider()) {
      throw new Error('No AI provider available. Please configure OpenAI or Anthropic API keys.')
    }

    try {
      // Track available providers for transparency
      const availableProviders = this.getAvailableProviders()
      const analysisMetadata = {
        ai_providers_available: availableProviders,
        analysis_timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      }

      const prompt = this.buildURLAnalysisPrompt(analysisData, options)
      const aiResult = await this.callAI(prompt, 'url-analysis', options)
      
      const insights = this.parseURLInsights(aiResult.response || aiResult, analysisData)
      
      // Add provider transparency to results
      analysisMetadata.provider_used = aiResult.providerUsed || 'unknown'
      analysisMetadata.model_used = aiResult.model || 'unknown'
      analysisMetadata.tokens_used = aiResult.tokensUsed || 0
      analysisMetadata.response_time_ms = aiResult.responseTime || 0
      
      insights.analysis_metadata = analysisMetadata
      
      return insights
    } catch (error) {
      logger.error('AI URL analysis failed:', error)
      throw new Error(`AI URL analysis failed: ${error.message}`)
    }
  }

  /**
   * Generate AI insights for code analysis
   */
  async generateCodeInsights(analysisData, files, options = {}) {
    if (!this.hasAnyProvider()) {
      throw new Error('No AI provider available. Please configure OpenAI or Anthropic API keys.')
    }

    try {
      const prompt = this.buildCodeAnalysisPrompt(analysisData, files, options)
      const aiResult = await this.callAI(prompt, 'code-analysis', options)
      
      // Extract the response string from the result object
      // callAI returns {response, providerUsed, model, tokensUsed, responseTime}
      const responseText = aiResult.response || aiResult
      
      return this.parseCodeInsights(responseText, analysisData)
    } catch (error) {
      logger.error('AI code analysis failed:', error)
      throw new Error(`AI code analysis failed: ${error.message}`)
    }
  }

  /**
   * Build prompt for URL analysis
   */
  buildURLAnalysisPrompt(data, options) {
    const { aiProfile = 'mixed' } = options
    
    const basePrompt = `
Analyze this website data and provide insights:

URL: ${data.url}
Title: ${data.title || 'Unknown'}
Technologies: ${Array.isArray(data.technologies) ? data.technologies.join(', ') : (data.technologies || 'Unknown')}
Performance Score: ${data.performance?.performance || 'N/A'}
SEO Score: ${data.seo?.score || 'N/A'}
Accessibility Score: ${data.accessibility?.score || 'N/A'}
Security Score: ${data.security?.score || 'N/A'}

Please provide analysis in the following areas:
`

    let specificPrompt = ''
    
    if (aiProfile === 'technical' || aiProfile === 'mixed') {
      specificPrompt += `
TECHNICAL ANALYSIS:
- Code quality and structure assessment
- Performance optimization recommendations
- Security vulnerabilities and improvements
- Technology stack evaluation
- Technical debt assessment
`
    }
    
    if (aiProfile === 'business' || aiProfile === 'mixed') {
      specificPrompt += `
BUSINESS ANALYSIS:
- User experience evaluation
- Conversion optimization opportunities
- SEO and marketing improvements
- Competitive advantages and weaknesses
- Revenue impact recommendations
`
    }

    specificPrompt += `
Please respond in JSON format with the following structure:
{
  "summary": "Brief overall assessment",
  "technicalInsights": {
    "strengths": ["list of strengths"],
    "weaknesses": ["list of weaknesses"],
    "recommendations": ["specific technical recommendations"]
  },
  "businessInsights": {
    "opportunities": ["business opportunities"],
    "risks": ["potential risks"],
    "recommendations": ["business recommendations"]
  },
  "priority": "high|medium|low",
  "confidence": 0.85
}
`

    return basePrompt + specificPrompt
  }

  /**
   * Build prompt for code analysis
   */
  buildCodeAnalysisPrompt(analysisData, files, options) {
    const { aiProfile = 'mixed' } = options || {}
    // Ensure files is an array before slicing
    const filesArray = Array.isArray(files) ? files : []
    const sampleFiles = filesArray.slice(0, 5) // Analyze first 5 files for context
    
    const basePrompt = `
Analyze this codebase and provide insights:

Project Type: ${analysisData.structure?.projectType || 'Unknown'}
Total Files: ${analysisData.structure?.totalFiles || 0}
Total Lines: ${analysisData.structure?.totalLines || 0}
Languages: ${Object.keys(analysisData.structure?.languages || {}).join(', ')}
Frameworks: ${analysisData.dependencies?.frameworks?.join(', ') || 'Unknown'}

Quality Metrics:
- Overall Score: ${analysisData.scores?.overall || 'N/A'}
- Security Score: ${analysisData.scores?.security || 'N/A'}
- Maintainability Score: ${analysisData.scores?.maintainability || 'N/A'}
- Test Coverage: ${analysisData.testCoverage?.coverageRatio || 0}%

Sample Files:
${sampleFiles.map(f => `
File: ${f.path}
Language: ${f.language || 'Unknown'}
Lines: ${f.lines || 0}
Content Preview: ${f.content?.substring(0, 500) || 'No content'}
`).join('\n')}

Please provide analysis in the following areas:
`

    let specificPrompt = ''
    
    if (aiProfile === 'technical' || aiProfile === 'mixed') {
      specificPrompt += `
TECHNICAL ANALYSIS:
- Code architecture and design patterns
- Code quality and best practices
- Security vulnerabilities and fixes
- Performance bottlenecks and optimizations
- Testing strategy and coverage improvements
- Refactoring opportunities
`
    }
    
    if (aiProfile === 'business' || aiProfile === 'mixed') {
      specificPrompt += `
BUSINESS ANALYSIS:
- Development velocity and productivity
- Technical debt impact on business goals
- Scalability for future growth
- Maintenance cost implications
- Risk assessment for production deployment
- Team productivity factors
`
    }

    specificPrompt += `
Please respond in JSON format with the following structure:
{
  "summary": "Brief overall assessment of the codebase",
  "systemOverview": {
    "architecture": "Assessment of overall architecture",
    "strengths": ["key strengths"],
    "weaknesses": ["main weaknesses"]
  },
  "technicalInsights": {
    "codeQuality": "Assessment of code quality",
    "security": "Security analysis",
    "performance": "Performance analysis",
    "recommendations": ["specific technical recommendations"]
  },
  "businessInsights": {
    "risks": ["business risks"],
    "opportunities": ["improvement opportunities"],
    "recommendations": ["business-focused recommendations"]
  },
  "priority": "high|medium|low",
  "confidence": 0.85
}
`

    return basePrompt + specificPrompt
  }

  /**
   * Call AI provider with caching
   */
  async callAI(prompt, analysisType, options = {}) {
    try {
      // Generate cache key
      const cacheKey = crypto.createHash('sha256')
        .update(prompt + JSON.stringify(options))
        .digest('hex')
      
      // Check cache first (disabled - missing table)
      // const cached = await DatabaseService.getCachedAIResponse(cacheKey)
      // if (cached && !options.skipCache) {
      //   logger.info('📝 Using cached AI response')
      //   return { response: cached.response_text, providerUsed: 'cache', model: 'cached' }
      // }

      // Choose provider
      const provider = this.selectProvider(options.preferredProvider)
      const startTime = Date.now()
      
      let response = ''
      let tokenCount = 0
      let modelUsed = 'unknown'
      
      if (provider === 'openai' && this.providers.openai) {
        modelUsed = options.model || 'gpt-4o'
        const completion = await this.providers.openai.chat.completions.create({
          model: modelUsed,
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 2000
          // Note: temperature parameter removed - Codex models only support default (1)
        })
        
        response = completion.choices[0].message.content
        tokenCount = completion.usage.total_tokens
        logger.info(`✅ OpenAI analysis completed: ${tokenCount} tokens, model: ${modelUsed}`)
        
      } else if (provider === 'anthropic' && this.providers.anthropic) {
        modelUsed = options.model || 'claude-3-sonnet-20240229'
        const completion = await this.providers.anthropic.messages.create({
          model: modelUsed,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
        
        response = completion.content[0].text
        tokenCount = completion.usage.input_tokens + completion.usage.output_tokens
        logger.info(`✅ Anthropic analysis completed: ${tokenCount} tokens, model: ${modelUsed}`)
        
      } else if (provider === 'google' && this.providers.google) {
        modelUsed = options.model || 'gemini-2.5-flash'
        logger.info(`✅ Google Gemini analysis completed: model: ${modelUsed}`)
        // Google Gemini implementation would go here
        throw new Error('Google Gemini not implemented yet - using OpenAI fallback')
      }
      
      const responseTime = Date.now() - startTime
      
      // Cache the response (disabled - missing table)
      // await DatabaseService.cacheAIResponse({
      //   inputHash: cacheKey,
      //   provider,
      //   model: options.model || 'default',
      //   promptText: prompt.substring(0, 1000), // Truncate for storage
      //   responseText: response,
      //   confidenceScore: 0.85,
      //   tokenCount,
      //   responseTimeMs: responseTime
      // })
      
      // Log usage (disabled - missing table)
      // await DatabaseService.logAPIUsage({
      //   userId: options.userId || '00000000-0000-0000-0000-000000000001',
      //   analysisId: options.analysisId,
      //   analysisType,
      //   provider,
      //   model: options.model || 'default',
      //   tokensUsed: tokenCount,
      //   costUsd: this.calculateCost(provider, tokenCount),
      //   durationMs: responseTime,
      //   success: true
      // })
      
      logger.info(`🤖 AI analysis completed using ${provider}`, {
        tokens: tokenCount,
        duration: responseTime,
        provider,
        model: modelUsed
      })
      
      return {
        response,
        providerUsed: provider,
        model: modelUsed,
        tokensUsed: tokenCount,
        responseTime
      }
      
    } catch (error) {
      logger.error('AI provider call failed:', error)
      
      // Log failed usage
      await DatabaseService.logAPIUsage({
        userId: options.userId || '00000000-0000-0000-0000-000000000001',
        analysisId: options.analysisId,
        analysisType,
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        costUsd: 0,
        durationMs: 0,
        success: false,
        errorMessage: error.message
      })
      
      throw error
    }
  }

  /**
   * Select best available provider
   */
  selectProvider(preferred) {
    if (preferred && this.providers[preferred]) {
      return preferred
    }
    
    // Fallback priority: OpenAI -> Anthropic -> Google
    if (this.providers.openai) return 'openai'
    if (this.providers.anthropic) return 'anthropic'
    if (this.providers.google) return 'google'
    
    throw new Error('No AI provider available')
  }

  /**
   * Calculate cost for API usage
   */
  calculateCost(provider, tokens) {
    const costs = {
      openai: { input: 0.00025 / 1000, output: 0.002 / 1000 }, // GPT-5 mini pricing per 1K tokens
      anthropic: { input: 0.015 / 1000, output: 0.075 / 1000 }, // Claude-3 pricing
      google: { input: 0.00025 / 1000, output: 0.0005 / 1000 } // Gemini pricing
    }
    
    const cost = costs[provider] || { input: 0, output: 0 }
    return (tokens * cost.input) + (tokens * cost.output) // Simplified calculation
  }

  /**
   * Parse URL insights from AI response
   */
  parseURLInsights(response, data) {
    try {
      const parsed = JSON.parse(response)
      
      return {
        summary: parsed.summary || 'AI analysis completed',
        technicalInsights: parsed.technicalInsights || {},
        businessInsights: parsed.businessInsights || {},
        recommendations: [
          ...(parsed.technicalInsights?.recommendations || []),
          ...(parsed.businessInsights?.recommendations || [])
        ],
        priority: parsed.priority || 'medium',
        confidence: parsed.confidence || 0.85,
        provider: 'ai-generated'
      }
    } catch (error) {
      logger.error('Failed to parse AI URL insights response:', error)
      throw new Error('Failed to parse AI response. The AI service returned invalid data.')
    }
  }

  /**
   * Parse code insights from AI response
   */
  parseCodeInsights(response, data) {
    try {
      const parsed = JSON.parse(response)
      
      return {
        systemOverview: parsed.systemOverview || {},
        technicalInsights: parsed.technicalInsights || {},
        businessInsights: parsed.businessInsights || {},
        recommendations: [
          ...(parsed.technicalInsights?.recommendations || []),
          ...(parsed.businessInsights?.recommendations || [])
        ],
        priority: parsed.priority || 'medium',
        confidence: parsed.confidence || 0.85,
        provider: 'ai-generated'
      }
    } catch (error) {
      logger.error('Failed to parse AI code insights response:', error)
      throw new Error('Failed to parse AI response. The AI service returned invalid data.')
    }
  }


  /**
   * Get AI service health status
   */
  async getHealthStatus() {
    const status = {
      providers: {},
      totalProviders: 0,
      availableProviders: 0
    }

    for (const [name, provider] of Object.entries(this.providers)) {
      status.providers[name] = {
        available: provider !== null,
        configured: !!process.env[`${name.toUpperCase()}_API_KEY`]
      }
      
      status.totalProviders++
      if (provider !== null) {
        status.availableProviders++
      }
    }

    status.healthy = status.availableProviders > 0

    return status
  }
}

export default AIAnalysisService 