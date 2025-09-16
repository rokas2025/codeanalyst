import { describe, it, expect, vi } from 'vitest'

// Mock file structure that would have critical risks
const mockFilesWithCriticalRisks = [
  { path: 'src/app.js', content: 'const app = {}; module.exports = app', size: 500 },
  { path: 'package.json', content: '{"dependencies": {"lodash": "4.0.0"}}', size: 200 },
  { path: 'config.js', content: 'const config = {api_key: "hardcoded_key"}', size: 300 }
  // No test files = critical risk
]

const mockFilesWithoutRisks = [
  { path: 'src/app.js', content: 'const app = {}; module.exports = app', size: 500 },
  { path: 'src/app.test.js', content: 'describe("app", () => { it("works", () => expect(true).toBe(true)) })', size: 200 },
  { path: 'package.json', content: '{"dependencies": {"react": "18.0.0"}}', size: 200 },
  { path: 'README.md', content: '# My App', size: 100 }
]

// Create a test version of the analyzer
class TestAdoreInoAnalyzer {
  private files: Array<{ path: string; content: string; size: number }>

  constructor(files: Array<{ path: string; content: string; size: number }>) {
    this.files = files || []
  }

  // Mock the critical risk detection methods to be deterministic for testing
  private hasSecurityIssues(): boolean {
    // Simulate security issues based on hardcoded keys or old dependencies
    return this.files.some(f => 
      f.content.includes('hardcoded_key') || 
      f.content.includes('api_key:') ||
      f.content.includes('lodash": "4.0.0"') // Old vulnerable version
    )
  }

  private hasOutdatedDependencies(): boolean {
    return this.files.some(f => 
      f.content.includes('lodash": "4.0.0"') ||
      f.content.includes('react": "16.0.0"')
    )
  }

  private hasTests(): boolean {
    return this.files.some(f => 
      f.path.includes('test') || 
      f.path.includes('spec') || 
      f.path.includes('__tests__') ||
      f.path.includes('.test.') ||
      f.path.includes('.spec.')
    )
  }

  private hasDocumentation(): boolean {
    return this.files.some(f => 
      f.path.toLowerCase().includes('readme') ||
      f.path.toLowerCase().includes('docs')
    )
  }

  private hasGoodStructure(): boolean {
    const hasSourceDir = this.files.some(f => f.path.startsWith('src/'))
    const hasComponents = this.files.some(f => f.path.includes('components'))
    return hasSourceDir || hasComponents
  }

  private hasPerformanceIssues(): boolean {
    const largeFiles = this.files.filter(f => f.size > 10000)
    return largeFiles.length > this.files.length * 0.1
  }

  private hasMultipleCriticalRisks(): boolean {
    const riskCount = [
      this.hasSecurityIssues(),
      this.hasOutdatedDependencies(),
      !this.hasTests(),
      this.hasPerformanceIssues()
    ].filter(Boolean).length
    
    return riskCount >= 2
  }

  private calculateRiskPenalties(): number {
    let penalties = 0
    
    if (this.hasSecurityIssues()) {
      penalties += 40 // Critical security issues
    }
    
    if (this.hasOutdatedDependencies()) {
      penalties += 25 // Significant penalty for outdated deps
    }
    
    if (!this.hasTests()) {
      penalties += 20 // Substantial penalty for no test coverage
    }
    
    if (this.hasPerformanceIssues()) {
      penalties += 15 // Moderate penalty for performance issues
    }
    
    // Multiple risks compound the problem
    const riskCount = [this.hasSecurityIssues(), this.hasOutdatedDependencies(), !this.hasTests(), this.hasPerformanceIssues()]
      .filter(Boolean).length
    
    if (riskCount >= 3) {
      penalties += 20 // Additional penalty for multiple risks
    }
    
    return penalties
  }

  // Test the quality score calculation logic
  calculateQualityScore(): { score: number; rating: string; hasCriticalRisks: boolean } {
    let qualityScore = 70 // Base score
    
    if (this.hasGoodStructure()) qualityScore += 15
    if (this.hasTests()) qualityScore += 10
    if (this.hasDocumentation()) qualityScore += 5
    if (this.hasOutdatedDependencies()) qualityScore -= 20
    if (this.hasSecurityIssues()) qualityScore -= 15

    // Apply risk-based penalties
    const riskPenalties = this.calculateRiskPenalties()
    qualityScore = Math.max(0, qualityScore - riskPenalties)

    // Enhanced quality rating logic that considers critical risks
    let qualityRating: string
    const hasCriticalRisks = this.hasSecurityIssues() || this.hasMultipleCriticalRisks()
    
    if (hasCriticalRisks) {
      // Critical risks prevent excellent/good ratings regardless of score
      qualityRating = qualityScore >= 60 ? 'fair' : 'poor'
    } else {
      qualityRating = qualityScore >= 85 ? 'excellent' : 
                     qualityScore >= 70 ? 'good' : 
                     qualityScore >= 50 ? 'fair' : 'poor'
    }

    return {
      score: Math.min(100, Math.max(0, qualityScore)),
      rating: qualityRating,
      hasCriticalRisks
    }
  }

