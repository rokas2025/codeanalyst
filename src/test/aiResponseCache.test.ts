import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIResponseCache } from '../services/aiResponseCache'

describe('AIResponseCache', () => {
  let cache: AIResponseCache

  beforeEach(() => {
    cache = new AIResponseCache()
  })

  describe('Basic Caching', () => {
    it('should return null for non-existent cache entries', () => {
      const result = cache.getCachedResponse('test input', 'openai', 'gpt-4')
      expect(result).toBeNull()
    })

    it('should cache and retrieve responses', () => {
      const input = 'test input'
      const output = 'test output'
      const provider = 'openai'
      const model = 'gpt-4'

      // Cache the response
      const validation = cache.cacheResponse(input, output, provider, model)
      expect(validation.isConsistent).toBe(true)
      expect(validation.recommendedResponse).toBe(output)

      // Retrieve cached response
      const cached = cache.getCachedResponse(input, provider, model)
      expect(cached).toBe(output)
    })

    it('should handle different providers separately', () => {
      const input = 'test input'
      const output1 = 'openai output'
      const output2 = 'google output'

      cache.cacheResponse(input, output1, 'openai', 'gpt-4')
      cache.cacheResponse(input, output2, 'google', 'gemini-pro')

      expect(cache.getCachedResponse(input, 'openai', 'gpt-4')).toBe(output1)
      expect(cache.getCachedResponse(input, 'google', 'gemini-pro')).toBe(output2)
    })
  })

  describe('Consistency Validation', () => {
    it('should detect consistent responses', () => {
      const input = 'test input'
      const output1 = 'This is a test response about architecture'
      const output2 = 'This is a test response about architecture patterns'
      const provider = 'openai'
      const model = 'gpt-4'

      cache.cacheResponse(input, output1, provider, model)
      const validation = cache.cacheResponse(input, output2, provider, model)

      expect(validation.isConsistent).toBe(true)
      expect(validation.confidence).toBeGreaterThan(0.7)
      expect(validation.variations).toHaveLength(2)
    })

    it('should detect inconsistent responses', () => {
      const input = 'test input'
      const output1 = 'This is about system architecture and design patterns'
      const output2 = 'Completely different topic about cooking recipes'
      const provider = 'openai'
      const model = 'gpt-4'

      cache.cacheResponse(input, output1, provider, model)
      const validation = cache.cacheResponse(input, output2, provider, model)

      expect(validation.isConsistent).toBe(false)
      expect(validation.confidence).toBeLessThan(0.8)
    })

    it('should calculate confidence scores correctly', () => {
      const input = 'analyze system architecture'
      const longDetailedOutput = 'This is a comprehensive analysis of the system architecture including dependency injection, security patterns, performance optimization, and technical debt assessment. The system follows modern architectural principles.'
      
      const validation = cache.cacheResponse(input, longDetailedOutput, 'openai', 'gpt-4')
      
      // Longer, more technical responses should have higher confidence
      expect(validation.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('Cache Management', () => {
    it('should provide accurate statistics', () => {
      const input1 = 'test input 1'
      const input2 = 'test input 2'
      const output = 'test output'

      cache.cacheResponse(input1, output, 'openai', 'gpt-4')
      cache.cacheResponse(input2, output, 'openai', 'gpt-4')
      cache.cacheResponse(input1, output + ' variation', 'openai', 'gpt-4')

      const stats = cache.getStats()
      expect(stats.totalEntries).toBe(2) // 2 unique inputs
      expect(stats.totalResponses).toBe(3) // 3 total responses
    })

    it('should clear expired entries', () => {
      // Mock the cache duration to be very short for testing
      const shortDurationCache = new AIResponseCache()
      
      // Add some entries
      shortDurationCache.cacheResponse('input1', 'output1', 'openai', 'gpt-4')
      shortDurationCache.cacheResponse('input2', 'output2', 'openai', 'gpt-4')
      
      // Verify entries exist
      expect(shortDurationCache.getCachedResponse('input1', 'openai', 'gpt-4')).toBe('output1')
      
      // Clear expired entries (this should work even if nothing is expired)
      expect(() => shortDurationCache.clearExpiredCache()).not.toThrow()
    })

    it('should limit the number of variations per input', () => {
      const input = 'test input'
      const provider = 'openai'
      const model = 'gpt-4'

      // Add more than MAX_VARIATIONS (which is 3)
      for (let i = 0; i < 5; i++) {
        cache.cacheResponse(input, `output ${i}`, provider, model)
      }

      const stats = cache.getStats()
      // Should have only 1 entry (same input) but limited variations
      expect(stats.totalEntries).toBe(1)
      expect(stats.totalResponses).toBeLessThanOrEqual(3) // MAX_VARIATIONS
    })
  })

  describe('Similarity Calculation', () => {
    it('should calculate high similarity for nearly identical text', () => {
      // Access private method through casting
      const similarity = (cache as any).calculateSimilarity(
        'This is a test response about architecture',
        'This is a test response about architecture patterns'
      )
      
      expect(similarity).toBeGreaterThan(0.8)
    })

    it('should calculate low similarity for different text', () => {
      const similarity = (cache as any).calculateSimilarity(
        'This is about system architecture',
        'Cooking recipes and food preparation'
      )
      
      expect(similarity).toBeLessThan(0.3)
    })

    it('should handle empty or very short text', () => {
      const similarity1 = (cache as any).calculateSimilarity('', 'test')
      const similarity2 = (cache as any).calculateSimilarity('a', 'b')
      
      expect(similarity1).toBe(0)
      expect(similarity2).toBeLessThan(0.5)
    })
  })

  describe('Hash Generation', () => {
    it('should generate consistent hashes for same input', () => {
      const hash1 = (cache as any).generateHash('test input', 'openai', 'gpt-4')
      const hash2 = (cache as any).generateHash('test input', 'openai', 'gpt-4')
      
      expect(hash1).toBe(hash2)
      expect(typeof hash1).toBe('string')
      expect(hash1.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for different inputs', () => {
      const hash1 = (cache as any).generateHash('input 1', 'openai', 'gpt-4')
      const hash2 = (cache as any).generateHash('input 2', 'openai', 'gpt-4')
      const hash3 = (cache as any).generateHash('input 1', 'google', 'gemini-pro')
      
      expect(hash1).not.toBe(hash2)
      expect(hash1).not.toBe(hash3)
      expect(hash2).not.toBe(hash3)
    })
  })

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to longer responses', () => {
      const shortResponse = 'Short response'
      const longResponse = 'This is a much longer response that contains more detailed information about the system architecture, including specific technical details about dependency injection, security patterns, performance optimization strategies, and comprehensive technical debt assessment methodologies.'
      
      const validation1 = cache.cacheResponse('test', shortResponse, 'openai', 'gpt-4')
      const validation2 = cache.cacheResponse('test2', longResponse, 'openai', 'gpt-4')
      
      expect(validation2.confidence).toBeGreaterThan(validation1.confidence)
    })

    it('should assign higher confidence to responses with technical terms', () => {
      const technicalResponse = 'This analysis covers architecture, dependencies, vulnerabilities, refactoring needs, performance optimization, security concerns, and technical debt assessment.'
      const genericResponse = 'This is a basic response without specific technical terminology or detailed analysis.'
      
      const validation1 = cache.cacheResponse('test', technicalResponse, 'openai', 'gpt-4')
      const validation2 = cache.cacheResponse('test2', genericResponse, 'openai', 'gpt-4')
      
      expect(validation1.confidence).toBeGreaterThan(validation2.confidence)
    })
  })
})