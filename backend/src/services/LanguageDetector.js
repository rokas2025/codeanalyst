// Language Detection Service
import { logger } from '../utils/logger.js'

/**
 * Detects language from HTML and text content
 * Supports: Lithuanian (lt), English (en)
 */
export class LanguageDetector {
  constructor() {
    // Common words for language detection
    this.languagePatterns = {
      lt: {
        commonWords: [
          'ir', 'yra', 'kad', 'su', 'bet', 'kaip', 'tai', 'į', 'iš', 'per',
          'apie', 'už', 'nuo', 'dėl', 'mes', 'jūs', 'jie', 'jos', 'šis', 'tas',
          'kuris', 'kuri', 'koks', 'kokia', 'dabar', 'čia', 'ten', 'kada', 'kur',
          'ką', 'ko', 'kam', 'kuo', 'buvo', 'bus', 'gali', 'galima', 'reikia',
          'nėra', 'negalima', 'turi', 'turėti', 'daryti', 'padaryti', 'sako',
          'sakė', 'pasakė', 'žmonės', 'žmogus', 'diena', 'metai', 'laikas'
        ],
        specialChars: ['ą', 'č', 'ę', 'ė', 'į', 'š', 'ų', 'ū', 'ž', 'Ą', 'Č', 'Ę', 'Ė', 'Į', 'Š', 'Ų', 'Ū', 'Ž'],
        name: 'Lithuanian',
        code: 'lt'
      },
      en: {
        commonWords: [
          'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
          'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
          'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
          'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
          'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
        ],
        specialChars: [],
        name: 'English',
        code: 'en'
      }
    }
  }

  /**
   * Detect language from HTML content
   * @param {string} html - HTML content
   * @param {string} text - Plain text content (optional)
   * @returns {Object} - { language: 'lt'|'en'|'unknown', confidence: number, detectedBy: string }
   */
  detectLanguage(html, text = '') {
    try {
      // 1. Check HTML lang attribute (highest priority)
      const langAttr = this.extractHtmlLangAttribute(html)
      if (langAttr) {
        logger.info(`Language detected from HTML lang attribute: ${langAttr}`)
        return {
          language: langAttr,
          confidence: 95,
          detectedBy: 'html-lang-attribute'
        }
      }

      // 2. Check meta tags
      const metaLang = this.extractMetaLanguage(html)
      if (metaLang) {
        logger.info(`Language detected from meta tags: ${metaLang}`)
        return {
          language: metaLang,
          confidence: 90,
          detectedBy: 'meta-tags'
        }
      }

      // 3. Analyze text content
      const textToAnalyze = text || this.extractTextFromHtml(html)
      if (textToAnalyze && textToAnalyze.length > 50) {
        const contentLang = this.analyzeTextContent(textToAnalyze)
        if (contentLang.language !== 'unknown') {
          logger.info(`Language detected from content analysis: ${contentLang.language} (confidence: ${contentLang.confidence}%)`)
          return contentLang
        }
      }

      // 4. Default to English if no detection
      logger.info('Language detection failed, defaulting to English')
      return {
        language: 'en',
        confidence: 50,
        detectedBy: 'default'
      }

    } catch (error) {
      logger.error('Language detection error:', error)
      return {
        language: 'en',
        confidence: 50,
        detectedBy: 'error-fallback'
      }
    }
  }

