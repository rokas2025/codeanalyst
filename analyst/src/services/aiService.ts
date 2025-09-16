import axios from 'axios'
import { AIExplanation, BusinessRecommendation, AdoreInoResults } from '../types'
import { getBestAvailableProvider, validateApiKey, getProviderStatus } from './aiProviders'
import { AIResponseCache } from './aiResponseCache'

type AIProvider = 'openai' | 'anthropic' | 'google' | 'local'
type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'local'

interface AIServiceConfig {
  provider: AIProvider
  model: AIModel
  apiKey: string
  baseURL?: string
  maxTokens?: number
  temperature?: number
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface AnthropicResponse {
  content: Array<{
    text: string
  }>
}

interface GoogleResponse {
  candidates: Array<{
    content: {
      role?: string
      parts?: Array<{
        text: string
      }>
    }
    finishReason?: string
    index?: number
  }>
  usageMetadata?: {
    promptTokenCount: number
    totalTokenCount: number
    thoughtsTokenCount?: number
  }
}

export class AIService {
  private config: AIServiceConfig
  private cache: AIResponseCache
  
  constructor(config: AIServiceConfig) {
    this.config = config
    this.cache = new AIResponseCache()
  }

  async enhanceAnalysisWithAI(
    baseResults: AdoreInoResults,
    userProfile: 'business' | 'technical' | 'mixed' = 'mixed'
  ): Promise<AdoreInoResults> {
    try {
      // First: Detect project context for specialized analysis
      const projectContext = await this.analyzeProjectContext(baseResults)
      console.log(`🎯 AI CONTEXT: Detected ${projectContext.type} project with ${projectContext.specializations.join(', ')} patterns`)

      // Enhanced AI explanations with project-specific insights
      const enhancedExplanations = await this.generateContextAwareExplanations(
        baseResults.technicalStructure,
        userProfile,
        projectContext
      )

      // Enhanced business recommendations with domain expertise
      const enhancedRecommendations = await this.generateContextAwareRecommendations(
        baseResults,
        userProfile,
        projectContext
      )

      // Generate executive summary with business context
      const executiveSummary = await this.generateContextAwareExecutiveSummary(
        baseResults, 
        projectContext
      )

      return {
        ...baseResults,
        aiExplanations: enhancedExplanations,
        businessRecommendations: enhancedRecommendations,
        executiveSummary,
        projectContext
      } as AdoreInoResults & { executiveSummary: string; projectContext: any }
    } catch (error) {
      console.error('AI enhancement failed:', error)
      // Return base results if AI fails
      return baseResults
    }
  }

  private async generateEnhancedExplanations(
    technicalStructure: any,
    userProfile: string
  ): Promise<AIExplanation[]> {
    const explanations: AIExplanation[] = []

    // Generate explanations for system architecture with actual code context
    const architectureExplanation = await this.callAI({
      prompt: this.buildArchitecturePrompt(technicalStructure, userProfile),
      maxTokens: 2000,
      codeContext: this.buildCodeStructureContext(technicalStructure)
    })

    explanations.push({
      context: 'System Architecture',
      explanation: architectureExplanation,
      reasoning: 'Based on code structure analysis and dependency mapping',
      confidence: 0.85,
      relatedFiles: ['src/', 'package.json'],
      businessValue: this.translateTechToBusinessValue(architectureExplanation, userProfile)
    })

    // Generate explanations for key modules
    for (const module of technicalStructure.modules.slice(0, 3)) {
      const moduleExplanation = await this.callAI({
        prompt: this.buildModulePrompt(module, userProfile),
        maxTokens: 800,
        codeContext: `Module files and dependencies: ${module.dependencies.slice(0, 5).join(', ')}`
      })

      explanations.push({
        context: `Module: ${module.name}`,
        explanation: moduleExplanation,
        reasoning: `Analysis of ${module.linesOfCode} lines of code in ${module.name} module`,
        confidence: 0.80,
        relatedFiles: [module.path],
        businessValue: this.assessModuleBusinessValue(module, userProfile)
      })
    }

    return explanations
  }

  private async generateEnhancedRecommendations(
    results: AdoreInoResults,
    userProfile: string
  ): Promise<BusinessRecommendation[]> {
    const recommendationsPrompt = this.buildRecommendationsPrompt(results, userProfile)
    
    const aiRecommendations = await this.callAI({
      prompt: recommendationsPrompt,
      maxTokens: 2500,
      codeContext: `System analysis data: ${JSON.stringify({
        files: results.technicalStructure.codeMetrics.totalFiles,
        complexity: results.technicalStructure.codeMetrics.complexity,
        technologies: results.systemOverview.mainTechnologies
      }, null, 2)}`
    })

    // Parse AI response into structured recommendations
    return this.parseRecommendations(aiRecommendations, results)
  }

