import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAIService } from '../services/aiService'
import { AdoreInoResults } from '../types'

// Mock file processing utilities
vi.mock('../utils/fileProcessing', () => ({
  analyzeCodebase: vi.fn(),
  extractFileStructure: vi.fn(),
  calculateMetrics: vi.fn()
}))

describe('Code Analysis Reliability', () => {
  let aiService: any

  beforeEach(() => {
    aiService = createAIService({
      provider: 'local',
      model: 'local',
      apiKey: 'test-key'
    })
  })

  const mockCodebaseResults: AdoreInoResults = {
    systemOverview: {
      qualityRating: 'Good',
      overallScore: 75,
      mainTechnologies: ['React', 'TypeScript', 'Node.js'],
      estimatedComplexity: 'Medium',
      lastAnalyzed: new Date().toISOString()
    },
    technicalStructure: {
      architecture: {
        pattern: 'Component-based',
        layerStructure: ['Presentation', 'Business Logic', 'Data Access'],
        dataFlow: 'Unidirectional',
        designPatterns: ['Observer', 'Factory', 'Singleton']
      },
      modules: [
        {
          name: 'Authentication',
          path: '/src/auth',
          linesOfCode: 1250,
          dependencies: ['bcrypt', 'jsonwebtoken', 'express'],
          type: 'service',
          description: 'User authentication and authorization module',
          complexity: 'Medium',
          testCoverage: 85
        },
        {
          name: 'UserManagement',
          path: '/src/users',
          linesOfCode: 890,
          dependencies: ['mongoose', 'validator'],
          type: 'service',
          description: 'User profile and data management',
          complexity: 'Low',
          testCoverage: 92
        }
      ],
      dependencies: [
        {
          name: 'react',
          version: '18.2.0',
          latestVersion: '18.2.0',
          isOutdated: false,
          securityIssues: 0,
          licenseType: 'MIT'
        },
        {
          name: 'lodash',
          version: '4.17.20',
          latestVersion: '4.17.21',
          isOutdated: true,
          securityIssues: 2,
          licenseType: 'MIT'
        }
      ],
      codeMetrics: {
        totalFiles: 156,
        totalLines: 24680,
        complexity: 'Medium',
        technicalDebt: 18.5,
        testCoverage: 78.2,
        maintainabilityIndex: 65,
        cyclomaticComplexity: 12.4
      }
    },
    riskAssessment: {
      overallRisk: 'Medium',
      risks: [
        {
          title: 'Outdated Dependencies',
          description: 'Several dependencies are behind latest versions',
          type: 'security',
          impact: 'medium',
          likelihood: 'high',
          mitigation: 'Update dependencies to latest stable versions'
        },
        {
          title: 'Low Test Coverage Areas',
          description: 'Some modules have insufficient test coverage',
          type: 'quality',
          impact: 'medium',
          likelihood: 'medium',
          mitigation: 'Implement comprehensive testing for uncovered modules'
        }
      ]
    },
    maintenanceNeeds: {
      priorityLevel: 'Medium',
      urgentTasks: [
        'Update lodash to fix security vulnerabilities',
        'Add integration tests for authentication flow',
        'Refactor complex utility functions'
      ],
      scheduledTasks: [
        'Implement code documentation standards',
        'Set up automated dependency updates',
        'Create performance monitoring dashboard'
      ],
      estimatedEffort: '2-3 months'
    }
  }

  describe('Analysis Consistency', () => {
    it('should produce consistent results for the same codebase', async () => {
      const iterations = 3
      const results: any[] = []

      for (let i = 0; i < iterations; i++) {
        const enhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'mixed')
        results.push(enhanced)
      }

      // Check that all results have the same basic structure
      results.forEach(result => {
        expect(result).toHaveProperty('aiExplanations')
        expect(result).toHaveProperty('businessRecommendations')
        expect(result).toHaveProperty('executiveSummary')
        expect(Array.isArray(result.aiExplanations)).toBe(true)
        expect(Array.isArray(result.businessRecommendations)).toBe(true)
      })

      // Check that AI explanations are consistent in count and context
      const explanationCounts = results.map(r => r.aiExplanations.length)
      const allSameCount = explanationCounts.every(count => count === explanationCounts[0])
      expect(allSameCount).toBe(true)

      // Check that executive summaries address similar key points
      const summaries = results.map(r => r.executiveSummary)
      summaries.forEach(summary => {
        expect(typeof summary).toBe('string')
        expect(summary.length).toBeGreaterThan(50)
      })
    })

    it('should generate consistent confidence scores', async () => {
      const enhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'technical')
      const explanations = enhanced.aiExplanations

      // All explanations should have confidence scores within reasonable range
      explanations.forEach((explanation: any) => {
        expect(explanation.confidence).toBeGreaterThanOrEqual(0)
        expect(explanation.confidence).toBeLessThanOrEqual(1)
        expect(typeof explanation.confidence).toBe('number')
      })

      // Architecture explanations should generally have higher confidence
      const archExplanation = explanations.find((e: any) => e.context.includes('Architecture'))
      if (archExplanation) {
        expect(archExplanation.confidence).toBeGreaterThan(0.7)
      }
    })
  })

  describe('Response Quality Validation', () => {
    it('should generate contextually appropriate explanations', async () => {
      const enhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'business')
      const explanations = enhanced.aiExplanations

      explanations.forEach((explanation: any) => {
        // Each explanation should have required fields
        expect(explanation).toHaveProperty('context')
        expect(explanation).toHaveProperty('explanation')
        expect(explanation).toHaveProperty('reasoning')
        expect(explanation).toHaveProperty('businessValue')
        expect(explanation).toHaveProperty('relatedFiles')

        // Content should be substantial
        expect(explanation.explanation.length).toBeGreaterThan(100)
        expect(explanation.businessValue.length).toBeGreaterThan(50)
        expect(Array.isArray(explanation.relatedFiles)).toBe(true)
      })
    })

    it('should generate actionable business recommendations', async () => {
      const enhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'business')
      const recommendations = enhanced.businessRecommendations

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.length).toBeLessThanOrEqual(3)

      recommendations.forEach((rec: any) => {
        // Each recommendation should have required business fields
        expect(rec).toHaveProperty('category')
        expect(rec).toHaveProperty('title')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('businessImpact')
        expect(rec).toHaveProperty('costEstimate')
        expect(rec).toHaveProperty('timeline')
        expect(rec).toHaveProperty('risks')
        expect(rec).toHaveProperty('benefits')
        expect(rec).toHaveProperty('priority')

        // Validate recommendation categories
        expect(['maintain', 'improve', 'migrate', 'replace']).toContain(rec.category)

        // Validate that risks and benefits are arrays
        expect(Array.isArray(rec.risks)).toBe(true)
        expect(Array.isArray(rec.benefits)).toBe(true)
        expect(rec.risks.length).toBeGreaterThan(0)
        expect(rec.benefits.length).toBeGreaterThan(0)

        // Priority should be numeric
        expect(typeof rec.priority).toBe('number')
      })
    })

    it('should create comprehensive executive summaries', async () => {
      const enhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'mixed')
      const summary = enhanced.executiveSummary

      expect(typeof summary).toBe('string')
      expect(summary.length).toBeGreaterThan(200)

      // Should mention key metrics from the analysis (case insensitive)
      const summaryLower = summary.toLowerCase()
      const hasMetrics = /score|rating|risk|health|condition|system|good|analysis/.test(summaryLower)
      expect(hasMetrics).toBe(true)
      
      // Should contain actionable language
      expect(summaryLower).toMatch(/recommend|should|focus|priority|improve/)
    })
  })

  describe('User Profile Adaptation', () => {
    it('should adapt explanations for business users', async () => {
      const businessEnhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'business')
      const explanations = businessEnhanced.aiExplanations

      explanations.forEach((explanation: any) => {
        const content = explanation.explanation.toLowerCase()
        const businessValue = explanation.businessValue.toLowerCase()

        // Should contain business-oriented language
        expect(businessValue).toMatch(/business|cost|efficiency|value|growth|market/)
        
        // Should minimize technical jargon in business mode (but some technical terms are expected)
        const jargonCount = (content.match(/api|framework|library|dependency|refactor/g) || []).length
        const totalWords = content.split(' ').length
        const jargonRatio = jargonCount / totalWords
        expect(jargonRatio).toBeLessThan(0.2) // Less than 20% jargon (relaxed for demo mode)
      })
    })

    it('should provide technical details for technical users', async () => {
      const technicalEnhanced = await aiService.enhanceAnalysisWithAI(mockCodebaseResults, 'technical')
      const explanations = technicalEnhanced.aiExplanations

      explanations.forEach((explanation: any) => {
        const content = explanation.explanation.toLowerCase()
        
        // Should contain technical terminology
        const technicalTerms = ['architecture', 'dependency', 'module', 'component', 'pattern', 'implementation']
        const foundTerms = technicalTerms.filter(term => content.includes(term))
        expect(foundTerms.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Cache Integration', () => {
    it('should use caching for consistent results', async () => {
      const prompt = 'Test caching integration'
      
      // First call
      const response1 = await aiService['callAI']({ 
        prompt, 
        maxTokens: 1000 
      })
      
      // Second call should return identical cached result
      const response2 = await aiService['callAI']({ 
        prompt, 
        maxTokens: 1000 
      })
      
      expect(response1).toBe(response2)
    })

    it('should provide cache statistics', () => {
      const stats = aiService.getCacheStats()
      
      expect(typeof stats.totalEntries).toBe('number')
      expect(typeof stats.totalResponses).toBe('number')
      expect(typeof stats.cacheHitRate).toBe('number')
    })

    it('should test response consistency', async () => {
      const consistencyTest = await aiService.testResponseConsistency(
        'Analyze system architecture for consistency test',
        3
      )

      expect(consistencyTest).toHaveProperty('responses')
      expect(consistencyTest).toHaveProperty('averageSimilarity')
      expect(consistencyTest).toHaveProperty('isConsistent')
      expect(consistencyTest).toHaveProperty('recommendedResponse')

      expect(consistencyTest.responses).toHaveLength(3)
      expect(typeof consistencyTest.averageSimilarity).toBe('number')
      expect(consistencyTest.averageSimilarity).toBeGreaterThanOrEqual(0)
      expect(consistencyTest.averageSimilarity).toBeLessThanOrEqual(1)
    })
  })

  describe('Error Handling and Reliability', () => {
    it('should handle partial analysis data gracefully', async () => {
      const partialResults = {
        ...mockCodebaseResults,
        technicalStructure: {
          ...mockCodebaseResults.technicalStructure,
          modules: [] // Empty modules array
        }
      }

      const enhanced = await aiService.enhanceAnalysisWithAI(partialResults, 'mixed')
      
      // Should still produce valid results
      expect(enhanced).toHaveProperty('aiExplanations')
      expect(enhanced).toHaveProperty('executiveSummary')
      expect(Array.isArray(enhanced.aiExplanations)).toBe(true)
    })

    it('should provide fallback responses when AI fails', async () => {
      // Mock a failing AI service
      const failingService = createAIService({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'invalid-key'
      })

      // Even with invalid key, should get fallback responses
      const response = await failingService['callAI']({
        prompt: 'Test fallback behavior',
        maxTokens: 1000
      })

      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
      expect(response).toContain('[🤖 DEMO MODE - NOT REAL AI]')
    })

    it('should maintain consistent fallback behavior', async () => {
      const failingService = createAIService({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'invalid-key'
      })

      const prompt = 'Consistent fallback test'
      const response1 = await failingService['callAI']({ prompt, maxTokens: 1000 })
      const response2 = await failingService['callAI']({ prompt, maxTokens: 1000 })

      // Fallback responses should be consistent due to caching
      expect(response1).toBe(response2)
    })
  })
})