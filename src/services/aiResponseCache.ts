// Browser-compatible hashing (no crypto module needed)

interface CachedResponse {
  input: string
  output: string
  timestamp: number
  provider: string
  model: string
  confidence: number
}

interface ResponseValidation {
  isConsistent: boolean
  confidence: number
  variations: string[]
  recommendedResponse: string
}

export class AIResponseCache {
  private cache = new Map<string, CachedResponse[]>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.8
  private readonly MAX_VARIATIONS = 3

  /**
   * Generate a deterministic hash for the input (browser-compatible)
   */
  private generateHash(input: string, provider: string, model: string): string {
    const combinedInput = JSON.stringify({ input, provider, model })
    
    // Simple browser-compatible hash function
    let hash = 0
    for (let i = 0; i < combinedInput.length; i++) {
      const char = combinedInput.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Convert to positive hex string
    return Math.abs(hash).toString(16)
  }

  /**
   * Calculate similarity between two responses
   */
  private calculateSimilarity(response1: string, response2: string): number {
    // Simple word-based similarity - can be enhanced with more sophisticated NLP
    const words1 = response1.toLowerCase().split(/\s+/)
    const words2 = response2.toLowerCase().split(/\s+/)
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }

  /**
   * Get cached response if it exists and is recent
   */
  getCachedResponse(input: string, provider: string, model: string): string | null {
    const hash = this.generateHash(input, provider, model)
    const cached = this.cache.get(hash)
    
    if (!cached || cached.length === 0) {
      return null
    }

    // Check if cache is still valid
    const now = Date.now()
    const validResponses = cached.filter(
      response => now - response.timestamp < this.CACHE_DURATION
    )

    if (validResponses.length === 0) {
      this.cache.delete(hash)
      return null
    }

    // Return the most confident response
    const bestResponse = validResponses.sort((a, b) => b.confidence - a.confidence)[0]
    return bestResponse.output
  }

  /**
   * Cache a new response and validate consistency
   */
  cacheResponse(
    input: string, 
    output: string, 
    provider: string, 
    model: string
  ): ResponseValidation {
    const hash = this.generateHash(input, provider, model)
    const timestamp = Date.now()
    
    // Get existing responses
    const existing = this.cache.get(hash) || []
    
    // Calculate confidence based on input complexity and response length
    const confidence = this.calculateConfidence(input, output)
    
    const newResponse: CachedResponse = {
      input,
      output,
      timestamp,
      provider,
      model,
      confidence
    }

    // Add to cache
    existing.push(newResponse)
    
    // Keep only recent responses and limit variations
    const recentResponses = existing
      .filter(r => timestamp - r.timestamp < this.CACHE_DURATION)
      .slice(-this.MAX_VARIATIONS)
    
    this.cache.set(hash, recentResponses)

    // Validate consistency
    return this.validateResponseConsistency(recentResponses)
  }

  /**
   * Calculate confidence score for a response
   */
  private calculateConfidence(input: string, output: string): number {
    let confidence = 0.5 // Base confidence

    // Longer, more detailed responses get higher confidence
    const outputLength = output.length
    if (outputLength > 500) confidence += 0.2
    if (outputLength > 1000) confidence += 0.1

    // Responses with specific technical terms get higher confidence
    const technicalTerms = [
      'architecture', 'dependency', 'vulnerability', 'refactor',
      'performance', 'security', 'optimization', 'technical debt'
    ]
    const foundTerms = technicalTerms.filter(term => 
      output.toLowerCase().includes(term)
    ).length
    
    confidence += (foundTerms / technicalTerms.length) * 0.2

    // Cap at 1.0
    return Math.min(confidence, 1.0)
  }

  /**
   * Validate consistency across multiple responses
   */
  private validateResponseConsistency(responses: CachedResponse[]): ResponseValidation {
    if (responses.length === 1) {
      return {
        isConsistent: true,
        confidence: responses[0].confidence,
        variations: [responses[0].output],
        recommendedResponse: responses[0].output
      }
    }

    // Compare all responses for similarity
    const similarities: number[] = []
    const variations = responses.map(r => r.output)

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similarities.push(
          this.calculateSimilarity(responses[i].output, responses[j].output)
        )
      }
    }

    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
    const isConsistent = avgSimilarity >= this.MIN_CONFIDENCE_THRESHOLD

    // Choose the response with highest confidence
    const recommendedResponse = responses
      .sort((a, b) => b.confidence - a.confidence)[0].output

    return {
      isConsistent,
      confidence: avgSimilarity,
      variations,
      recommendedResponse
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalEntries = this.cache.size
    const totalResponses = Array.from(this.cache.values())
      .reduce((sum, responses) => sum + responses.length, 0)

    return {
      totalEntries,
      totalResponses,
      cacheHitRate: this.calculateCacheHitRate()
    }
  }

  private calculateCacheHitRate(): number {
    // This would need to be tracked over time
    // For now, return a placeholder
    return 0
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    
    for (const [hash, responses] of this.cache.entries()) {
      const validResponses = responses.filter(
        response => now - response.timestamp < this.CACHE_DURATION
      )
      
      if (validResponses.length === 0) {
        this.cache.delete(hash)
      } else {
        this.cache.set(hash, validResponses)
      }
    }
  }
}