  private async generateExecutiveSummary(results: AdoreInoResults): Promise<string> {
    const summaryPrompt = `
Based on the following system analysis, provide a concise executive summary in business language:

System Overview:
- Quality Rating: ${results.systemOverview.qualityRating}
- Overall Score: ${results.systemOverview.overallScore}/100
- Technologies: ${results.systemOverview.mainTechnologies.join(', ')}
- Complexity: ${results.systemOverview.estimatedComplexity}

Risk Assessment:
- Overall Risk: ${results.riskAssessment.overallRisk}
- Number of Risks: ${results.riskAssessment.risks.length}

Maintenance:
- Priority Level: ${results.maintenanceNeeds.priorityLevel}
- Urgent Tasks: ${results.maintenanceNeeds.urgentTasks.length}

Provide a 2-3 sentence summary for business stakeholders focusing on:
1. Current system health
2. Key risks or opportunities  
3. Recommended next steps
`

    return await this.callAI({
      prompt: summaryPrompt,
      maxTokens: 1000,
      codeContext: `Key metrics: Score ${results.systemOverview.overallScore}, Debt ${results.technicalStructure.codeMetrics.technicalDebt}%, Risks ${results.riskAssessment.risks.length}`
    })
  }

  private buildArchitecturePrompt(technicalStructure: any, userProfile: string): string {
    const audienceContext = userProfile === 'business' ? 
      'Explain in business terms without technical jargon' :
      userProfile === 'technical' ?
      'Provide detailed technical analysis' :
      'Balance technical accuracy with business clarity'

    // Create detailed code structure for AI analysis
    const codeStructure = this.buildCodeStructureContext(technicalStructure)
    
    return `Analyze this codebase concisely:

**System:** ${technicalStructure.architecture.pattern} - ${technicalStructure.codeMetrics.totalFiles} files, ${technicalStructure.codeMetrics.totalLines} LOC
**Quality:** Complexity ${technicalStructure.codeMetrics.complexity}, Debt ${technicalStructure.codeMetrics.technicalDebt}%, Tests ${technicalStructure.codeMetrics.testCoverage || 'Unknown'}
**Key Issues:** ${technicalStructure.dependencies.filter((d: any) => d.isOutdated || d.securityIssues > 0).slice(0, 3).map((d: any) => `${d.name}${d.securityIssues > 0 ? ` (${d.securityIssues} security issues)` : ' (outdated)'}`).join(', ')}

Provide concise analysis (max 3 paragraphs):
1. Main architectural strengths/weaknesses
2. Top priority concerns
3. One specific actionable recommendation

${audienceContext}
`
  }

  private buildCodeStructureContext(technicalStructure: any): string {
    return `
Code Structure Analysis:
- Layer Structure: ${technicalStructure.architecture.layerStructure.join(' → ')}
- Data Flow: ${technicalStructure.architecture.dataFlow}
- Module Types: ${technicalStructure.modules.map((m: any) => m.type).join(', ')}
- Dependency Health: ${technicalStructure.dependencies.filter((d: any) => !d.isOutdated && d.securityIssues === 0).length}/${technicalStructure.dependencies.length} dependencies are up-to-date and secure
`
  }

  private buildModulePrompt(module: any, userProfile: string): string {
    const audienceContext = userProfile === 'business' ? 
      'Focus on business value and impact' :
      'Include technical details and implementation aspects'

    return `Analyze module "${module.name}" (${module.linesOfCode} lines):

**Purpose:** ${module.description}
**Key Dependencies:** ${module.dependencies.slice(0, 3).join(', ')}
**Status:** ${module.type} module, ${module.dependencies.length} total dependencies

Provide brief analysis (2-3 sentences each):
1. Business function and value
2. Main risks or concerns
3. One improvement recommendation

${audienceContext}
`
  }

  private buildRecommendationsPrompt(results: AdoreInoResults, userProfile: string): string {
    const urgentTasksCount = results.maintenanceNeeds.urgentTasks.length
    const securityRisks = results.riskAssessment.risks.filter(r => r.type === 'security').length
    const performanceRisks = results.riskAssessment.risks.filter(r => r.type === 'performance').length
    
    return `Create strategic recommendations for this codebase:

**Status:** ${results.systemOverview.qualityRating} (${results.systemOverview.overallScore}/100), ${results.technicalStructure.codeMetrics.technicalDebt}% debt, ${results.riskAssessment.overallRisk} risk
**Tech:** ${results.systemOverview.mainTechnologies.join(', ')}
**Issues:** ${urgentTasksCount} urgent, ${securityRisks} security, ${performanceRisks} performance

**Top Risks:** ${results.riskAssessment.risks.slice(0, 2).map(r => `${r.title} (${r.impact} impact)`).join(', ')}

Provide 3 concise recommendations (1 paragraph each):
1. **Immediate (1-3 months)** - urgent fixes
2. **Medium-term (3-12 months)** - improvements  
3. **Long-term (1+ years)** - strategic vision

For ${userProfile} audience. Focus on business impact and realistic costs.
`
  }

