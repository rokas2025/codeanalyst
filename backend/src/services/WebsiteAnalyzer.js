// Website Analyzer Service - Real website content extraction and analysis
import puppeteer from 'puppeteer'
import lighthouse from 'lighthouse'
import pa11y from 'pa11y'
import axios from 'axios'
import { TechnologyDetector } from './TechnologyDetector.js'
import { SEOAnalyzer } from './SEOAnalyzer.js'
import { logger } from '../utils/logger.js'

export class WebsiteAnalyzer {
  constructor() {
    this.browser = null
    this.technologyDetector = new TechnologyDetector()
    this.seoAnalyzer = new SEOAnalyzer()
  }

  /**
   * Initialize the analyzer with browser and tools
   */
  async initialize() {
    try {
      // Try to launch Puppeteer browser with Railway-compatible configuration
      const puppeteerConfig = {
        headless: true, // Force headless in production
        timeout: 30000, // Reduce timeout for faster failures
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--run-all-compositor-stages-before-draw',
          '--disable-ipc-flooding-protection'
        ]
      }

      // Try different Chrome paths for Railway environment
      if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
        // Try common Chrome paths in Railway/Docker
        const chromePaths = [
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium'
        ]
        
        for (const path of chromePaths) {
          try {
            const fs = await import('fs')
            if (fs.existsSync(path)) {
              puppeteerConfig.executablePath = path
              logger.info(`🐳 Found Chrome at: ${path}`)
              break
            }
          } catch (e) {
            // Continue trying other paths
          }
        }
      }

      logger.info('🚀 Attempting to launch Puppeteer browser...', { 
        executablePath: puppeteerConfig.executablePath || 'bundled',
        headless: puppeteerConfig.headless,
        timeout: puppeteerConfig.timeout
      })

      try {
        this.browser = await puppeteer.launch(puppeteerConfig)
        this.browserAvailable = true
        logger.info('✅ Puppeteer browser launched successfully')
      } catch (browserError) {
        logger.warn('⚠️ Puppeteer browser failed to launch, continuing with limited analysis', browserError.message)
        this.browser = null
        this.browserAvailable = false
      }

      // Initialize Technology Detector (no async initialization needed)
      // this.technologyDetector is ready to use

