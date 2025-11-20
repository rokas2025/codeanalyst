// Mozilla Observatory Service - Security Analysis
import axios from 'axios'
import { logger } from '../utils/logger.js'

export class MozillaObservatoryService {
  constructor() {
    this.baseUrl = 'https://http-observatory.security.mozilla.org/api/v1'
    this.timeout = 60000 // 60 seconds
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 seconds
  }

  /**
   * Analyze website security using Mozilla Observatory
   * @param {string} url - Website URL to analyze
   * @returns {Object} - Security analysis results
   */
  async analyzeWebsiteSecurity(url) {
    try {
      // Extract hostname from URL
      const hostname = this.extractHostname(url)
      
      if (!hostname) {
        throw new Error('Invalid URL provided')
      }

      logger.info(`🔒 Starting Mozilla Observatory scan for: ${hostname}`)

      // Step 1: Initiate scan
      const scanId = await this.initiateScan(hostname)
      
      // Step 2: Wait for scan completion and get results
      const results = await this.getScanResults(hostname, scanId)
      
      // Step 3: Parse and format results
      const formatted = this.formatResults(results, hostname)
      
      logger.info(`✅ Mozilla Observatory scan complete: ${formatted.grade} (${formatted.score}/100)`)
      
      return formatted

    } catch (error) {
      logger.error('Mozilla Observatory analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Extract hostname from URL
   */
  extractHostname(url) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      logger.warn(`Failed to extract hostname from ${url}:`, error.message)
      return null
    }
  }

  /**
   * Initiate security scan
   */
  async initiateScan(hostname) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/analyze`,
        { 
          host: hostname,
          rescan: false, // Use cached results if available
          hidden: true // Don't show in public results
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      )

      const scanId = response.data.scan_id
      logger.info(`📋 Scan initiated: ${scanId}`)
      
      return scanId

    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      throw error
    }
  }

  /**
   * Get scan results (with retries for pending scans)
   */
  async getScanResults(hostname, scanId) {
    let retries = 0
    
    while (retries < this.maxRetries) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/analyze`,
          {
            params: { host: hostname },
            timeout: this.timeout
          }
        )

        const state = response.data.state
        
