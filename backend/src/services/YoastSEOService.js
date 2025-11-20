// Yoast SEO Service - Content SEO Analysis
import pkg from 'yoastseo'
const { Paper, ContentAssessor, SEOAssessor } = pkg
import { logger } from '../utils/logger.js'

export class YoastSEOService {
  constructor() {
    this.contentAssessor = new ContentAssessor()
    this.seoAssessor = new SEOAssessor()
  }

  /**
   * Analyze content for SEO
   * @param {string} content - HTML or text content to analyze
   * @param {Object} options - Analysis options
   * @param {string} options.keyword - Target keyword (optional)
   * @param {string} options.title - Page title (optional)
   * @param {string} options.description - Meta description (optional)
   * @param {string} options.url - Page URL (optional)
   * @returns {Object} - SEO analysis results
   */
  async analyzeSEO(content, options = {}) {
    try {
      logger.info('🎯 Starting Yoast SEO analysis')

      const {
        keyword = '',
        title = '',
        description = '',
        url = '',
        locale = 'en_US'
      } = options

      // Create Paper object (Yoast's content wrapper)
      const paper = new Paper(content, {
        keyword: keyword,
        title: title,
        description: description,
        url: url,
        locale: locale,
        permalink: url
      })

      // Run assessments
      const contentResults = this.assessContent(paper)
      const seoResults = keyword ? this.assessSEO(paper) : null

      // Calculate overall scores
      const overallScore = this.calculateOverallScore(contentResults, seoResults)

      // Extract readability metrics
      const readability = this.extractReadabilityMetrics(contentResults)

      // Extract SEO metrics
      const seo = seoResults ? this.extractSEOMetrics(seoResults, keyword) : null

      // Generate recommendations
      const recommendations = this.generateRecommendations(contentResults, seoResults)

      const result = {
        overallScore: overallScore,
        readabilityScore: contentResults.score || 0,
        seoScore: seoResults?.score || 0,
        
        readability: readability,
        seo: seo,
        
        recommendations: recommendations,
        
        // Metadata
        hasKeyword: !!keyword,
        contentLength: content.length,
        wordCount: this.countWords(content),
        analyzedAt: new Date().toISOString()
      }

      logger.info(`✅ Yoast SEO analysis complete: Score ${overallScore}/100`)

      return result

    } catch (error) {
      logger.error('Yoast SEO analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Assess content readability
   */
  assessContent(paper) {
    try {
      this.contentAssessor.assess(paper)
      const results = this.contentAssessor.getValidResults()
      const score = this.contentAssessor.calculateOverallScore()

      return {
        score: score,
        results: results
      }
    } catch (error) {
      logger.warn('Content assessment failed:', error.message)
      return { score: 0, results: [] }
    }
  }

  /**
   * Assess SEO optimization
   */
  assessSEO(paper) {
    try {
      this.seoAssessor.assess(paper)
      const results = this.seoAssessor.getValidResults()
      const score = this.seoAssessor.calculateOverallScore()

      return {
        score: score,
        results: results
      }
    } catch (error) {
      logger.warn('SEO assessment failed:', error.message)
      return { score: 0, results: [] }
    }
  }

  /**
   * Calculate overall score (0-100)
   */
  calculateOverallScore(contentResults, seoResults) {
    if (!seoResults) {
      // Only readability score available
      return contentResults.score || 0
    }

    // Average of readability and SEO scores
    const readabilityScore = contentResults.score || 0
    const seoScore = seoResults.score || 0
    
    return Math.round((readabilityScore + seoScore) / 2)
  }

  /**
   * Extract readability metrics from assessment results
   */
  extractReadabilityMetrics(contentResults) {
    const metrics = {
      score: contentResults.score || 0,
      grade: this.getScoreGrade(contentResults.score || 0),
      issues: {
        good: [],
        improvements: [],
        problems: []
      }
    }

    if (!contentResults.results || contentResults.results.length === 0) {
      return metrics
    }

    // Categorize results by score
    contentResults.results.forEach(result => {
      const item = {
        identifier: result.getIdentifier(),
        text: result.getText(),
        score: result.getScore()
      }

      if (result.getScore() >= 7) {
        metrics.issues.good.push(item)
      } else if (result.getScore() >= 4) {
        metrics.issues.improvements.push(item)
      } else {
        metrics.issues.problems.push(item)
      }
    })

    return metrics
  }

  /**
   * Extract SEO metrics from assessment results
   */
  extractSEOMetrics(seoResults, keyword) {
    const metrics = {
      score: seoResults.score || 0,
      grade: this.getScoreGrade(seoResults.score || 0),
      keyword: keyword,
      issues: {
        good: [],
        improvements: [],
        problems: []
      },
      keywordDensity: 0,
      keywordInTitle: false,
      keywordInDescription: false,
      keywordInUrl: false
    }

    if (!seoResults.results || seoResults.results.length === 0) {
      return metrics
    }

    // Categorize results by score
    seoResults.results.forEach(result => {
      const identifier = result.getIdentifier()
      const item = {
        identifier: identifier,
        text: result.getText(),
        score: result.getScore()
      }

      // Extract specific metrics
      if (identifier === 'keywordDensity') {
        // Parse keyword density from text if available
        const densityMatch = result.getText().match(/(\d+\.?\d*)%/)
        if (densityMatch) {
          metrics.keywordDensity = parseFloat(densityMatch[1])
        }
      }

      if (identifier === 'introductionKeyword' || identifier === 'keyphraseInSEOTitle') {
        metrics.keywordInTitle = result.getScore() >= 6
      }

      if (identifier === 'metaDescriptionKeyword') {
        metrics.keywordInDescription = result.getScore() >= 6
      }

      if (identifier === 'slugKeyword' || identifier === 'keyphraseInSlug') {
        metrics.keywordInUrl = result.getScore() >= 6
      }

      // Categorize by score
      if (result.getScore() >= 7) {
        metrics.issues.good.push(item)
      } else if (result.getScore() >= 4) {
        metrics.issues.improvements.push(item)
      } else {
        metrics.issues.problems.push(item)
      }
    })

    return metrics
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(contentResults, seoResults) {
    const recommendations = []

    // Content/Readability recommendations
    if (contentResults.results) {
      contentResults.results.forEach(result => {
        if (result.getScore() < 4) {
          recommendations.push({
            priority: 'high',
            category: 'readability',
            issue: result.getIdentifier(),
            message: result.getText(),
            score: result.getScore()
          })
        } else if (result.getScore() < 7) {
          recommendations.push({
            priority: 'medium',
            category: 'readability',
            issue: result.getIdentifier(),
            message: result.getText(),
            score: result.getScore()
          })
        }
      })
    }

    // SEO recommendations
    if (seoResults && seoResults.results) {
      seoResults.results.forEach(result => {
        if (result.getScore() < 4) {
          recommendations.push({
            priority: 'high',
            category: 'seo',
            issue: result.getIdentifier(),
            message: result.getText(),
            score: result.getScore()
          })
        } else if (result.getScore() < 7) {
          recommendations.push({
            priority: 'medium',
            category: 'seo',
            issue: result.getIdentifier(),
            message: result.getText(),
            score: result.getScore()
          })
        }
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    // Limit to top 20 recommendations
    return recommendations.slice(0, 20)
  }

  /**
   * Count words in content
   */
  countWords(content) {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ')
    // Count words
    const words = text.trim().split(/\s+/)
    return words.filter(word => word.length > 0).length
  }

  /**
   * Get score grade (A-F)
   */
  getScoreGrade(score) {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Get error result structure
   */
  getErrorResult(errorMessage) {
    return {
      overallScore: 0,
      readabilityScore: 0,
      seoScore: 0,
      readability: {
        score: 0,
        grade: 'F',
        issues: { good: [], improvements: [], problems: [] }
      },
      seo: null,
      recommendations: [
        {
          priority: 'high',
          category: 'error',
          message: `SEO analysis failed: ${errorMessage}`
        }
      ],
      hasKeyword: false,
      contentLength: 0,
      wordCount: 0,
      analyzedAt: new Date().toISOString(),
      error: errorMessage
    }
  }

  /**
   * Analyze multiple pages/content items
   * @param {Array} contents - Array of content objects with { content, title, description, keyword, url }
   * @returns {Array} - Array of SEO analysis results
   */
  async analyzeBatch(contents) {
    const results = []

    for (const item of contents) {
      try {
        const result = await this.analyzeSEO(item.content, {
          keyword: item.keyword,
          title: item.title,
          description: item.description,
          url: item.url
        })

        results.push({
          ...result,
          sourceUrl: item.url,
          sourceTitle: item.title
        })
      } catch (error) {
        logger.warn(`Failed to analyze content: ${item.url}`, error)
        results.push(this.getErrorResult(error.message))
      }
    }

    return results
  }
}

export default YoastSEOService