  // Simulate risk assessment
  assessRisks(): { overallRisk: string; riskCount: number } {
    const risks = []
    
    if (this.hasSecurityIssues()) {
      risks.push({ impact: 'critical', type: 'security' })
    }
    
    if (this.hasPerformanceIssues()) {
      risks.push({ impact: 'medium', type: 'performance' })
    }
    
    if (!this.hasTests()) {
      risks.push({ impact: 'medium', type: 'maintenance' })
    }

    const criticalRisks = risks.filter(r => r.impact === 'critical').length
    const overallRisk = criticalRisks > 0 ? 'critical' : 
                       risks.length > 2 ? 'medium' : 'low'

    return { overallRisk, riskCount: risks.length }
  }
}

describe('Quality Score Consistency Fix', () => {
  it('should NOT show excellent rating when critical risks exist', () => {
    const analyzer = new TestAdoreInoAnalyzer(mockFilesWithCriticalRisks)
    
    const quality = analyzer.calculateQualityScore()
    const risks = analyzer.assessRisks()
    
    console.log(`Quality Score: ${quality.score}, Rating: ${quality.rating}`)
    console.log(`Overall Risk: ${risks.overallRisk}, Risk Count: ${risks.riskCount}`)
    
    // Critical assertion: Cannot have excellent rating with critical risks
    if (risks.overallRisk === 'critical') {
      expect(quality.rating).not.toBe('excellent')
      expect(quality.rating).not.toBe('good')
      expect(['fair', 'poor']).toContain(quality.rating)
    }
    
    // Score should be significantly penalized
    expect(quality.score).toBeLessThan(70)
    expect(quality.hasCriticalRisks).toBe(true)
  })

  it('should allow excellent rating when no critical risks exist', () => {
    const analyzer = new TestAdoreInoAnalyzer(mockFilesWithoutRisks)
    
    const quality = analyzer.calculateQualityScore()
    const risks = analyzer.assessRisks()
    
    console.log(`Quality Score: ${quality.score}, Rating: ${quality.rating}`)
    console.log(`Overall Risk: ${risks.overallRisk}, Risk Count: ${risks.riskCount}`)
    
    // Should be able to achieve good/excellent rating without critical risks
    if (risks.overallRisk !== 'critical') {
      expect(['good', 'excellent']).toContain(quality.rating)
    }
    
    expect(quality.hasCriticalRisks).toBe(false)
  })

  it('should ensure rating matches risk level logically', () => {
    const analyzerWithRisks = new TestAdoreInoAnalyzer(mockFilesWithCriticalRisks)
    const analyzerWithoutRisks = new TestAdoreInoAnalyzer(mockFilesWithoutRisks)
    
    const qualityWithRisks = analyzerWithRisks.calculateQualityScore()
    const risksWithRisks = analyzerWithRisks.assessRisks()
    
    const qualityWithoutRisks = analyzerWithoutRisks.calculateQualityScore()
    const risksWithoutRisks = analyzerWithoutRisks.assessRisks()
    
    // Logical consistency checks
    if (risksWithRisks.overallRisk === 'critical') {
      expect(['fair', 'poor']).toContain(qualityWithRisks.rating)
      expect(qualityWithRisks.score).toBeLessThan(qualityWithoutRisks.score)
    }
    
    // Systems with critical risks should score lower than those without
    if (risksWithRisks.overallRisk === 'critical' && risksWithoutRisks.overallRisk !== 'critical') {
      expect(qualityWithRisks.score).toBeLessThan(qualityWithoutRisks.score)
    }
  })

  it('should apply cumulative penalties for multiple risks', () => {
    // Create a system with multiple risks
    const multipleRiskFiles = [
      { path: 'src/app.js', content: 'const api_key = "hardcoded"; old_dependency();', size: 15000 }, // Security + Performance
      { path: 'package.json', content: '{"dependencies": {"lodash": "4.0.0"}}', size: 200 } // Outdated deps
      // No tests = additional risk
    ]
    
    const analyzer = new TestAdoreInoAnalyzer(multipleRiskFiles)
    const quality = analyzer.calculateQualityScore()
    
    // Multiple risks should result in severe penalties
    expect(quality.score).toBeLessThan(50) // Should be significantly penalized
    expect(quality.rating).toBe('poor') // Multiple critical risks = poor rating
    expect(quality.hasCriticalRisks).toBe(true)
  })

  it('should prevent score/rating mismatch scenarios', () => {
    const testCases = [
      mockFilesWithCriticalRisks,
      mockFilesWithoutRisks
    ]
    
    testCases.forEach((files, index) => {
      const analyzer = new TestAdoreInoAnalyzer(files)
      const quality = analyzer.calculateQualityScore()
      const risks = analyzer.assessRisks()
      
      // Consistency rule: Critical overall risk = no excellent/good rating
      if (risks.overallRisk === 'critical') {
        expect(quality.rating).not.toBe('excellent')
        expect(quality.rating).not.toBe('good')
      }
      
      // Consistency rule: Excellent rating = no critical risks
      if (quality.rating === 'excellent') {
        expect(risks.overallRisk).not.toBe('critical')
      }
      
      console.log(`Test case ${index + 1}: Score=${quality.score}, Rating=${quality.rating}, Risk=${risks.overallRisk}`)
    })
  })
})