  private async callAI(params: { prompt: string; maxTokens: number; codeContext?: string }): Promise<string> {
    // Add comprehensive logging
    console.log(`🤖 AI SERVICE: Using provider: ${this.config.provider}, model: ${this.config.model}`)
    console.log(`🔑 API Key present: ${this.config.apiKey !== 'demo-key' ? 'YES' : 'NO'}`)
    
    // Check cache first for consistent responses
    const fullPrompt = params.codeContext ? 
      `${params.prompt}\n\nCode Context:\n\`\`\`\n${params.codeContext}\n\`\`\`` : 
      params.prompt
    
    const cachedResponse = this.cache.getCachedResponse(fullPrompt, this.config.provider, this.config.model)
    if (cachedResponse) {
      console.log(`📋 CACHE HIT: Using cached response for consistent results`)
      return cachedResponse
    }
    
    if (this.config.provider === 'local') {
      console.log(`⚠️ DEMO MODE: Returning mock response (no real AI used)`)
      const mockResponse = this.generateMockAIResponse(params.prompt)
      // Cache mock responses too for consistency
      this.cache.cacheResponse(fullPrompt, mockResponse, this.config.provider, this.config.model)
      return mockResponse
    }

    try {
      const systemPrompt = this.getSystemPrompt()
      const userPrompt = params.codeContext ? 
        `${params.prompt}\n\nCode Context:\n\`\`\`\n${params.codeContext}\n\`\`\`` : 
        params.prompt

      console.log(`🚀 REAL AI CALL: Making ${this.config.provider} API request...`)
      let response: string
      
      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(systemPrompt, userPrompt, params.maxTokens)
          break
        case 'anthropic':
          response = await this.callAnthropic(systemPrompt, userPrompt, params.maxTokens)
          break
        case 'google':
          response = await this.callGoogle(systemPrompt, userPrompt, params.maxTokens)
          break
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`)
      }
      
      console.log(`✅ AI RESPONSE: Received ${response.length} characters from ${this.config.provider}`)
      console.log(`📝 AI RESPONSE PREVIEW: ${response.substring(0, 200)}...`)
      
      // Cache the response for future consistency
      const validation = this.cache.cacheResponse(fullPrompt, response, this.config.provider, this.config.model)
      console.log(`📊 CACHE VALIDATION: Consistent=${validation.isConsistent}, Confidence=${validation.confidence.toFixed(2)}`)
      
      return response
      
    } catch (error) {
      console.error(`❌ AI API FAILED for ${this.config.provider}:`, error)
      console.log(`🔄 FALLBACK: Using mock response instead`)
      const fallbackResponse = this.generateMockAIResponse(params.prompt)
      // Cache fallback responses to maintain consistency
      this.cache.cacheResponse(fullPrompt, fallbackResponse, this.config.provider, this.config.model)
      return fallbackResponse
    }
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const response = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: this.config.temperature || 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )

    return response.data.choices[0]?.message?.content || 'No response generated'
  }

  private async callAnthropic(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    const response = await axios.post<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.model,
        max_tokens: maxTokens,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000
      }
    )

    return response.data.content[0]?.text || 'No response generated'
  }

  private async callGoogle(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
    // Shorten prompts for Google API to avoid MAX_TOKENS issue
    // Allow more content but still limit to avoid token issues
    const condensedSystemPrompt = systemPrompt.length > 1000 ? 
      systemPrompt.substring(0, 1000) + "...[truncated]" : systemPrompt
    const condensedUserPrompt = userPrompt.length > 3000 ? 
      userPrompt.substring(0, 3000) + "...[truncated]" : userPrompt
    const fullPrompt = `${condensedSystemPrompt}\n\n${condensedUserPrompt}`
    
    console.log(`🔗 GOOGLE API: Calling Gemini API with model ${this.config.model}`)
    console.log(`📊 REQUEST PARAMS: maxTokens=${maxTokens}, temperature=${this.config.temperature}`)
    
    const response = await axios.post<GoogleResponse>(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.getModelForProvider()}:generateContent?key=${this.config.apiKey}`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: Math.max(maxTokens, 4096)
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )

    // Log only basic response info to reduce console noise
    console.log('🔍 GOOGLE RESPONSE: Status', response.status, 'Candidates:', response.data?.candidates?.length || 0)
    
    if (!response.data || !response.data.candidates || !Array.isArray(response.data.candidates)) {
      console.error('❌ GOOGLE RESPONSE: Invalid response structure', response.data)
      throw new Error('Invalid response structure from Google API')
    }
    
    if (response.data.candidates.length === 0) {
      console.error('❌ GOOGLE RESPONSE: No candidates in response')
      throw new Error('No candidates in Google API response')
    }
    
    const candidate = response.data.candidates[0]
    if (!candidate || !candidate.content) {
      console.error('❌ GOOGLE RESPONSE: Invalid candidate structure', candidate)
      throw new Error('Invalid candidate structure from Google API')
    }
    
    // Check for parts array (old format) or direct content
    if (candidate.content.parts && Array.isArray(candidate.content.parts)) {
      if (candidate.content.parts.length === 0) {
        console.warn('⚠️ GOOGLE RESPONSE: No parts in candidate content - using fallback')
        throw new Error('No parts in Google API candidate content')
      }
      
      const responseText = candidate.content.parts[0]?.text || ''
      
      // Check if the response was cut off due to max tokens
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ GOOGLE RESPONSE: Response truncated due to MAX_TOKENS - using partial response')
        if (responseText.length === 0) {
          // If we got MAX_TOKENS but no content, return a fallback message
          return "Analysis partially completed. The response was too long for the current token limit. Consider breaking down the analysis into smaller parts."
        }
        // Otherwise use the partial content and note it was truncated
        return responseText + "\n\n[Note: Response was truncated due to length limits]"
      }
      
      if (responseText.length === 0) {
        console.warn('⚠️ GOOGLE RESPONSE: Empty text content - using fallback')
        throw new Error('Empty text content in Google API response')
      }
      
      console.log(`✅ GOOGLE SUCCESS: Received ${responseText.length} characters from Gemini`)
      return responseText
    }
    
