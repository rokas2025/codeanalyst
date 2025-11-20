// Yoast SEO Service - Content SEO Analysis (Simplified)
import { logger } from '../utils/logger.js'

export class YoastSEOService {
  constructor() {
    // Simplified version without Yoast internals (no Researcher needed)
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
        url = ''
      } = options

      const wordCount = this.countWords(content)
      const hasKeyword = keyword && content.toLowerCase().includes(keyword.toLowerCase())
      
      // Calculate basic SEO score
      let seoScore = 50 // Base score
      
      if (hasKeyword) seoScore += 20
      if (title && title.toLowerCase().includes(keyword.toLowerCase())) seoScore += 15
      if (description && description.toLowerCase().includes(keyword.toLowerCase())) seoScore += 15
      if (wordCount >= 300) seoScore += 10
      
      const result = {
        overallScore: Math.min(seoScore, 100),
        readabilityScore: wordCount >= 300 ? 75 : 50,
        seoScore: seoScore,
        
        readability: {
          score: wordCount >= 300 ? 75 : 50,
          grade: this.getScoreGrade(wordCount >= 300 ? 75 : 50),
          wordCount: wordCount,
          issues: {
            good: wordCount >= 300 ? [{ message: 'Content length is adequate' }] : [],
            improvements: wordCount < 300 ? [{ message: 'Content is too short, aim for 300+ words' }] : [],
            problems: []
          }
        },
        
        seo: keyword ? {
          score: seoScore,
          grade: this.getScoreGrade(seoScore),
          keyword: keyword,
          keywordInContent: hasKeyword,
          keywordInTitle: title ? title.toLowerCase().includes(keyword.toLowerCase()) : false,
          keywordInDescription: description ? description.toLowerCase().includes(keyword.toLowerCase()) : false,
          issues: {
            good: hasKeyword ? [{ message: 'Keyword found in content' }] : [],
            improvements: !hasKeyword ? [{ message: 'Add target keyword to content' }] : [],
            problems: []
          }
        } : null,
        
        recommendations: this.generateSimpleRecommendations(content, keyword, title, description, wordCount),
        
        // Metadata
        hasKeyword: !!keyword,
        contentLength: content.length,
        wordCount: wordCount,
        analyzedAt: new Date().toISOString()
      }

      logger.info(`✅ Yoast SEO analysis complete: Score ${result.overallScore}/100`)

      return result

    } catch (error) {
      logger.error('Yoast SEO analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Generate simple recommendations
   */
  generateSimpleRecommendations(content, keyword, title, description, wordCount) {
    const recommendations = []

    if (wordCount < 300) {
      recommendations.push({
        priority: 'high',
        category: 'readability',
        message: 'Content is too short. Aim for at least 300 words for better SEO.'
      })
    }

    if (keyword) {
      const contentLower = content.toLowerCase()
      const keywordLower = keyword.toLowerCase()

      if (!contentLower.includes(keywordLower)) {
        recommendations.push({
          priority: 'high',
          category: 'seo',
          message: `Target keyword "${keyword}" not found in content. Include it naturally.`
        })
      }

      if (title && !title.toLowerCase().includes(keywordLower)) {
        recommendations.push({
          priority: 'medium',
          category: 'seo',
          message: `Consider adding "${keyword}" to the title.`
        })
      }

      if (description && !description.toLowerCase().includes(keywordLower)) {
        recommendations.push({
          priority: 'medium',
          category: 'seo',
          message: `Consider adding "${keyword}" to the meta description.`
        })
      }
    }

    if (!title || title.length < 30) {
      recommendations.push({
        priority: 'high',
        category: 'seo',
        message: 'Title is too short. Aim for 50-60 characters.'
      })
    }

    if (!description || description.length < 120) {
      recommendations.push({
        priority: 'medium',
        category: 'seo',
        message: 'Meta description is too short. Aim for 150-160 characters.'
      })
    }

    return recommendations.slice(0, 10)
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
