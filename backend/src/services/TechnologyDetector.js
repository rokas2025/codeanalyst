// Technology Detection Service - Custom implementation using pattern matching
import axios from 'axios'
import { logger } from '../utils/logger.js'

export class TechnologyDetector {
  constructor() {
    // Initialize with built-in pattern matching only
    this.patterns = this.initializePatterns()
  }

  /**
   * Initialize technology detection patterns
   */
  initializePatterns() {
    return {
      // JavaScript Frameworks & Libraries
      javascript: [
        { name: 'React', patterns: ['react', '_reactinternalfiber', '__reactinternalinstance', 'ReactDOM'], category: 'JavaScript Frameworks' },
        { name: 'Vue.js', patterns: ['vue.js', '__vue__', 'v-if', 'v-for', 'Vue.component'], category: 'JavaScript Frameworks' },
        { name: 'Angular', patterns: ['angular', 'ng-version', 'ng-app', '@angular'], category: 'JavaScript Frameworks' },
        { name: 'jQuery', patterns: ['jquery', '$.fn.jquery', 'jQuery.fn.jquery'], category: 'JavaScript Libraries' },
        { name: 'Next.js', patterns: ['_next', '__next', 'next.js', '_buildManifest'], category: 'JavaScript Frameworks' },
        { name: 'Nuxt.js', patterns: ['__nuxt', 'nuxt.js', '$nuxt'], category: 'JavaScript Frameworks' },
        { name: 'Svelte', patterns: ['svelte'], category: 'JavaScript Frameworks' },
        { name: 'Alpine.js', patterns: ['alpine.js', 'x-data', 'x-show'], category: 'JavaScript Frameworks' },
        { name: 'Lodash', patterns: ['lodash', '_.'], category: 'JavaScript Libraries' },
        { name: 'Moment.js', patterns: ['moment.js', 'moment('], category: 'JavaScript Libraries' }
      ],

      // CSS Frameworks
      css: [
        { name: 'Bootstrap', patterns: ['bootstrap', 'btn-primary', 'container-fluid', 'col-md-'], category: 'CSS Frameworks' },
        { name: 'Tailwind CSS', patterns: ['tailwindcss', 'tw-', 'bg-blue-', 'text-center'], category: 'CSS Frameworks' },
        { name: 'Bulma', patterns: ['bulma', 'is-primary', 'column'], category: 'CSS Frameworks' },
        { name: 'Foundation', patterns: ['foundation', 'grid-x'], category: 'CSS Frameworks' },
        { name: 'Materialize', patterns: ['materialize', 'material-icons'], category: 'CSS Frameworks' },
        { name: 'Semantic UI', patterns: ['semantic-ui', 'ui button'], category: 'CSS Frameworks' }
      ],

      // CMS & E-commerce
      cms: [
        { name: 'WordPress', patterns: ['wp-content', 'wp-includes', '/wp-json/', 'wp-admin'], category: 'CMS' },
        { name: 'Drupal', patterns: ['drupal', 'sites/default/files', '/sites/all/'], category: 'CMS' },
        { name: 'Joomla', patterns: ['joomla', '/media/jui/', 'joomla!'], category: 'CMS' },
        { name: 'Shopify', patterns: ['shopify', 'cdn.shopify.com', 'shopify-section'], category: 'E-commerce' },
        { name: 'WooCommerce', patterns: ['woocommerce', 'wc-', 'woocommerce-page'], category: 'E-commerce' },
        { name: 'Magento', patterns: ['magento', 'mage/cookies', 'skin/frontend'], category: 'E-commerce' },
        { name: 'Prestashop', patterns: ['prestashop', '/modules/'], category: 'E-commerce' }
      ],

      // Analytics & Marketing
      analytics: [
        { name: 'Google Analytics', patterns: ['google-analytics', 'gtag', 'ga.js', 'analytics.js'], category: 'Analytics' },
        { name: 'Google Tag Manager', patterns: ['googletagmanager', 'gtm.js', 'GTM-'], category: 'Analytics' },
        { name: 'Facebook Pixel', patterns: ['facebook.net/tr', 'fbq(', 'connect.facebook.net'], category: 'Analytics' },
        { name: 'Hotjar', patterns: ['hotjar', 'hjid'], category: 'Analytics' },
        { name: 'Mixpanel', patterns: ['mixpanel'], category: 'Analytics' },
        { name: 'Adobe Analytics', patterns: ['omniture', 'adobe.com/analytics'], category: 'Analytics' }
      ],

      // CDN & Hosting
      cdn: [
        { name: 'Cloudflare', patterns: ['cloudflare'], category: 'CDN' },
        { name: 'AWS CloudFront', patterns: ['cloudfront'], category: 'CDN' },
        { name: 'jsDelivr', patterns: ['jsdelivr'], category: 'CDN' },
        { name: 'cdnjs', patterns: ['cdnjs.cloudflare.com'], category: 'CDN' },
        { name: 'Google Fonts', patterns: ['fonts.googleapis.com'], category: 'CDN' }
      ],

      // Programming Languages
      languages: [
        { name: 'PHP', patterns: ['.php', 'php?', '<?php'], category: 'Programming Languages' },
        { name: 'Python', patterns: ['.py', 'python', 'django'], category: 'Programming Languages' },
        { name: 'Ruby', patterns: ['.rb', 'ruby', 'rails'], category: 'Programming Languages' },
        { name: 'Node.js', patterns: ['node.js', 'nodejs', 'npm'], category: 'Programming Languages' },
        { name: 'Java', patterns: ['.jsp', '.java', 'struts'], category: 'Programming Languages' },
        { name: 'ASP.NET', patterns: ['.aspx', '.asp', 'webforms'], category: 'Programming Languages' }
      ]
    }
  }