    // If no parts array, the response format might be different or empty
    console.warn('⚠️ GOOGLE RESPONSE: No parts array found - using fallback')
    throw new Error('No text content found in Google API response')
  }

  private getSystemPrompt(): string {
    return `You are an expert code analyst and software architect. Your role is to analyze codebases and provide detailed, actionable insights for business stakeholders and technical teams.

Your analysis should be:
- Professional and business-focused
- Technically accurate but accessible
- Focused on practical recommendations
- Clear about risks and opportunities
- Specific to the actual code provided

When analyzing code:
1. Examine the actual structure, patterns, and quality
2. Identify real issues, not generic problems
3. Provide specific, actionable recommendations
4. Consider business impact and technical debt
5. Be honest about limitations of static analysis`
  }

  private getModelForProvider(): string {
    switch (this.config.model) {
      case 'gpt-4':
        return 'gpt-4'
      case 'gpt-4-turbo':
        return 'gpt-4-turbo-preview'
      case 'claude-3-sonnet':
        return 'claude-3-sonnet-20240229'
      case 'claude-3-haiku':
        return 'claude-3-haiku-20240307'
      case 'gemini-2.5-flash':
        return 'gemini-2.5-flash'
      case 'gemini-1.5-pro':
        return 'gemini-1.5-pro'
      case 'gemini-1.5-flash':
        return 'gemini-1.5-flash'
      default:
        return this.config.model
    }
  }

  private generateMockAIResponse(prompt: string): string {
    const mockResponse = `[🤖 DEMO MODE - NOT REAL AI] `
    
    if (prompt.includes('architecture')) {
      return mockResponse + `This system follows a modern component-based architecture with clear separation of concerns. The modular structure supports maintainability and allows for independent development of features. The current setup is well-organized but could benefit from additional documentation and testing to ensure long-term sustainability.`
    }

    if (prompt.includes('module')) {
      return mockResponse + `This module serves as a core component of the application, handling essential business logic. It's well-structured with ${Math.floor(Math.random() * 500) + 100} lines of clean, maintainable code. The module integrates properly with other system components and follows established patterns.`
    }

    if (prompt.includes('recommendations')) {
      return mockResponse + `Based on the analysis, I recommend: 1) Immediate: Address any security vulnerabilities and update outdated dependencies (1-2 months, €2,000-5,000). 2) Medium-term: Implement comprehensive testing strategy and improve documentation (3-6 months, €5,000-10,000). 3) Long-term: Consider gradual modernization of legacy components to improve maintainability (6-12 months, €10,000-20,000).`
    }

    if (prompt.includes('executive summary')) {
      return mockResponse + `Your system is in good overall condition with a solid foundation for continued operation. While there are some areas for improvement, particularly around testing and documentation, the core architecture is sound and business-ready. I recommend focusing on incremental improvements rather than major overhauls.`
    }

    return mockResponse + `Based on the analysis, this appears to be a well-structured system with good potential for continued development and maintenance.`
  }

  private translateTechToBusinessValue(techExplanation: string, userProfile: string): string {
    if (userProfile === 'business') {
      return 'This architectural approach supports business growth by enabling faster feature development and easier maintenance, ultimately reducing long-term costs and improving time-to-market.'
    }
    return 'Provides foundation for scalable development and efficient resource utilization.'
  }

  private assessModuleBusinessValue(module: any, userProfile: string): string {
    const valueMap: { [key: string]: string } = {
      'components': 'Directly impacts user experience and customer satisfaction',
      'services': 'Enables core business operations and data processing',
      'utils': 'Provides essential support functions that improve system efficiency',
      'pages': 'Delivers key user-facing functionality that drives business value',
      'auth': 'Ensures security and compliance, protecting business reputation'
    }

    const defaultValue = 'Supports overall system functionality and business operations'
    return valueMap[module.name.toLowerCase()] || defaultValue
  }