  /**
   * Extract language from HTML lang attribute
   */
  extractHtmlLangAttribute(html) {
    try {
      // Match <html lang="xx"> or <html lang="xx-YY">
      const langMatch = html.match(/<html[^>]*\slang=["']([a-z]{2})(?:-[A-Z]{2})?["']/i)
      if (langMatch && langMatch[1]) {
        const lang = langMatch[1].toLowerCase()
        if (lang === 'lt' || lang === 'en') {
          return lang
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return null
  }

  /**
   * Extract language from meta tags
   */
  extractMetaLanguage(html) {
    try {
      // Check og:locale meta tag
      const ogLocaleMatch = html.match(/<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:locale["']/i)
      
      if (ogLocaleMatch && ogLocaleMatch[1]) {
        const locale = ogLocaleMatch[1].toLowerCase()
        if (locale.startsWith('lt')) return 'lt'
        if (locale.startsWith('en')) return 'en'
      }

      // Check content-language meta tag
      const contentLangMatch = html.match(/<meta[^>]*http-equiv=["']content-language["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*http-equiv=["']content-language["']/i)
      
      if (contentLangMatch && contentLangMatch[1]) {
        const lang = contentLangMatch[1].toLowerCase().substring(0, 2)
        if (lang === 'lt' || lang === 'en') {
          return lang
        }
      }

      // Check language meta tag
      const langMetaMatch = html.match(/<meta[^>]*name=["']language["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']language["']/i)
      
      if (langMetaMatch && langMetaMatch[1]) {
        const lang = langMetaMatch[1].toLowerCase().substring(0, 2)
        if (lang === 'lt' || lang === 'en') {
          return lang
        }
      }

    } catch (error) {
      // Ignore errors
    }
    return null
  }

  /**
   * Extract plain text from HTML
   */
  extractTextFromHtml(html) {
    try {
      // Remove script and style tags
      let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      
      // Remove HTML tags
      text = text.replace(/<[^>]+>/g, ' ')
      
      // Decode HTML entities
      text = text.replace(/&nbsp;/g, ' ')
      text = text.replace(/&amp;/g, '&')
      text = text.replace(/&lt;/g, '<')
      text = text.replace(/&gt;/g, '>')
      text = text.replace(/&quot;/g, '"')
      text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      
      // Clean up whitespace
      text = text.replace(/\s+/g, ' ').trim()
      
      return text
    } catch (error) {
      return ''
    }
  }

  /**
   * Analyze text content to detect language
   */
  analyzeTextContent(text) {
    try {
      const textLower = text.toLowerCase()
      const words = textLower.match(/\b[a-ząčęėįšųūž]+\b/gi) || []
      
      if (words.length < 10) {
        return { language: 'unknown', confidence: 0, detectedBy: 'insufficient-text' }
      }

      const scores = {
        lt: 0,
        en: 0
      }

      // Check for Lithuanian special characters (strong indicator)
      const ltSpecialChars = this.languagePatterns.lt.specialChars
      let ltCharCount = 0
      for (const char of ltSpecialChars) {
        ltCharCount += (text.match(new RegExp(char, 'g')) || []).length
      }
      
      if (ltCharCount > 0) {
        scores.lt += ltCharCount * 10 // Strong weight for Lithuanian characters
      }

      // Check common words
      for (const word of words) {
        if (this.languagePatterns.lt.commonWords.includes(word)) {
          scores.lt += 2
        }
        if (this.languagePatterns.en.commonWords.includes(word)) {
          scores.en += 2
        }
      }

      // Calculate confidence
      const totalScore = scores.lt + scores.en
      if (totalScore === 0) {
        return { language: 'unknown', confidence: 0, detectedBy: 'no-matches' }
      }

      const ltConfidence = Math.round((scores.lt / totalScore) * 100)
      const enConfidence = Math.round((scores.en / totalScore) * 100)

      // Determine language (need at least 60% confidence)
      if (ltConfidence >= 60) {
        return {
          language: 'lt',
          confidence: ltConfidence,
          detectedBy: 'content-analysis'
        }
      } else if (enConfidence >= 60) {
        return {
          language: 'en',
          confidence: enConfidence,
          detectedBy: 'content-analysis'
        }
      }

      // If no clear winner, default to English
      return {
        language: 'en',
        confidence: 50,
        detectedBy: 'unclear-fallback'
      }

    } catch (error) {
      logger.error('Text content analysis error:', error)
      return { language: 'unknown', confidence: 0, detectedBy: 'error' }
    }
  }

  /**
   * Get language name from code
   */
  getLanguageName(code) {
    const lang = this.languagePatterns[code]
    return lang ? lang.name : 'Unknown'
  }
}

export default LanguageDetector