  /**
   * Detect technologies from HTML content and HTTP headers
   */
  async detectTechnologies(url, html, headers = {}) {
    try {
      logger.info(`🔍 Detecting technologies for ${url}`)

      const technologies = new Map()
      const categories = new Set()

      // Custom pattern detection
      const customResults = this.detectWithCustomPatterns(html, headers, url)
      this.mergeTechnologies(technologies, categories, customResults)

      // Detect from headers
      const headerResults = this.detectFromHeaders(headers)
      this.mergeTechnologies(technologies, categories, headerResults)

      // Detect from meta tags
      const metaResults = this.detectFromMetaTags(html)
      this.mergeTechnologies(technologies, categories, metaResults)

      // Convert to array format
      const detectedTechnologies = Array.from(technologies.values())
      const detectedCategories = Array.from(categories)

      logger.info(`✅ Detected ${detectedTechnologies.length} technologies in ${detectedCategories.length} categories`)

      return {
        technologies: detectedTechnologies,
        categories: detectedCategories,
        count: detectedTechnologies.length
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
   * Custom pattern-based technology detection
   */
  detectWithCustomPatterns(html, headers, url) {
    const technologies = []
    const headerString = JSON.stringify(headers).toLowerCase()
    const htmlLower = html.toLowerCase()

    // Check all pattern categories
    Object.values(this.patterns).flat().forEach(tech => {
      let found = false
      let confidence = 30

      // Check in HTML content
      tech.patterns.forEach(pattern => {
        if (htmlLower.includes(pattern.toLowerCase())) {
          found = true
          confidence += 20
        }
      })

      // Check in headers
      tech.patterns.forEach(pattern => {
        if (headerString.includes(pattern.toLowerCase())) {
          found = true
          confidence += 15
        }
      })

      // Check in URL
      tech.patterns.forEach(pattern => {
        if (url.toLowerCase().includes(pattern.toLowerCase())) {
          found = true
          confidence += 10
        }
      })

      if (found) {
        technologies.push({
          name: tech.name,
          categories: [tech.category],
          version: this.extractVersion(htmlLower, tech.name),
          confidence: Math.min(confidence, 100),
          website: null,
          source: 'custom-patterns'
        })
      }
    })

    return technologies
  }

  /**
   * Detect technologies from HTTP headers
   */
  detectFromHeaders(headers) {
    const technologies = []

    // Server detection
    if (headers.server) {
      const server = headers.server.toLowerCase()
      const serverTechs = [
        { name: 'Apache', patterns: ['apache'], category: 'Web Servers' },
        { name: 'Nginx', patterns: ['nginx'], category: 'Web Servers' },
        { name: 'IIS', patterns: ['microsoft-iis', 'iis/'], category: 'Web Servers' },
        { name: 'LiteSpeed', patterns: ['litespeed'], category: 'Web Servers' }
      ]

      serverTechs.forEach(tech => {
        if (tech.patterns.some(pattern => server.includes(pattern))) {
          technologies.push({
            name: tech.name,
            categories: [tech.category],
            version: this.extractVersion(server, tech.name),
            confidence: 90,
            website: null,
            source: 'headers'
          })
        }
      })
    }

    // Powered-by detection
    if (headers['x-powered-by']) {
      const poweredBy = headers['x-powered-by'].toLowerCase()
      const poweredByTechs = [
        { name: 'Express.js', patterns: ['express'], category: 'Web Frameworks' },
        { name: 'PHP', patterns: ['php'], category: 'Programming Languages' },
        { name: 'ASP.NET', patterns: ['asp.net'], category: 'Programming Languages' }
      ]

      poweredByTechs.forEach(tech => {
        if (tech.patterns.some(pattern => poweredBy.includes(pattern))) {
          technologies.push({
            name: tech.name,
            categories: [tech.category],
            version: this.extractVersion(poweredBy, tech.name),
            confidence: 95,
            website: null,
            source: 'headers'
          })
        }
      })
    }

    return technologies
  }

  /**
   * Detect technologies from meta tags
   */
  detectFromMetaTags(html) {
    const technologies = []

    // Extract generator meta tag
    const generatorMatch = html.match(/<meta[^>]*name=["|']generator["|'][^>]*content=["|']([^"']*)["|']/i)
    if (generatorMatch) {
      const generator = generatorMatch[1].toLowerCase()
      
      const generatorTechs = [
        { name: 'WordPress', patterns: ['wordpress'], category: 'CMS' },
        { name: 'Drupal', patterns: ['drupal'], category: 'CMS' },
        { name: 'Joomla', patterns: ['joomla'], category: 'CMS' },
        { name: 'Hugo', patterns: ['hugo'], category: 'Static Site Generator' },
        { name: 'Jekyll', patterns: ['jekyll'], category: 'Static Site Generator' }
      ]

      generatorTechs.forEach(tech => {
        if (tech.patterns.some(pattern => generator.includes(pattern))) {
          technologies.push({
            name: tech.name,
            categories: [tech.category],
            version: this.extractVersion(generator, tech.name),
            confidence: 85,
            website: null,
            source: 'meta-tags'
          })
        }
      })
    }

    return technologies
  }

  /**
   * Extract version from text
   */
  extractVersion(text, techName) {
    try {
      const versionPatterns = [
        new RegExp(`${techName.toLowerCase()}[\\s\\/\\-v]*([\\d\\.]+)`, 'i'),
        new RegExp(`version[\\s\\-]*([\\d\\.]+)`, 'i'),
        new RegExp(`v([\\d\\.]+)`, 'i'),
        new RegExp(`([\\d]+\\.[\\d]+(?:\\.[\\d]+)?)`, 'g')
      ]

      for (const pattern of versionPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
    } catch (error) {
      // Ignore version extraction errors
    }
    return null
  }

  /**
   * Merge technology results from different sources
   */
  mergeTechnologies(technologies, categories, newResults) {
    if (!newResults || !Array.isArray(newResults)) return

    newResults.forEach(tech => {
      const key = tech.name.toLowerCase()
      
      if (technologies.has(key)) {
        // Merge with existing technology (increase confidence)
        const existing = technologies.get(key)
        existing.confidence = Math.min(Math.max(existing.confidence, tech.confidence), 100)
        if (tech.version && !existing.version) {
          existing.version = tech.version
        }
        // Merge sources
        if (!existing.source.includes(tech.source)) {
          existing.source += `, ${tech.source}`
        }
      } else {
        // Add new technology
        technologies.set(key, tech)
      }

      // Add categories
      tech.categories.forEach(cat => categories.add(cat))
    })
  }

  /**
   * Get technology statistics
   */
  getTechnologyStats(technologies) {
    const stats = {
      total: technologies.length,
      byCategory: {},
      byConfidence: {
        high: 0,    // 80-100%
        medium: 0,  // 50-79%
        low: 0      // <50%
      },
      topTechnologies: technologies
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map(tech => ({ name: tech.name, confidence: tech.confidence }))
    }

    technologies.forEach(tech => {
      // Count by category
      tech.categories.forEach(category => {
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      })

      // Count by confidence
      if (tech.confidence >= 80) {
        stats.byConfidence.high++
      } else if (tech.confidence >= 50) {
        stats.byConfidence.medium++
      } else {
        stats.byConfidence.low++
      }
    })

    return stats
  }
}

export default TechnologyDetector 