  private parseRecommendations(aiResponse: string, results: AdoreInoResults): BusinessRecommendation[] {
    // Simple parsing logic - in production, use more sophisticated NLP
    const recommendations: BusinessRecommendation[] = []
    
    const sections = aiResponse.split(/\d+[.)]/).filter(s => s.trim())
    
    sections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim())
      if (lines.length === 0) return

      const title = lines[0].replace(/^[:-]\s*/, '').trim()
      const description = lines.slice(1).join(' ').trim()

      // Extract category, cost, timeline using simple patterns
      const category = this.extractCategory(description)
      const costEstimate = this.extractCost(description) 
      const timeline = this.extractTimeline(description)

      recommendations.push({
        category,
        title,
        description,
        businessImpact: this.inferBusinessImpact(category),
        costEstimate,
        timeline,
        risks: this.inferRisks(category),
        benefits: this.inferBenefits(category),
        priority: index + 1
      })
    })

    return recommendations.slice(0, 3) // Limit to top 3 recommendations
  }

  private extractCategory(text: string): 'maintain' | 'improve' | 'migrate' | 'replace' {
    if (text.toLowerCase().includes('maintain') || text.toLowerCase().includes('fix')) return 'maintain'
    if (text.toLowerCase().includes('migrate') || text.toLowerCase().includes('move')) return 'migrate'  
    if (text.toLowerCase().includes('replace') || text.toLowerCase().includes('rebuild')) return 'replace'
    return 'improve'
  }

  private extractCost(text: string): string {
    const costMatch = text.match(/€[\d,]+-[\d,]+|€[\d,]+|\$[\d,]+-[\d,]+|\$[\d,]+/i)
    return costMatch ? costMatch[0] : '€2,000 - €10,000'
  }

  private extractTimeline(text: string): string {
    const timeMatch = text.match(/\d+-?\d*\s*(days?|weeks?|months?|years?)/i)
    return timeMatch ? timeMatch[0] : '2-6 months'
  }

  private inferBusinessImpact(category: string): string {
    const impacts = {
      maintain: 'Prevents system degradation and maintains current performance levels',
      improve: 'Enhances system capabilities and improves business efficiency', 
      migrate: 'Modernizes infrastructure while preserving business functionality',
      replace: 'Provides significant long-term benefits but requires substantial investment'
    }
    return impacts[category as keyof typeof impacts] || 'Positive impact on business operations'
  }

  private inferRisks(category: string): string[] {
    const riskMap = {
      maintain: ['Temporary service disruption', 'Compatibility issues with existing integrations'],
      improve: ['Learning curve for new features', 'Integration complexity'],
      migrate: ['Data migration complexity', 'Temporary performance impact', 'Staff training requirements'],
      replace: ['Significant business disruption', 'High implementation cost', 'Extended timeline']
    }
    return riskMap[category as keyof typeof riskMap] || ['Implementation complexity', 'Resource requirements']
  }

  private inferBenefits(category: string): string[] {
    const benefitMap = {
      maintain: ['System stability', 'Continued operations', 'Risk mitigation'],
      improve: ['Enhanced functionality', 'Better user experience', 'Competitive advantage'],
      migrate: ['Improved performance', 'Modern infrastructure', 'Better scalability'],
      replace: ['Latest technology', 'Long-term cost savings', 'Maximum performance improvement']
    }
    return benefitMap[category as keyof typeof benefitMap] || ['System improvement', 'Business value enhancement']
  }

  /**
   * Get cache statistics for monitoring reliability
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear expired cache entries to maintain performance
   */
  clearExpiredCache(): void {
    this.cache.clearExpiredCache()
  }

  /**
   * Test AI response consistency by making multiple calls
   */
  async testResponseConsistency(prompt: string, iterations: number = 3): Promise<{
    responses: string[]
    averageSimilarity: number
    isConsistent: boolean
    recommendedResponse: string
  }> {
    const responses: string[] = []
    
    // Temporarily disable cache for testing
    const originalCache = this.cache
    this.cache = new AIResponseCache()
    
    try {
      for (let i = 0; i < iterations; i++) {
        const response = await this.callAI({ prompt, maxTokens: 2000 })
        responses.push(response)
      }
      
      // Calculate similarity between all responses
      const similarities: number[] = []
      for (let i = 0; i < responses.length; i++) {
        for (let j = i + 1; j < responses.length; j++) {
          similarities.push(this.calculateSimilarity(responses[i], responses[j]))
        }
      }
      
      const averageSimilarity = similarities.length > 0 ? 
        similarities.reduce((a, b) => a + b, 0) / similarities.length : 0
      
      const isConsistent = averageSimilarity >= 0.8
      
      // Find the most representative response (longest with technical terms)
      const recommendedResponse = responses.sort((a, b) => {
        const scoreA = this.calculateResponseQuality(a)
        const scoreB = this.calculateResponseQuality(b)
        return scoreB - scoreA
      })[0]
      
      return {
        responses,
        averageSimilarity,
        isConsistent,
        recommendedResponse
      }
    } finally {
      // Restore original cache
      this.cache = originalCache
    }
  }

  /**
   * Calculate similarity between responses (same as cache implementation)
   */
  private calculateSimilarity(response1: string, response2: string): number {
    const words1 = response1.toLowerCase().split(/\s+/)
    const words2 = response2.toLowerCase().split(/\s+/)
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }

  /**
   * Calculate response quality score for testing
   */
  private calculateResponseQuality(response: string): number {
    let score = response.length / 1000 // Base score from length
    
    // Technical terms boost score
    const technicalTerms = [
      'architecture', 'dependency', 'vulnerability', 'refactor',
      'performance', 'security', 'optimization', 'technical debt',
      'scalability', 'maintainability', 'testing', 'documentation'
    ]
    
    const foundTerms = technicalTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length
    
    score += (foundTerms / technicalTerms.length) * 2
    
    // Structured content (lists, numbers) boost score
    const structurePatterns = [/\d+[.)]/g, /[-*+]\s/g, /\n\s*[A-Z]/g]
    structurePatterns.forEach(pattern => {
      const matches = response.match(pattern)
      if (matches) score += matches.length * 0.1
    })
    
    return score
  }
}

