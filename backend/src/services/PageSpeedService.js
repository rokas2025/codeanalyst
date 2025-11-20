// Google PageSpeed Insights Service - Performance Analysis
import axios from 'axios'
import { logger } from '../utils/logger.js'

export class PageSpeedService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
    this.baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    this.timeout = 60000 // 60 seconds
  }

  /**
   * Analyze website performance using Google PageSpeed Insights
   * @param {string} url - Website URL to analyze
   * @param {Object} options - Analysis options
   * @param {string} options.strategy - 'mobile' or 'desktop' (default: both)
   * @param {Array} options.categories - Categories to analyze (performance, accessibility, best-practices, seo)
   * @returns {Object} - Performance analysis results
   */
  async analyzePerformance(url, options = {}) {
    try {
      if (!this.apiKey) {
        logger.warn('Google PageSpeed API key not configured')
        return this.getErrorResult('API key not configured')
      }

      logger.info(`🚀 Starting PageSpeed analysis for: ${url}`)

      const strategies = options.strategy ? [options.strategy] : ['mobile', 'desktop']
      const results = {}

      // Analyze for each strategy
      for (const strategy of strategies) {
        try {
          const result = await this.runPageSpeedTest(url, strategy, options.categories)
          results[strategy] = result
        } catch (error) {
          logger.warn(`PageSpeed ${strategy} analysis failed:`, error.message)
          results[strategy] = this.getErrorResult(`${strategy} analysis failed: ${error.message}`)
        }
      }

      // Format combined results
      const formatted = this.formatResults(results, url)

      logger.info(`✅ PageSpeed analysis complete: Performance ${formatted.scores.performance}/100`)

      return formatted

    } catch (error) {
      logger.error('PageSpeed analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Run PageSpeed test for a single strategy
   */
  async runPageSpeedTest(url, strategy = 'mobile', categories = null) {
    try {
      const params = {
        url: url,
        key: this.apiKey,
        strategy: strategy
      }

      // Add categories if specified
      if (categories && Array.isArray(categories)) {
        params.category = categories
      }

      logger.info(`📊 Running PageSpeed test: ${strategy}`)

      const response = await axios.get(this.baseUrl, {
        params: params,
        timeout: this.timeout
      })

      return response.data

    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid URL or request parameters')
      }
      throw error
    }
  }

  /**
   * Format results for our system
   */
  formatResults(results, url) {
    const formatted = {
      url: url,
      analyzedAt: new Date().toISOString(),
      
      // Scores (0-100)
      scores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0
      },
      
      // Core Web Vitals
      coreWebVitals: {
        lcp: null, // Largest Contentful Paint
        fid: null, // First Input Delay (deprecated, now INP)
        cls: null, // Cumulative Layout Shift
        fcp: null, // First Contentful Paint
        tti: null, // Time to Interactive
        tbt: null, // Total Blocking Time
        si: null   // Speed Index
      },
      
      // Mobile and Desktop results
      mobile: null,
      desktop: null,
      
      // Opportunities and diagnostics
      opportunities: [],
      diagnostics: [],
      
      // Recommendations
      recommendations: []
    }

    // Process mobile results
    if (results.mobile && !results.mobile.error) {
      formatted.mobile = this.extractStrategyData(results.mobile)
      this.mergeScores(formatted.scores, formatted.mobile.scores, 0.6) // Weight mobile 60%
      this.mergeCoreWebVitals(formatted.coreWebVitals, formatted.mobile.coreWebVitals)
      formatted.opportunities.push(...(formatted.mobile.opportunities || []))
      formatted.diagnostics.push(...(formatted.mobile.diagnostics || []))
    }

    // Process desktop results
    if (results.desktop && !results.desktop.error) {
      formatted.desktop = this.extractStrategyData(results.desktop)
      const weight = formatted.mobile ? 0.4 : 1.0 // Weight desktop 40% if mobile exists, else 100%
      this.mergeScores(formatted.scores, formatted.desktop.scores, weight)
      if (!formatted.mobile) {
        this.mergeCoreWebVitals(formatted.coreWebVitals, formatted.desktop.coreWebVitals)
      }
    }

    // Round scores
    Object.keys(formatted.scores).forEach(key => {
      formatted.scores[key] = Math.round(formatted.scores[key])
    })

    // Generate recommendations
    formatted.recommendations = this.generateRecommendations(formatted)

    return formatted
  }

  /**
   * Extract data from a single strategy result
   */
  extractStrategyData(data) {
    const lighthouse = data.lighthouseResult
    const categories = lighthouse.categories

    const strategyData = {
      scores: {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100)
      },
      coreWebVitals: {},
      opportunities: [],
      diagnostics: [],
      loadingExperience: data.loadingExperience
    }

    // Extract Core Web Vitals from audits
    const audits = lighthouse.audits
    
    if (audits['largest-contentful-paint']) {
      strategyData.coreWebVitals.lcp = {
        value: audits['largest-contentful-paint'].numericValue,
        displayValue: audits['largest-contentful-paint'].displayValue,
        score: audits['largest-contentful-paint'].score
      }
    }

    if (audits['cumulative-layout-shift']) {
      strategyData.coreWebVitals.cls = {
        value: audits['cumulative-layout-shift'].numericValue,
        displayValue: audits['cumulative-layout-shift'].displayValue,
        score: audits['cumulative-layout-shift'].score
      }
    }

    if (audits['first-contentful-paint']) {
      strategyData.coreWebVitals.fcp = {
        value: audits['first-contentful-paint'].numericValue,
        displayValue: audits['first-contentful-paint'].displayValue,
        score: audits['first-contentful-paint'].score
      }
    }

    if (audits['interactive']) {
      strategyData.coreWebVitals.tti = {
        value: audits['interactive'].numericValue,
        displayValue: audits['interactive'].displayValue,
        score: audits['interactive'].score
      }
    }

    if (audits['total-blocking-time']) {
      strategyData.coreWebVitals.tbt = {
        value: audits['total-blocking-time'].numericValue,
        displayValue: audits['total-blocking-time'].displayValue,
        score: audits['total-blocking-time'].score
      }
    }

    if (audits['speed-index']) {
      strategyData.coreWebVitals.si = {
        value: audits['speed-index'].numericValue,
        displayValue: audits['speed-index'].displayValue,
        score: audits['speed-index'].score
      }
    }

    // Extract opportunities (performance improvements)
    Object.entries(audits).forEach(([id, audit]) => {
      if (audit.details?.type === 'opportunity' && audit.score < 1) {
        strategyData.opportunities.push({
          id: id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          numericValue: audit.numericValue
        })
      }
    })

    // Extract diagnostics
    Object.entries(audits).forEach(([id, audit]) => {
      if (audit.details?.type === 'debugdata' || (audit.score !== null && audit.score < 1 && audit.details)) {
        strategyData.diagnostics.push({
          id: id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue
        })
      }
    })

    // Limit opportunities and diagnostics
    strategyData.opportunities = strategyData.opportunities.slice(0, 10)
    strategyData.diagnostics = strategyData.diagnostics.slice(0, 10)

    return strategyData
  }

  /**
   * Merge scores with weights
   */
  mergeScores(target, source, weight) {
    Object.keys(source).forEach(key => {
      if (target[key] === 0) {
        target[key] = source[key] * weight
      } else {
        target[key] += source[key] * weight
      }
    })
  }

  /**
   * Merge Core Web Vitals (prefer mobile values)
   */
  mergeCoreWebVitals(target, source) {
    Object.keys(source).forEach(key => {
      if (!target[key] && source[key]) {
        target[key] = source[key]
      }
    })
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(results) {
    const recommendations = []

    // Performance recommendations
    if (results.scores.performance < 50) {
      recommendations.push({
        priority: 'critical',
        category: 'performance',
        message: 'Critical: Website performance is very poor. Immediate optimization required.',
        score: results.scores.performance
      })
    } else if (results.scores.performance < 70) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        message: 'Warning: Website performance needs improvement.',
        score: results.scores.performance
      })
    }

    // Core Web Vitals recommendations
    if (results.coreWebVitals.lcp?.score < 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'core-web-vitals',
        message: 'Largest Contentful Paint (LCP) is too slow. Optimize main content loading.',
        metric: 'LCP',
        value: results.coreWebVitals.lcp.displayValue
      })
    }

    if (results.coreWebVitals.cls?.score < 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'core-web-vitals',
        message: 'Cumulative Layout Shift (CLS) is too high. Fix layout shifts.',
        metric: 'CLS',
        value: results.coreWebVitals.cls.displayValue
      })
    }

    // Accessibility recommendations
    if (results.scores.accessibility < 70) {
      recommendations.push({
        priority: 'high',
        category: 'accessibility',
        message: 'Accessibility issues detected. Improve for all users.',
        score: results.scores.accessibility
      })
    }

    // SEO recommendations
    if (results.scores.seo < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'seo',
        message: 'SEO score can be improved. Check meta tags and mobile-friendliness.',
        score: results.scores.seo
      })
    }

    // Mobile vs Desktop gap
    if (results.mobile && results.desktop) {
      const gap = Math.abs(results.mobile.scores.performance - results.desktop.scores.performance)
      if (gap > 20) {
        recommendations.push({
          priority: 'medium',
          category: 'responsive',
          message: 'Large performance gap between mobile and desktop. Optimize mobile experience.',
          gap: gap
        })
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return recommendations
  }

  /**
   * Get error result structure
   */
  getErrorResult(errorMessage) {
    return {
      url: null,
      error: errorMessage,
      analyzedAt: new Date().toISOString(),
      scores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0
      },
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        tti: null,
        tbt: null,
        si: null
      },
      mobile: null,
      desktop: null,
      opportunities: [],
      diagnostics: [],
      recommendations: [
        {
          priority: 'high',
          category: 'error',
          message: `Performance analysis failed: ${errorMessage}`
        }
      ]
    }
  }
}

export default PageSpeedService
