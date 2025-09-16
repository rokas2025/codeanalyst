import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIService, createAIService } from '../services/aiService'
import { AIResponseCache } from '../services/aiResponseCache'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock AI providers
vi.mock('../services/aiProviders', () => ({
  getBestAvailableProvider: vi.fn(() => ({ provider: 'local', model: 'local' })),
  validateApiKey: vi.fn(() => true),
  getProviderStatus: vi.fn(() => ({ available: true, error: null })),
  getAvailableProviders: vi.fn(() => [])
}))

describe('AIService', () => {
  let service: AIService

  beforeEach(() => {
    service = createAIService({
      provider: 'local',
      model: 'local',
      apiKey: 'test-key'
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    service.clearExpiredCache()
  })

  describe('Response Caching', () => {
    it('should return cached responses for consistent results', async () => {
      const prompt = 'Test architecture analysis'
      
      // First call should create cache entry
      const response1 = await service['callAI']({ prompt, maxTokens: 1000 })
      
      // Second call should return cached response
      const response2 = await service['callAI']({ prompt, maxTokens: 1000 })
      
      expect(response1).toBe(response2)
      expect(response1).toContain('[🤖 DEMO MODE - NOT REAL AI]')
    })

    it('should cache different responses for different prompts', async () => {
      const prompt1 = 'Analyze architecture'
      const prompt2 = 'Analyze modules'
      
      const response1 = await service['callAI']({ prompt: prompt1, maxTokens: 1000 })
      const response2 = await service['callAI']({ prompt: prompt2, maxTokens: 1000 })
      
      expect(response1).not.toBe(response2)
      expect(response1).toContain('architecture')
      expect(response2).toContain('module')
    })

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats()
      
      expect(stats).toHaveProperty('totalEntries')
      expect(stats).toHaveProperty('totalResponses')
      expect(stats).toHaveProperty('cacheHitRate')
      expect(typeof stats.totalEntries).toBe('number')
    })
  })

  describe('Response Consistency Testing', () => {
    it('should test response consistency across multiple calls', async () => {
      const prompt = 'Test consistency analysis'
      
      const consistencyTest = await service.testResponseConsistency(prompt, 3)
      
      expect(consistencyTest).toHaveProperty('responses')
      expect(consistencyTest).toHaveProperty('averageSimilarity')
      expect(consistencyTest).toHaveProperty('isConsistent')
      expect(consistencyTest).toHaveProperty('recommendedResponse')
      
      expect(consistencyTest.responses).toHaveLength(3)
      expect(typeof consistencyTest.averageSimilarity).toBe('number')
      expect(typeof consistencyTest.isConsistent).toBe('boolean')
    })

    it('should identify consistent responses', async () => {
      const prompt = 'Architecture analysis'
      
      const consistencyTest = await service.testResponseConsistency(prompt, 2)
      
      // Mock responses should be identical, so similarity should be high
      expect(consistencyTest.averageSimilarity).toBeGreaterThan(0.9)
      expect(consistencyTest.isConsistent).toBe(true)
    })
  })

  describe('Mock Response Generation', () => {
    it('should generate appropriate mock responses for architecture', async () => {
      const response = await service['callAI']({ 
        prompt: 'Analyze system architecture', 
        maxTokens: 1000 
      })
      
      expect(response).toContain('[🤖 DEMO MODE - NOT REAL AI]')
      expect(response).toContain('architecture')
      expect(response).toContain('component-based')
    })

    it('should generate appropriate mock responses for modules', async () => {
      const response = await service['callAI']({ 
        prompt: 'Analyze module structure', 
        maxTokens: 1000 
      })
      
      expect(response).toContain('[🤖 DEMO MODE - NOT REAL AI]')
      expect(response).toContain('module')
      expect(response).toContain('business logic')
    })

    it('should generate appropriate mock responses for recommendations', async () => {
      const response = await service['callAI']({ 
        prompt: 'Generate recommendations for improvement', 
        maxTokens: 1000 
      })
      
      expect(response).toContain('[🤖 DEMO MODE - NOT REAL AI]')
      expect(response).toContain('recommend')
      expect(response).toMatch(/\d+[.)]/g) // Should contain numbered items
    })
  })

  describe('Real AI Provider Integration', () => {
    beforeEach(() => {
      // Reset to use real provider for these tests
      service = createAIService({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key'
      })
    })

    it('should handle API failures gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'))
      
      const response = await service['callAI']({ 
        prompt: 'Test prompt', 
        maxTokens: 1000 
      })
      
      // Should fallback to mock response
      expect(response).toContain('[🤖 DEMO MODE - NOT REAL AI]')
    })

    it('should cache failed responses for consistency', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'))
      
      const prompt = 'Test failed response caching'
      const response1 = await service['callAI']({ prompt, maxTokens: 1000 })
      const response2 = await service['callAI']({ prompt, maxTokens: 1000 })
      
      // Both should be identical fallback responses
      expect(response1).toBe(response2)
      expect(response1).toContain('[🤖 DEMO MODE - NOT REAL AI]')
    })
  })

  describe('Enhanced Analysis Integration', () => {
    it('should enhance analysis results with AI explanations', async () => {
      const mockResults = {
        systemOverview: {
          qualityRating: 'Good',
          overallScore: 75,
          mainTechnologies: ['React', 'TypeScript'],
          estimatedComplexity: 'Medium'
        },
        technicalStructure: {
          architecture: { pattern: 'Component-based', layerStructure: ['UI', 'Logic', 'Data'], dataFlow: 'Unidirectional' },
          modules: [
            { name: 'auth', path: '/src/auth', linesOfCode: 500, dependencies: ['axios'], type: 'service', description: 'Authentication module' }
          ],
          dependencies: [
            { name: 'react', version: '18.0.0', isOutdated: false, securityIssues: 0 }
          ],
          codeMetrics: {
            totalFiles: 50,
            totalLines: 5000,
            complexity: 'Medium',
            technicalDebt: 15,
            testCoverage: 85
          }
        },
        riskAssessment: {
          overallRisk: 'Medium',
          risks: [
            { title: 'Outdated Dependencies', type: 'security', impact: 'medium' }
          ]
        },
        maintenanceNeeds: {
          priorityLevel: 'Medium',
          urgentTasks: ['Update dependencies']
        }
      }

      const enhancedResults = await service.enhanceAnalysisWithAI(mockResults as any, 'mixed')
      
      expect(enhancedResults).toHaveProperty('aiExplanations')
      expect(enhancedResults).toHaveProperty('businessRecommendations')
      expect(enhancedResults).toHaveProperty('executiveSummary')
      
      expect(Array.isArray(enhancedResults.aiExplanations)).toBe(true)
      expect(Array.isArray(enhancedResults.businessRecommendations)).toBe(true)
      expect(typeof enhancedResults.executiveSummary).toBe('string')
    })
  })

  describe('Cache Management', () => {
    it('should clear expired cache entries', () => {
      // This test verifies the method exists and can be called
      expect(() => service.clearExpiredCache()).not.toThrow()
    })

    it('should maintain cache statistics', async () => {
      // Make a few cached calls
      await service['callAI']({ prompt: 'Test 1', maxTokens: 1000 })
      await service['callAI']({ prompt: 'Test 2', maxTokens: 1000 })
      
      const stats = service.getCacheStats()
      expect(stats.totalEntries).toBeGreaterThan(0)
    })
  })
})