// Helper function to get API key from localStorage or environment
function getApiKey(provider: string): string {
  try {
    const settings = localStorage.getItem('adoreino_settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      switch (provider) {
        case 'openai':
          return parsed.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY || 'demo-key'
        case 'anthropic':
          return parsed.anthropicApiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || 'demo-key'
        case 'google':
          return parsed.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY || 'demo-key'
        default:
          return 'demo-key'
      }
    }
  } catch (error) {
    console.warn('Failed to read stored API keys:', error)
  }
  
  // Fallback to environment variables
  const envKey = `VITE_${provider.toUpperCase()}_API_KEY`
  return import.meta.env[envKey] || 'demo-key'
}

// Export factory function for easy instantiation
export function createAIService(config: Partial<AIServiceConfig> = {}): AIService {
  console.log(`\n🔧 AI SERVICE INITIALIZATION`)
  
  // Check stored settings
  const storedOpenaiKey = getApiKey('openai')
  const storedAnthropicKey = getApiKey('anthropic')
  const storedGoogleKey = getApiKey('google')
  
  console.log(`📋 API Keys status:`)
  console.log(`   OpenAI: ${storedOpenaiKey !== 'demo-key' ? 'CONFIGURED' : 'NOT SET'}`)
  console.log(`   Anthropic: ${storedAnthropicKey !== 'demo-key' ? 'CONFIGURED' : 'NOT SET'}`)
  console.log(`   Google: ${storedGoogleKey !== 'demo-key' ? 'CONFIGURED' : 'NOT SET'}`)
  console.log(`   Default Provider: ${import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'AUTO'}`)
  
  // Check if user specified a preferred provider
  const preferredProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER
  let finalProvider: { provider: string; model: string }
  
  if (preferredProvider && preferredProvider !== 'local') {
    const apiKey = getApiKey(preferredProvider)
    
    if (apiKey !== 'demo-key' && validateApiKey(preferredProvider, apiKey)) {
      const modelMap: Record<string, string> = {
        openai: 'gpt-4-turbo',
        anthropic: 'claude-3-sonnet',
        google: 'gemini-2.5-flash'
      }
      finalProvider = {
        provider: preferredProvider,
        model: modelMap[preferredProvider] || 'local'
      }
      console.log(`✅ USING PREFERRED: ${preferredProvider} (configured via settings or env)`)
    } else {
      console.log(`❌ PREFERRED PROVIDER INVALID: ${preferredProvider} API key not valid`)
      finalProvider = getBestAvailableProvider()
    }
  } else {
    finalProvider = getBestAvailableProvider()
  }
  
  let apiKey = 'demo-key'
  if (finalProvider.provider !== 'local') {
    apiKey = getApiKey(finalProvider.provider)
  }
  
  const defaultConfig: AIServiceConfig = {
    provider: finalProvider.provider as AIProvider,
    model: finalProvider.model as AIModel,
    apiKey,
    maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 2000,
    temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7,
    ...config
  }
  
  // Final validation
  if (defaultConfig.provider !== 'local' && !validateApiKey(defaultConfig.provider, defaultConfig.apiKey)) {
    console.warn(`❌ VALIDATION FAILED: Invalid API key for ${defaultConfig.provider}, falling back to local mode`)
    defaultConfig.provider = 'local'
    defaultConfig.model = 'local'
    defaultConfig.apiKey = 'demo-key'
  }
  
  console.log(`🎯 FINAL CONFIG: Provider=${defaultConfig.provider}, Model=${defaultConfig.model}`)
  console.log(`🔐 API Key Status: ${defaultConfig.apiKey !== 'demo-key' ? 'REAL KEY' : 'DEMO KEY'}\n`)
  
  const service = new AIService(defaultConfig)
  
  // Clean up expired cache entries on startup
  service.clearExpiredCache()
  
  return service
}