      logger.info('🔧 Website analyzer initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize website analyzer:', error)
      // Don't throw error - allow analyzer to work without browser
      this.browser = null
      this.browserAvailable = false
      logger.warn('⚠️ Continuing with limited analysis capabilities')
    }
  }

  /**
   * Analyze a website comprehensively
   */
  async analyzeWebsite(url, options = {}) {
    const startTime = Date.now()
    
    try {
      logger.info(`🌐 Starting comprehensive analysis of ${url}`)

      // Validate URL
      const validatedUrl = this.validateAndNormalizeUrl(url)
      
             // First extract basic data to get HTML and headers
       const basicData = await this.extractBasicData(validatedUrl, options)
       const basicResult = this.getResultValue({ status: 'fulfilled', value: basicData })
       
             // Then run parallel analysis with the extracted data
      const [
        lighthouseData,
        accessibilityData,
        technologyData,
        securityData
      ] = await Promise.allSettled([
        this.runLighthouseAnalysis(validatedUrl, options),
        this.runAccessibilityAnalysis(validatedUrl, options),
        this.detectTechnologies(validatedUrl, basicResult.html, basicResult.headers, options),
        this.analyzeSecurityHeaders(validatedUrl, options)
      ])

      // Run comprehensive SEO analysis
      const lighthouseResult = this.getResultValue(lighthouseData)
      const comprehensiveSEO = await this.seoAnalyzer.analyzeComprehensiveSEO(
        validatedUrl, 
        basicResult, 
        lighthouseResult
      )

      // Combine all results
      const analysisResult = {
        url: validatedUrl,
        analyzedAt: new Date().toISOString(),
        analysisTime: Date.now() - startTime,
        
                 // Basic website data
         basic: basicResult,
        
        // Performance and SEO from Lighthouse
        lighthouse: lighthouseResult,
        
        // Comprehensive SEO Analysis (replaces basic lighthouse SEO)
        comprehensiveSEO: comprehensiveSEO,
        
        // Accessibility analysis
        accessibility: this.getResultValue(accessibilityData),
        
        // Technology stack detection
        technologies: this.getResultValue(technologyData),
        
        // Security analysis
        security: this.getResultValue(securityData),
        
        // Combined scores
        scores: this.calculateOverallScores({
          lighthouse: this.getResultValue(lighthouseData),
          accessibility: this.getResultValue(accessibilityData),
          security: this.getResultValue(securityData)
        })
      }

      logger.info(`✅ Website analysis completed in ${analysisResult.analysisTime}ms`)
      return analysisResult

    } catch (error) {
      logger.error(`❌ Website analysis failed for ${url}:`, error)
      throw new Error(`Website analysis failed: ${error.message}`)
    }
  }

  /**
   * Extract basic website data using Puppeteer or fallback to axios
   */
  async extractBasicData(url, options = {}) {
    // If browser is not available, use axios fallback
    if (!this.browserAvailable || !this.browser) {
      return await this.extractBasicDataFallback(url, options)
    }
    
    const page = await this.browser.newPage()
    
    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      )

      // Navigate to page with optimized timeout and loading strategy
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 60000 // Increased from 30s to 60s
      })
      
      // Wait for additional content but don't block on slow resources
      try {
        await page.waitForTimeout(3000) // Wait 3 seconds for initial dynamic content
        await page.waitForSelector('body', { timeout: 5000 }) // Ensure body is loaded
      } catch (additionalWaitError) {
        logger.warn(`Additional content wait timeout for ${url}, proceeding with analysis`)
        // Continue even if additional waits fail
      }

      // Handle cookie banners and overlays
      await this.handleCookieBanners(page)

      // Extract comprehensive page data
      const pageData = await page.evaluate(() => {
        return {
          // Basic metadata
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          lang: document.documentElement.lang || '',
          charset: document.characterSet,
          
          // Open Graph data
          ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
          ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
          ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
          ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
          
          // Twitter Card data
          twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || '',
          twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || '',
          twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content || '',
          
          // Structured data
          hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
          structuredDataCount: document.querySelectorAll('script[type="application/ld+json"]').length,
          
          // Page structure
          headingStructure: (() => {
            const headings = {}
            for (let i = 1; i <= 6; i++) {
              const elements = document.querySelectorAll(`h${i}`)
              headings[`h${i}`] = {
                count: elements.length,
                texts: Array.from(elements).map(el => el.textContent.trim()).slice(0, 5) // First 5 for analysis
              }
            }
            return headings
          })(),
          imageCount: document.querySelectorAll('img').length,
          linkCount: document.querySelectorAll('a').length,
          formCount: document.querySelectorAll('form').length,
          
          // Content analysis
          wordCount: document.body.innerText.split(/\s+/).length,
          paragraphCount: document.querySelectorAll('p').length,
          
          // External resources
          externalScripts: Array.from(document.querySelectorAll('script[src]'))
            .map(script => script.src)
            .filter(src => src && !src.startsWith(window.location.origin)),
          externalStyles: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.href)
            .filter(href => href && !href.startsWith(window.location.origin)),
          
          // Page metrics
          domElements: document.querySelectorAll('*').length,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      })

      // Get page HTML for further analysis
      const html = await page.content()
      const responseHeaders = response.headers()

      // Take screenshot if requested
      let screenshot = null
      if (options.includeScreenshots) {
        screenshot = await page.screenshot({
          type: 'png',
          fullPage: true,
          encoding: 'base64'
        })
      }

      return {
        ...pageData,
        html: html.substring(0, 50000), // Limit HTML size
        headers: responseHeaders,
        statusCode: response.status(),
        loadTime: response.timing?.responseEnd || 0,
        screenshot,
        finalUrl: page.url() // In case of redirects
      }

    } finally {
      await page.close()
    }
  }

  /**
   * Fallback method to extract basic data using axios when Puppeteer fails
   */
  async extractBasicDataFallback(url, options = {}) {
    try {
      logger.info(`🌐 Using axios fallback for basic data extraction: ${url}`)
      
      const response = await axios.get(url, {
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        }
      })

      const html = response.data
      const headers = response.headers

      // Basic HTML parsing without DOM access
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      const description = descriptionMatch ? descriptionMatch[1].trim() : ''

      // Count basic elements with regex
      const imgCount = (html.match(/<img[^>]*>/gi) || []).length
      const linkCount = (html.match(/<a[^>]*>/gi) || []).length
      const formCount = (html.match(/<form[^>]*>/gi) || []).length
      const paragraphCount = (html.match(/<p[^>]*>/gi) || []).length

      // Extract text content roughly
      const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const wordCount = textContent.split(/\s+/).length

      return {
        title,
        description,
        html: html.substring(0, 50000), // Limit HTML size
        headers,
        statusCode: response.status,
        loadTime: 0, // Not available with axios
        
        // Basic metrics
        imageCount: imgCount,
        linkCount: linkCount,
        formCount: formCount,
        wordCount: Math.min(wordCount, 50000), // Reasonable limit
        paragraphCount,
        
        // Page info
        finalUrl: response.request.res.responseUrl || url,
        
        // Meta information
        hasTitle: !!title,
        hasDescription: !!description,
        contentLength: html.length,
        
        // Note about limited analysis
        analysisMethod: 'axios-fallback',
        limitedAnalysis: true
      }

    } catch (error) {
      logger.error(`Failed axios fallback for ${url}:`, error)
      
      // Return minimal data structure to prevent complete failure
      return {
        title: '',
        description: '',
        html: '',
        headers: {},
        statusCode: 0,
        loadTime: 0,
        imageCount: 0,
        linkCount: 0,
        formCount: 0,
        wordCount: 0,
        paragraphCount: 0,
        finalUrl: url,
        hasTitle: false,
        hasDescription: false,
        contentLength: 0,
        analysisMethod: 'failed-fallback',
        limitedAnalysis: true,
        error: error.message
      }
    }
  }

  /**
   * Run Lighthouse performance analysis
   */
  async runLighthouseAnalysis(url, options = {}) {
    // If browser is not available, return fallback performance data
    if (!this.browserAvailable || !this.browser) {
      logger.warn('⚠️ Browser not available, returning fallback performance data')
      return this.getFallbackPerformanceData(url)
    }
    
    try {
      const port = new URL(this.browser.wsEndpoint()).port
      
      const { lhr } = await lighthouse(url, {
        port: port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility'],
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        // Add these settings for better performance analysis
        skipAudits: [],
        budgets: null,
        locale: 'en-US',
        blockedUrlPatterns: null,
        additionalTraceCategories: null,
        extraHeaders: null,
        precomputedLanternData: null,
        lanternDataOutputPath: null,
        budgetsPath: null,
        verbose: false,
        quiet: true
      })

      // Extract metrics first
      const metrics = {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue,
        firstInputDelay: lhr.audits['max-potential-fid']?.numericValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue,
        speedIndex: lhr.audits['speed-index']?.numericValue,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue,
        timeToInteractive: lhr.audits['interactive']?.numericValue,
        serverResponseTime: lhr.audits['server-response-time']?.numericValue
      }

      // Calculate fallback performance score if Lighthouse fails
      let performanceScore = lhr.categories.performance?.score ? Math.round(lhr.categories.performance.score * 100) : null
      
      if (performanceScore === null || performanceScore === 0) {
        // Calculate performance score based on Core Web Vitals
        performanceScore = this.calculatePerformanceScore(metrics)
        logger.warn('Lighthouse performance score was 0/null, calculated fallback score:', performanceScore)
      }

      return {
        performance: performanceScore,
        seo: Math.round((lhr.categories.seo?.score || 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
        
        // Key metrics
        metrics,
        
        // Opportunities for improvement
        opportunities: lhr.audits ? Object.keys(lhr.audits)
          .filter(key => lhr.audits[key].score !== null && lhr.audits[key].score < 0.9)
          .map(key => ({
            audit: key,
            title: lhr.audits[key].title,
            description: lhr.audits[key].description,
            score: lhr.audits[key].score,
            savings: lhr.audits[key].numericValue || 0,
            displayValue: lhr.audits[key].displayValue
          }))
          .slice(0, 15) : [],
          
        // Raw Lighthouse data for debugging
        rawLighthouseData: {
          fetchTime: lhr.fetchTime,
          requestedUrl: lhr.requestedUrl,
          finalUrl: lhr.finalUrl,
          lighthouseVersion: lhr.lighthouseVersion,
          userAgent: lhr.userAgent,
          environment: lhr.environment,
          configSettings: lhr.configSettings
        }
      }

    } catch (error) {
      logger.warn('Lighthouse analysis failed:', error.message)
      return {
        performance: 0,
        seo: 0,
        bestPractices: 0,
        metrics: {},
        opportunities: [],
        error: error.message
      }
    }
  }

  /**
   * Get fallback performance data when Lighthouse is not available
   */
  getFallbackPerformanceData(url) {
    logger.info(`📊 Generating fallback performance data for ${url}`)
    
    return {
      performance: 50, // Reasonable default
      seo: 60,
      accessibility: 50,
      bestPractices: 50,
      metrics: {
        firstContentfulPaint: 2000,
        largestContentfulPaint: 3000,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        speedIndex: 3000,
        totalBlockingTime: 200,
        timeToInteractive: 4000,
        serverResponseTime: 500
      },
      opportunities: [
        {
          id: 'lighthouse-unavailable',
          title: 'Limited Performance Analysis',
          description: 'Detailed performance metrics unavailable due to browser limitations in this environment.',
          score: 0.5,
          numericValue: 0,
          displayValue: 'Browser analysis limited'
        }
      ],
      audits: {},
      categories: {
        performance: { score: 0.5, title: 'Performance (Limited)' },
        seo: { score: 0.6, title: 'SEO (Limited)' },
        accessibility: { score: 0.5, title: 'Accessibility (Limited)' },
        'best-practices': { score: 0.5, title: 'Best Practices (Limited)' }
      },
      analysisMethod: 'fallback-performance',
      limitedAnalysis: true,
      note: 'Performance analysis limited due to browser unavailability'
    }
  }

  /**
   * Run accessibility analysis using Pa11y
   */
  async runAccessibilityAnalysis(url, options = {}) {
    // If browser is not available, return fallback accessibility data
    if (!this.browserAvailable || !this.browser) {
      logger.warn('⚠️ Browser not available, returning fallback accessibility data')
      return this.getFallbackAccessibilityData(url)
    }
    
    try {
      const results = await pa11y(url, {
        standard: 'WCAG2AAA',
        timeout: 30000,
        wait: 3000,
        chromeLaunchConfig: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      })

      const issues = results.issues || []
      const errorCount = issues.filter(issue => issue.type === 'error').length
      const warningCount = issues.filter(issue => issue.type === 'warning').length
      const noticeCount = issues.filter(issue => issue.type === 'notice').length

      // Calculate accessibility score - more balanced approach
      let accessibilityScore = 100
      
      // Deduct points based on severity and type
      accessibilityScore -= Math.min(errorCount * 0.8, 60)    // Max 60 points for errors
      accessibilityScore -= Math.min(warningCount * 0.3, 20)  // Max 20 points for warnings  
      accessibilityScore -= Math.min(noticeCount * 0.1, 10)   // Max 10 points for notices
      
      accessibilityScore = Math.max(0, Math.round(accessibilityScore))

      return {
        score: accessibilityScore,
        issues: {
          errors: errorCount,
          warnings: warningCount,
          notices: noticeCount,
          total: issues.length
        },
        details: issues.slice(0, 20).map(issue => ({
          type: issue.type,
          code: issue.code,
          message: issue.message,
          selector: issue.selector,
          context: issue.context
        }))
      }

    } catch (error) {
      logger.warn('Accessibility analysis failed:', error.message)
      return {
        score: 0,
        issues: { errors: 0, warnings: 0, notices: 0, total: 0 },
        details: [],
        error: error.message
      }
    }
  }

  /**
   * Get fallback accessibility data when Pa11y is not available
   */
  getFallbackAccessibilityData(url) {
    logger.info(`♿ Generating fallback accessibility data for ${url}`)
    
    return {
      score: 60, // Reasonable default
      totalIssues: 1,
      issues: {
        errors: 0,
        warnings: 1,
        notices: 0,
        total: 1
      },
      details: [
        {
          type: 'notice',
          code: 'browser-unavailable',
          message: 'Detailed accessibility analysis unavailable due to browser limitations in this environment.',
          context: null,
          selector: 'html'
        }
      ],
      categories: [
        'WCAG2A',
        'WCAG2AA'
      ],
      analysisMethod: 'fallback-accessibility',
      limitedAnalysis: true,
      note: 'Accessibility analysis limited due to browser unavailability'
    }
  }

  /**
   * Detect technologies using custom TechnologyDetector
   */
  async detectTechnologies(url, html, headers, options = {}) {
    try {
      const results = await this.technologyDetector.detectTechnologies(url, html, headers)
      
      return {
        technologies: results.technologies,
        categories: results.categories,
        count: results.count,
        stats: this.technologyDetector.getTechnologyStats(results.technologies)
      }

    } catch (error) {
      logger.warn('Technology detection failed:', error.message)
      return {
        technologies: [],
        categories: [],
        count: 0,
        error: error.message
      }
    }
  }

  /**
   * Analyze security headers and HTTPS
   */
  async analyzeSecurityHeaders(url, options = {}) {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        validateStatus: () => true
      })

      const headers = response.headers
      const isHttps = url.startsWith('https://')

      // Check for important security headers
      const securityHeaders = {
        'strict-transport-security': !!headers['strict-transport-security'],
        'content-security-policy': !!headers['content-security-policy'],
        'x-frame-options': !!headers['x-frame-options'],
        'x-content-type-options': !!headers['x-content-type-options'],
        'x-xss-protection': !!headers['x-xss-protection'],
        'referrer-policy': !!headers['referrer-policy']
      }

      const securityScore = Math.round(
        (Object.values(securityHeaders).filter(Boolean).length / Object.keys(securityHeaders).length) * 
        (isHttps ? 100 : 50) // Penalty for HTTP
      )

      return {
        isHttps,
        score: securityScore,
        headers: securityHeaders,
        rawHeaders: Object.keys(headers).reduce((acc, key) => {
          if (key.toLowerCase().includes('security') || 
              key.toLowerCase().includes('x-') ||
              key.toLowerCase() === 'referrer-policy') {
            acc[key] = headers[key]
          }
          return acc
        }, {}),
        recommendations: this.getSecurityRecommendations(securityHeaders, isHttps)
      }

    } catch (error) {
      logger.warn('Security analysis failed:', error.message)
      return {
        isHttps: false,
        score: 0,
        headers: {},
        rawHeaders: {},
        recommendations: [],
        error: error.message
      }
    }
  }

  /**
   * Calculate overall scores from all analyses
   */
  calculateOverallScores(data) {
    const lighthouse = data.lighthouse || {}
    const accessibility = data.accessibility || {}
    const security = data.security || {}

    return {
      overall: Math.round(
        ((lighthouse.performance || 0) * 0.3 +
         (lighthouse.seo || 0) * 0.2 +
         (lighthouse.bestPractices || 0) * 0.2 +
         (accessibility.score || 0) * 0.2 +
         (security.score || 0) * 0.1)
      ),
      performance: lighthouse.performance || 0,
      seo: lighthouse.seo || 0,
      accessibility: accessibility.score || 0,
      security: security.score || 0,
      bestPractices: lighthouse.bestPractices || 0
    }
  }

  /**
   * Validate and normalize URL
   */
  validateAndNormalizeUrl(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.toString()
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`)
    }
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(headers, isHttps) {
    const recommendations = []

    if (!isHttps) {
      recommendations.push('Implement HTTPS to encrypt data in transit')
    }

    if (!headers['strict-transport-security']) {
      recommendations.push('Add HSTS header to enforce HTTPS')
    }

    if (!headers['content-security-policy']) {
      recommendations.push('Implement Content Security Policy to prevent XSS attacks')
    }

    if (!headers['x-frame-options']) {
      recommendations.push('Add X-Frame-Options header to prevent clickjacking')
    }

    if (!headers['x-content-type-options']) {
      recommendations.push('Add X-Content-Type-Options header to prevent MIME sniffing')
    }

    return recommendations
  }

  /**
   * Handle cookie banners and common overlays
   */
  async handleCookieBanners(page) {
    try {
      // Wait a moment for overlays to appear
      await page.waitForTimeout(2000)

      // Common cookie banner selectors
      const cookieSelectors = [
        // Generic patterns
        '[id*="cookie" i] button',
        '[class*="cookie" i] button',
        '[id*="consent" i] button',
        '[class*="consent" i] button',
        '[data-testid*="cookie" i]',
        '[data-testid*="consent" i]',
        
        // Common button texts (case insensitive)
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("OK")',
        'button:has-text("I Accept")',
        'button:has-text("Got it")',
        'button:has-text("Allow All")',
        'button:has-text("Agree")',
        
        // Popular cookie banner libraries
        '#cookieConsent button',
        '.cookie-consent button',
        '.cc-dismiss',
        '.cc-allow',
        '#onetrust-accept-btn-handler',
        '#onetrust-pc-btn-handler',
        '.ot-pc-refuse-all-handler',
        
        // GDPR specific
        '[data-gdpr="accept"]',
        '[data-cookie="accept"]',
        '.gdpr-accept',
        '.privacy-accept'
      ]

      // Try to find and click cookie acceptance buttons
      for (const selector of cookieSelectors) {
        try {
          const elements = await page.$$(selector)
          if (elements.length > 0) {
            logger.info(`🍪 Found cookie banner with selector: ${selector}`)
            await elements[0].click()
            await page.waitForTimeout(1000) // Wait for animation
            break
          }
        } catch (err) {
          // Continue trying other selectors
        }
      }

      // Handle modals/overlays that might block content
      const overlaySelectors = [
        '.modal button[aria-label*="close" i]',
        '.overlay button[aria-label*="close" i]',
        '[role="dialog"] button[aria-label*="close" i]',
        '.popup-close',
        '.close-button',
        '.modal-close'
      ]

      for (const selector of overlaySelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            await page.waitForTimeout(500)
          }
        } catch (err) {
          // Continue
        }
      }

    } catch (error) {
      logger.warn('Cookie banner handling failed:', error.message)
    }
  }

  /**
   * Calculate performance score based on Core Web Vitals when Lighthouse fails
   */
  calculatePerformanceScore(metrics) {
    let score = 100

    // First Contentful Paint scoring
    if (metrics.firstContentfulPaint) {
      if (metrics.firstContentfulPaint > 3000) score -= 25
      else if (metrics.firstContentfulPaint > 1800) score -= 15
      else if (metrics.firstContentfulPaint > 1200) score -= 5
    }

    // Largest Contentful Paint scoring  
    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > 4000) score -= 25
      else if (metrics.largestContentfulPaint > 2500) score -= 15
      else if (metrics.largestContentfulPaint > 1800) score -= 5
    }

    // Cumulative Layout Shift scoring
    if (metrics.cumulativeLayoutShift !== undefined) {
      if (metrics.cumulativeLayoutShift > 0.25) score -= 20
      else if (metrics.cumulativeLayoutShift > 0.1) score -= 10
    }

    // Total Blocking Time scoring
    if (metrics.totalBlockingTime !== undefined) {
      if (metrics.totalBlockingTime > 600) score -= 20
      else if (metrics.totalBlockingTime > 300) score -= 10
      else if (metrics.totalBlockingTime > 150) score -= 5
    }

    // Speed Index scoring
    if (metrics.speedIndex) {
      if (metrics.speedIndex > 5800) score -= 15
      else if (metrics.speedIndex > 3400) score -= 10
      else if (metrics.speedIndex > 2300) score -= 5
    }

    return Math.max(0, Math.round(score))
  }

  /**
   * Calculate overall scores from different analysis results
   */
  calculateOverallScores(results) {
    const lighthouse = results.lighthouse || {}
    const accessibility = results.accessibility || {}
    const security = results.security || {}

    const scores = {
      performance: lighthouse.performance || 0,
      seo: lighthouse.seo || 0,
      // Use Lighthouse accessibility if available and > 0, otherwise use Pa11y
      accessibility: (lighthouse.accessibility && lighthouse.accessibility > 0) 
        ? lighthouse.accessibility 
        : (accessibility.score || 0),
      security: security.score || 0,
      bestPractices: lighthouse.bestPractices || 0
    }

    // Calculate overall score as weighted average
    const weights = {
      performance: 0.25,
      seo: 0.25,
      accessibility: 0.2,
      security: 0.15,
      bestPractices: 0.15
    }

    const overall = Math.round(
      scores.performance * weights.performance +
      scores.seo * weights.seo +
      scores.accessibility * weights.accessibility +
      scores.security * weights.security +
      scores.bestPractices * weights.bestPractices
    )

    return {
      ...scores,
      overall
    }
  }

  /**
   * Helper to safely get result values from Promise.allSettled
   */
  getResultValue(result) {
    return result.status === 'fulfilled' ? result.value : { error: result.reason?.message }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export default WebsiteAnalyzer 