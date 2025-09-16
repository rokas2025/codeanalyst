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

      // Google Gemini - temporarily disabled
      // if (process.env.GOOGLE_AI_KEY) {
      //   this.providers.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY)
      //   logger.info('✅ Google Gemini initialized')
      // }

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
   * Generate AI insights for URL analysis
   */
  async generateURLInsights(analysisData, options = {}) {
    try {
      if (!this.hasAnyProvider()) {
        return this.generateFallbackURLInsights(analysisData)
      }

      const prompt = this.buildURLAnalysisPrompt(analysisData, options)
      const response = await this.callAI(prompt, 'url-analysis', options)
      
      return this.parseURLInsights(response, analysisData)
    } catch (error) {
      logger.error('AI URL analysis failed:', error)
      return this.generateFallbackURLInsights(analysisData)
    }
  }

  /**
   * Generate AI insights for code analysis
   */
  async generateCodeInsights(analysisData, files, options = {}) {
    try {
      if (!this.hasAnyProvider()) {
        return this.generateFallbackCodeInsights(analysisData)
      }

      const prompt = this.buildCodeAnalysisPrompt(analysisData, files, options)
      const response = await this.callAI(prompt, 'code-analysis', options)
      
      return this.parseCodeInsights(response, analysisData)
    } catch (error) {
      logger.error('AI code analysis failed:', error)
      return this.generateFallbackCodeInsights(analysisData)
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
    const { aiProfile = 'mixed' } = options
    const sampleFiles = files.slice(0, 5) // Analyze first 5 files for context
    
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
      
      // Check cache first
      const cached = await DatabaseService.getCachedAIResponse(cacheKey)
      if (cached && !options.skipCache) {
        logger.info('📝 Using cached AI response')
        return cached.response_text
      }

      // Choose provider
      const provider = this.selectProvider(options.preferredProvider)
      const startTime = Date.now()
      
      let response = ''
      let tokenCount = 0
      
      if (provider === 'openai' && this.providers.openai) {
        const completion = await this.providers.openai.chat.completions.create({
          model: options.model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        })
        
        response = completion.choices[0].message.content
        tokenCount = completion.usage.total_tokens
        
      } else if (provider === 'anthropic' && this.providers.anthropic) {
        const completion = await this.providers.anthropic.messages.create({
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
        
        response = completion.content[0].text
        tokenCount = completion.usage.input_tokens + completion.usage.output_tokens
        
      } else if (provider === 'google' && this.providers.google) {
        // Google Gemini implementation would go here
        throw new Error('Google Gemini not implemented yet')
      }
      
      const responseTime = Date.now() - startTime
      
      // Cache the response
      await DatabaseService.cacheAIResponse({
        inputHash: cacheKey,
        provider,
        model: options.model || 'default',
        promptText: prompt.substring(0, 1000), // Truncate for storage
        responseText: response,
        confidenceScore: 0.85,
        tokenCount,
        responseTimeMs: responseTime
      })
      
      // Log usage
      await DatabaseService.logAPIUsage({
        userId: options.userId || '00000000-0000-0000-0000-000000000001',
        analysisId: options.analysisId,
        analysisType,
        provider,
        model: options.model || 'default',
        tokensUsed: tokenCount,
        costUsd: this.calculateCost(provider, tokenCount),
        durationMs: responseTime,
        success: true
      })
      
      logger.info(`🤖 AI analysis completed using ${provider}`, {
        tokens: tokenCount,
        duration: responseTime,
        provider
      })
      
      return response
      
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
      openai: { input: 0.03 / 1000, output: 0.06 / 1000 }, // GPT-4 pricing per 1K tokens
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
      logger.warn('Failed to parse AI response, using fallback')
      return this.generateFallbackURLInsights(data)
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
      logger.warn('Failed to parse AI response, using fallback')
      return this.generateFallbackCodeInsights(data)
    }
  }

  /**
   * Generate fallback insights for URL analysis
   */
  generateFallbackURLInsights(data) {
    const insights = {
      summary: `Analyzed website: ${data.url}`,
      technicalInsights: {
        strengths: [],
        weaknesses: [],
        recommendations: []
      },
      businessInsights: {
        opportunities: [],
        risks: [],
        recommendations: []
      },
      priority: 'medium',
      confidence: 0.6,
      provider: 'rule-based'
    }

    // Add rule-based insights based on scores
    if (data.performance?.performance < 60) {
      insights.technicalInsights.weaknesses.push('Poor website performance')
      insights.technicalInsights.recommendations.push('Optimize images and reduce script loading times')
    }

    if (data.seo?.score < 70) {
      insights.businessInsights.opportunities.push('Improve SEO optimization')
      insights.businessInsights.recommendations.push('Add meta descriptions and optimize title tags')
    }

    if (data.security?.score < 80) {
      insights.technicalInsights.weaknesses.push('Security improvements needed')
      insights.technicalInsights.recommendations.push('Implement HTTPS and security headers')
    }

    return insights
  }

  /**
   * Generate fallback insights for code analysis
   */
  generateFallbackCodeInsights(data) {
    const insights = {
      systemOverview: {
        architecture: 'Standard project structure detected',
        strengths: [],
        weaknesses: []
      },
      technicalInsights: {
        codeQuality: 'Automated analysis completed',
        security: 'Security scan performed',
        performance: 'Performance analysis completed',
        recommendations: []
      },
      businessInsights: {
        risks: [],
        opportunities: [],
        recommendations: []
      },
      priority: 'medium',
      confidence: 0.6,
      provider: 'rule-based'
    }

    // Add rule-based insights
    if (data.scores?.overall < 60) {
      insights.systemOverview.weaknesses.push('Code quality needs improvement')
      insights.technicalInsights.recommendations.push('Focus on refactoring and code cleanup')
    }

    if (data.testCoverage?.coverageRatio < 50) {
      insights.businessInsights.risks.push('Low test coverage increases deployment risk')
      insights.technicalInsights.recommendations.push('Increase test coverage to at least 70%')
    }

    if (data.scores?.security < 70) {
      insights.businessInsights.risks.push('Security vulnerabilities detected')
      insights.technicalInsights.recommendations.push('Address security issues before production deployment')
    }

    return insights
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