// Context-aware AI analysis methods
declare module './aiService' {
  interface AIService {
    analyzeProjectContext(results: AdoreInoResults): Promise<ProjectContext>
    generateContextAwareExplanations(
      technicalStructure: any,
      userProfile: string,
      context: ProjectContext
    ): Promise<AIExplanation[]>
    generateContextAwareRecommendations(
      results: AdoreInoResults,
      userProfile: string,
      context: ProjectContext
    ): Promise<BusinessRecommendation[]>
    generateContextAwareExecutiveSummary(
      results: AdoreInoResults,
      context: ProjectContext
    ): Promise<string>
  }
}

interface ProjectContext {
  type: 'webapp' | 'mobile' | 'api' | 'library' | 'ecommerce' | 'cms' | 'saas' | 'unknown'
  specializations: string[]
  businessDomain: string
  scalingNeeds: string
  securityLevel: 'low' | 'medium' | 'high' | 'critical'
}

// Add methods to AIService prototype
AIService.prototype.analyzeProjectContext = async function(results: AdoreInoResults): Promise<ProjectContext> {
  const technologies = results.systemOverview.mainTechnologies.join(' ')
  const prompt = `Analyze this codebase context and categorize the project:

Technologies: ${technologies}
File Count: ${results.technicalStructure.codeMetrics.totalFiles}
Architecture: ${results.technicalStructure.architecture.pattern}
Dependencies: ${results.technicalStructure.dependencies.slice(0, 10).map(d => d.name).join(', ')}

Determine:
1. Project Type: webapp/mobile/api/library/ecommerce/cms/saas/unknown
2. Specializations: e.g., ["real-time", "data-heavy", "user-facing", "b2b", "fintech"]
3. Business Domain: e.g., "Healthcare", "Finance", "E-commerce", "SaaS", "Education"
4. Scaling Needs: "startup/growth/enterprise"
5. Security Level: low/medium/high/critical

Format as JSON:
{
  "type": "webapp",
  "specializations": ["user-facing", "real-time"],
  "businessDomain": "E-commerce",
  "scalingNeeds": "growth",
  "securityLevel": "high"
}`

  try {
    const response = await this.callAI({ prompt, maxTokens: 2000 })
    const contextMatch = response.match(/\{[\s\S]*\}/)
    
    if (contextMatch) {
      return JSON.parse(contextMatch[0])
    }
  } catch (error) {
    console.error('Context analysis failed:', error)
  }

  // Fallback to heuristic detection
  return this.detectContextHeuristically(results)
}

AIService.prototype.detectContextHeuristically = function(results: AdoreInoResults): ProjectContext {
  const techs = results.systemOverview.mainTechnologies.join(' ').toLowerCase()
  
  let type: ProjectContext['type'] = 'unknown'
  let specializations: string[] = []
  let businessDomain = 'General'
  let securityLevel: ProjectContext['securityLevel'] = 'medium'

  // Detect project type
  if (techs.includes('react') || techs.includes('vue') || techs.includes('angular')) {
    type = 'webapp'
    specializations.push('user-facing')
  }
  if (techs.includes('express') || techs.includes('fastapi') || techs.includes('spring')) {
    type = 'api'
    specializations.push('backend')
  }
  if (techs.includes('woocommerce') || techs.includes('shopify') || techs.includes('stripe')) {
    type = 'ecommerce'
    businessDomain = 'E-commerce'
    securityLevel = 'high'
  }
  if (techs.includes('wordpress') || techs.includes('drupal')) {
    type = 'cms'
    businessDomain = 'Content Management'
  }

  // Detect specializations
  if (techs.includes('socket') || techs.includes('websocket')) specializations.push('real-time')
  if (techs.includes('database') || techs.includes('sql') || techs.includes('mongodb')) specializations.push('data-heavy')
  if (techs.includes('auth') || techs.includes('jwt') || techs.includes('oauth')) specializations.push('secure')

  return {
    type,
    specializations,
    businessDomain,
    scalingNeeds: results.technicalStructure.codeMetrics.totalFiles > 100 ? 'enterprise' : 'growth',
    securityLevel
  }
}