        if (state === 'FINISHED') {
          logger.info('✅ Scan completed successfully')
          return response.data
        } else if (state === 'FAILED') {
          throw new Error('Security scan failed')
        } else if (state === 'PENDING' || state === 'RUNNING') {
          logger.info(`⏳ Scan in progress (${state}), waiting...`)
          retries++
          
          if (retries < this.maxRetries) {
            await this.sleep(this.retryDelay)
          } else {
            // Return partial results if available
            logger.warn('Scan still pending after max retries, returning partial results')
            return response.data
          }
        } else {
          logger.info(`Scan state: ${state}`)
          return response.data
        }

      } catch (error) {
        if (retries >= this.maxRetries - 1) {
          throw error
        }
        retries++
        await this.sleep(this.retryDelay)
      }
    }

    throw new Error('Scan timed out')
  }

  /**
   * Format results for our system
   */
  formatResults(data, hostname) {
    const result = {
      hostname: hostname,
      grade: data.grade || 'N/A',
      score: data.score || 0,
      state: data.state,
      scanDate: new Date().toISOString(),
      
      // Summary
      summary: {
        testsTotal: data.tests_quantity || 0,
        testsPassed: data.tests_passed || 0,
        testsFailed: data.tests_failed || 0,
        testsMissing: 0
      },
      
      // Security headers
      headers: {},
      
      // Recommendations
      recommendations: [],
      
      // Raw data for detailed analysis
      rawData: data
    }

    // Calculate missing tests
    result.summary.testsMissing = 
      result.summary.testsTotal - result.summary.testsPassed - result.summary.testsFailed

    // Parse test results into headers and recommendations
    if (data.tests) {
      result.headers = this.parseHeaders(data.tests)
      result.recommendations = this.generateRecommendations(data.tests, data.grade)
    }

    return result
  }

  /**
   * Parse security header tests
   */
  parseHeaders(tests) {
    const headers = {}
    
    const headerTests = {
      'content-security-policy': 'Content-Security-Policy',
      'strict-transport-security': 'HTTP Strict Transport Security (HSTS)',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
      'x-xss-protection': 'X-XSS-Protection',
      'referrer-policy': 'Referrer-Policy',
      'permissions-policy': 'Permissions-Policy'
    }

    for (const [testKey, headerName] of Object.entries(headerTests)) {
      const test = tests[testKey]
      if (test) {
        headers[headerName] = {
          present: test.pass || false,
          result: test.result || 'not-implemented',
          scoreModifier: test.score_modifier || 0,
          expectation: test.expectation || 'unknown'
        }
      }
    }

    return headers
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(tests, grade) {
    const recommendations = []
    
    // Priority recommendations based on grade
    if (grade === 'F') {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        message: 'Critical: Website has major security issues. Immediate action required.',
        impact: 'high'
      })
    } else if (grade === 'D' || grade === 'E') {
      recommendations.push({
        priority: 'high',
        category: 'security',
        message: 'Warning: Website security needs significant improvement.',
        impact: 'high'
      })
    }

    // Check specific tests
    if (tests) {
      // CSP
      if (tests['content-security-policy'] && !tests['content-security-policy'].pass) {
        recommendations.push({
          priority: 'high',
          category: 'headers',
          message: 'Implement Content-Security-Policy (CSP) header to prevent XSS attacks.',
          header: 'Content-Security-Policy',
          impact: 'high'
        })
      }

      // HSTS
      if (tests['strict-transport-security'] && !tests['strict-transport-security'].pass) {
        recommendations.push({
          priority: 'high',
          category: 'headers',
          message: 'Enable HTTP Strict Transport Security (HSTS) to enforce HTTPS.',
          header: 'Strict-Transport-Security',
          impact: 'high'
        })
      }

      // X-Frame-Options
      if (tests['x-frame-options'] && !tests['x-frame-options'].pass) {
        recommendations.push({
          priority: 'medium',
          category: 'headers',
          message: 'Add X-Frame-Options header to prevent clickjacking attacks.',
          header: 'X-Frame-Options',
          impact: 'medium'
        })
      }

      // X-Content-Type-Options
      if (tests['x-content-type-options'] && !tests['x-content-type-options'].pass) {
        recommendations.push({
          priority: 'medium',
          category: 'headers',
          message: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing.',
          header: 'X-Content-Type-Options',
          impact: 'medium'
        })
      }

      // Referrer-Policy
      if (tests['referrer-policy'] && !tests['referrer-policy'].pass) {
        recommendations.push({
          priority: 'low',
          category: 'headers',
          message: 'Implement Referrer-Policy to control referrer information.',
          header: 'Referrer-Policy',
          impact: 'low'
        })
      }

      // Cookie security
      if (tests['cookies'] && !tests['cookies'].pass) {
        recommendations.push({
          priority: 'medium',
          category: 'cookies',
          message: 'Secure cookies with HttpOnly and Secure flags.',
          impact: 'medium'
        })
      }

      // HTTPS redirect
      if (tests['redirection'] && !tests['redirection'].pass) {
        recommendations.push({
          priority: 'high',
          category: 'https',
          message: 'Redirect all HTTP traffic to HTTPS.',
          impact: 'high'
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
      hostname: null,
      grade: 'N/A',
      score: 0,
      state: 'ERROR',
      error: errorMessage,
      scanDate: new Date().toISOString(),
      summary: {
        testsTotal: 0,
        testsPassed: 0,
        testsFailed: 0,
        testsMissing: 0
      },
      headers: {},
      recommendations: [
        {
          priority: 'high',
          category: 'scan',
          message: `Security scan failed: ${errorMessage}`,
          impact: 'unknown'
        }
      ]
    }
  }

  /**
   * Sleep helper for retries
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get security grade color/severity
   */
  getGradeSeverity(grade) {
    const severityMap = {
      'A+': 'excellent',
      'A': 'good',
      'A-': 'good',
      'B+': 'fair',
      'B': 'fair',
      'B-': 'fair',
      'C+': 'warning',
      'C': 'warning',
      'C-': 'warning',
      'D+': 'poor',
      'D': 'poor',
      'D-': 'poor',
      'E': 'critical',
      'F': 'critical'
    }
    
    return severityMap[grade] || 'unknown'
  }

  /**
   * Alias for backward compatibility with existing route
   */
  async analyzeSecurity(url) {
    return this.analyzeWebsiteSecurity(url)
  }
}

export default MozillaObservatoryService