AIService.prototype.generateContextAwareExplanations = async function(
  technicalStructure: any,
  userProfile: string,
  context: ProjectContext
): Promise<AIExplanation[]> {
  const explanations: AIExplanation[] = []
  
  // Context-specific analysis prompts
  const contextPrompts = {
    webapp: "Focus on user experience, performance, and frontend architecture",
    api: "Analyze API design, security, rate limiting, and data validation", 
    ecommerce: "Evaluate payment security, inventory management, and checkout flow",
    cms: "Review content management, user permissions, and SEO optimization",
    saas: "Assess multi-tenancy, billing integration, and scalability patterns"
  }

  const basePrompt = contextPrompts[context.type] || "Provide general code analysis"
  
  for (const module of technicalStructure.modules.slice(0, 3)) {
    const prompt = `${basePrompt}

Analyze this ${context.type} module for ${context.businessDomain}:
Module: ${module.name} (${module.linesOfCode} lines)
Specializations: ${context.specializations.join(', ')}
Security Level: ${context.securityLevel}

Provide specific insights for this business context.`

    try {
      const explanation = await this.callAI({ prompt, maxTokens: 1500 })
      
      explanations.push({
        context: `${module.name} (${context.type} context)`,
        explanation,
        reasoning: `Analysis specialized for ${context.businessDomain} ${context.type} applications`,
        confidence: 0.9,
        relatedFiles: module.dependencies || [],
        businessValue: `Critical for ${context.specializations.join(' and ')} functionality`
      })
    } catch (error) {
      console.error('Context-aware explanation failed:', error)
    }
  }

  return explanations
}

AIService.prototype.generateContextAwareRecommendations = async function(
  results: AdoreInoResults,
  userProfile: string,
  context: ProjectContext
): Promise<BusinessRecommendation[]> {
  const prompt = `Create strategic recommendations for this ${context.type} project:

Business Context: ${context.businessDomain}
Specializations: ${context.specializations.join(', ')}
Security Requirements: ${context.securityLevel}
Scale: ${context.scalingNeeds}

Current State:
- Quality: ${results.systemOverview.qualityRating} (${results.systemOverview.overallScore}/100)
- Risk Level: ${results.riskAssessment.overallRisk}
- Technical Debt: ${results.technicalStructure.codeMetrics.technicalDebt}%

Provide 3-5 context-specific recommendations with:
1. Business impact for ${context.businessDomain}
2. Implementation priority
3. Cost/effort estimates
4. Risk mitigation strategies

Focus on ${context.specializations.join(' and ')} requirements.`

  try {
    const aiResponse = await this.callAI({ prompt, maxTokens: 2500 })
    return this.parseRecommendationsFromAI(aiResponse, context)
  } catch (error) {
    console.error('Context-aware recommendations failed:', error)
    return []
  }
}

AIService.prototype.parseRecommendationsFromAI = function(response: string, context: ProjectContext): BusinessRecommendation[] {
  // Parse AI response into structured recommendations
  const recommendations: BusinessRecommendation[] = []
  const sections = response.split(/\d+\./).filter(s => s.trim().length > 0)
  
  sections.slice(0, 5).forEach((section, index) => {
    const lines = section.trim().split('\n')
    const title = lines[0] || `${context.type} Improvement ${index + 1}`
    
    recommendations.push({
      title: title.replace(/[*#]/g, '').trim(),
      category: this.getCategoryFromContext(context, title),
      priority: index < 2 ? 'high' : 'medium',
      description: lines.slice(1, 3).join(' ').trim() || 'Implementation needed',
      businessImpact: `Improves ${context.specializations.join(' and ')} capabilities`,
      costEstimate: context.scalingNeeds === 'enterprise' ? '€5,000-€15,000' : '€1,000-€5,000',
      timeline: index < 2 ? '2-4 weeks' : '1-2 months',
      benefits: [
        `Enhanced ${context.businessDomain.toLowerCase()} functionality`,
        `Better ${context.securityLevel} security compliance`,
        'Improved maintainability'
      ],
      risks: [
        'Implementation complexity',
        'Temporary performance impact'
      ]
    })
  })
  
  return recommendations
}

AIService.prototype.getCategoryFromContext = function(context: ProjectContext, title: string): string {
  if (title.toLowerCase().includes('security') || context.securityLevel === 'critical') return 'security'
  if (title.toLowerCase().includes('performance') || context.specializations.includes('real-time')) return 'performance'
  if (context.type === 'api') return 'architecture'
  return 'improve'
}

AIService.prototype.generateContextAwareExecutiveSummary = async function(
  results: AdoreInoResults,
  context: ProjectContext
): Promise<string> {
  const prompt = `Create an executive summary for this ${context.businessDomain} ${context.type} project:

Business Context: ${context.scalingNeeds} stage ${context.businessDomain} company
Technical Status: ${results.systemOverview.qualityRating} quality, ${results.riskAssessment.overallRisk} risk
Key Technologies: ${results.systemOverview.mainTechnologies.join(', ')}
Security Level: ${context.securityLevel}

Provide a 3-paragraph executive summary focusing on:
1. Business-critical findings and their impact on ${context.businessDomain} operations
2. Investment priorities for ${context.scalingNeeds} stage growth
3. Strategic recommendations with ROI considerations

Write for C-level executives who understand ${context.businessDomain} but may not be technical.`

  try {
    return await this.callAI({ prompt, maxTokens: 2000 })
  } catch (error) {
    console.error('Executive summary generation failed:', error)
    return `Executive Summary: ${context.businessDomain} ${context.type} system analysis completed with ${results.systemOverview.qualityRating} overall quality rating.`
  }
}

// Export provider status for UI components
export { getProviderStatus, getAvailableProviders } from './aiProviders'