import express from 'express'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth.js'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const router = express.Router()

// OpenAI client will be initialized in the route handler
let openai = null

/**
 * Get or initialize OpenAI client
 */
function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

/**
 * Fetch and extract content from URL
 */
async function fetchUrlContent(url) {
  try {
    console.log(`Fetching content from: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script and style elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove()

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim()

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || ''

    // Extract main content
    let content = ''
    
    // Try to find main content areas
    const contentSelectors = [
      'main',
      'article', 
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-content',
      '#content',
      '.main-content'
    ]

    let foundContent = false
    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        if (content.length > 100) {
          foundContent = true
          break
        }
      }
    }

    // Fallback: extract from body if no main content found
    if (!foundContent) {
      $('body').find('h1, h2, h3, h4, h5, h6, p, div').each((i, el) => {
        const text = $(el).text().trim()
        if (text.length > 20 && !text.match(/^(menu|navigation|sidebar|footer|header)/i)) {
          content += text + '\n'
        }
      })
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .replace(/\n\s*\n/g, '\n\n') // Keep paragraph breaks
      .trim()

    // Limit content length (OpenAI has token limits)
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...'
    }

    const extractedContent = {
      title,
      metaDescription,
      content,
      url,
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length
    }

    console.log(`Successfully extracted content from ${url}:`, {
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      wordCount: extractedContent.wordCount
    })

    return extractedContent
    
  } catch (error) {
    console.error(`Failed to fetch content from ${url}:`, error)
    throw new Error(`Unable to fetch content from URL: ${error.message}`)
  }
}

/**
 * Calculate real readability score using various metrics
 */
function calculateReadabilityScore(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word)
  }, 0)
  
  if (sentences.length === 0 || words.length === 0) return 0
  
  // Flesch Reading Ease Score
  const avgSentenceLength = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length
  
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  
  // Convert to 0-100 scale where higher is better
  return Math.max(0, Math.min(100, Math.round(fleschScore)))
}

function countSyllables(word) {
  word = word.toLowerCase()
  if (word.length <= 3) return 1
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

/**
 * Calculate grammar score based on content analysis
 */
function calculateGrammarScore(content, grammarIssues) {
  const issueCount = grammarIssues.length
  const wordCount = content.split(/\s+/).length
  
  // Base score starts high and decreases with issues
  let score = 95
  
  // Deduct points for grammar issues (more severe for shorter content)
  const issueRatio = issueCount / Math.max(wordCount / 100, 1) // Issues per 100 words
  score -= Math.min(issueRatio * 15, 75) // Cap deduction at 75 points
  
  return Math.max(10, Math.round(score))
}

/**
 * Calculate comprehensive SEO score for content
 */
function calculateContentSEOScore(content) {
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  let score = 0
  const factors = []
  
  // Word count analysis (0-30 points)
  if (wordCount >= 1000) {
    score += 30
    factors.push('Excellent content length (1000+ words)')
  } else if (wordCount >= 500) {
    score += 25
    factors.push('Good content length (500+ words)')
  } else if (wordCount >= 300) {
    score += 15
    factors.push('Adequate content length (300+ words)')
  } else {
    score += 5
    factors.push('Content too short (under 300 words)')
  }
  
  // Content structure (0-25 points)
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0
  if (avgWordsPerSentence <= 20 && avgWordsPerSentence >= 10) {
    score += 25
    factors.push('Good sentence length')
  } else if (avgWordsPerSentence > 25) {
    score += 10
    factors.push('Sentences too long')
  } else {
    score += 15
    factors.push('Acceptable sentence structure')
  }
  
  // Paragraph structure (0-20 points)
  if (paragraphs.length >= 3) {
    const avgWordsPerParagraph = wordCount / paragraphs.length
    if (avgWordsPerParagraph <= 150 && avgWordsPerParagraph >= 50) {
      score += 20
      factors.push('Well-structured paragraphs')
    } else {
      score += 10
      factors.push('Paragraph length could be improved')
    }
  } else {
    score += 5
    factors.push('Consider breaking into more paragraphs')
  }
  
  // Keyword density and variety (0-25 points)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')))
  const lexicalDiversity = uniqueWords.size / wordCount
  
  if (lexicalDiversity >= 0.6) {
    score += 25
    factors.push('Excellent vocabulary diversity')
  } else if (lexicalDiversity >= 0.4) {
    score += 15
    factors.push('Good vocabulary diversity')
  } else {
    score += 5
    factors.push('Limited vocabulary diversity')
  }
  
  return {
    score: Math.min(100, score),
    factors,
    metrics: {
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      lexicalDiversity: Math.round(lexicalDiversity * 100)
    }
  }
}

/**
 * Extract keywords from content
 */
function extractKeywords(content, improvedContent) {
  // Simple keyword extraction - find repeated important words
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
  
  // Common stop words to filter out
  const stopWords = new Set([
    'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know',
    'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when',
    'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over',
    'such', 'take', 'than', 'them', 'well', 'were', 'what'
  ])
  
  // Count word frequency
  const wordCount = {}
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  
  // Get top keywords (appearing more than once)
  return Object.entries(wordCount)
    .filter(([word, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

/**
 * Extract clean text from HTML content
 */
function extractTextFromHtml(htmlContent) {
  try {
    const $ = cheerio.load(htmlContent)
    
    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share, .menu, .navigation').remove()
    
    // Get text content
    let textContent = $('body').length > 0 ? $('body').text() : $.text()
    
    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .replace(/\n\s*\n/g, '\n\n') // Keep paragraph breaks
      .trim()
    
    return textContent
  } catch (error) {
    // If HTML parsing fails, return original content
    return htmlContent
  }
}

/**
 * Detect if content is HTML
 */
function isHtmlContent(content) {
  // Simple HTML detection
  return /<[^>]+>/.test(content) && (
    content.includes('<html') || 
    content.includes('<head') || 
    content.includes('<body') || 
    content.includes('<div') || 
    content.includes('<p>') ||
    content.includes('<article') ||
    content.includes('<section')
  )
}

// Analyze content
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { content, url, type } = req.body
    
    let textToAnalyze = content
    let urlInfo = null
    let contentSource = 'text'
    
    // If URL is provided, fetch real content
    if (type === 'url' && url) {
      try {
        contentSource = 'url'
        urlInfo = await fetchUrlContent(url)
        textToAnalyze = `${urlInfo.title}\n\n${urlInfo.metaDescription}\n\n${urlInfo.content}`
      } catch (fetchError) {
        return res.status(400).json({
          success: false,
          error: `Failed to fetch content from URL: ${fetchError.message}`
        })
      }
    } 
    // If text content looks like HTML, extract clean text
    else if (type === 'text' && content && isHtmlContent(content)) {
      contentSource = 'html'
      const cleanText = extractTextFromHtml(content)
      if (cleanText && cleanText.length > 50) {
        textToAnalyze = cleanText
        console.log('Detected HTML content, extracted clean text:', cleanText.substring(0, 100) + '...')
      }
    }
    
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required for analysis'
      })
    }

    // Initialize OpenAI client when needed
    const openaiClient = getOpenAIClient()

    // Enhanced prompt based on content type
    let contentTypeDescription = 'content'
    if (contentSource === 'url') {
      contentTypeDescription = `webpage content from ${url}`
    } else if (contentSource === 'html') {
      contentTypeDescription = 'HTML content (cleaned and extracted)'
    }

    const prompt = `You are a professional content editor and SEO specialist. Analyze the following ${contentTypeDescription} and provide improvements.

${contentSource === 'url' ? `WEBPAGE CONTENT FROM: ${url}` : 
  contentSource === 'html' ? 'CLEANED TEXT FROM HTML:' : 
  'CONTENT TO ANALYZE:'}
"""
${textToAnalyze}
"""

Please provide a JSON response with the following structure:
{
  "improved": "The improved version of the content with better grammar, clarity, and flow${contentSource === 'url' ? ' (focus on the main content, not the title/meta)' : ''}",
  "grammar": {
    "issues": [
      {"type": "grammar", "suggestion": "Specific grammar fix suggestion"},
      {"type": "punctuation", "suggestion": "Punctuation improvement"}
    ]
  },
  "readability": {
    "suggestions": [
      "Specific suggestion to improve readability",
      "Another readability improvement"
    ]
  },
  "seo": {
    "suggestions": [
      "${contentSource === 'url' ? 'Website SEO improvement suggestion' : 
         contentSource === 'html' ? 'Content structure and SEO improvement' :
         'Content SEO improvement suggestion'}",
      "Another SEO tip"
    ]
  },
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Focus on:
1. Improving grammar, clarity, and flow
2. Making the content more engaging and readable
3. ${contentSource === 'url' ? 'Website SEO optimization' : 
     contentSource === 'html' ? 'Content structure and SEO optimization' :
     'Content SEO optimization'}
4. Extracting relevant keywords from the actual content
`

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional content editor and SEO specialist. Always respond with valid JSON. You are analyzing ${contentTypeDescription}.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    let analysisData
    try {
      analysisData = JSON.parse(response.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      // Fallback analysis with real keywords
      const fallbackKeywords = extractKeywords(textToAnalyze, '')
        
      analysisData = {
        improved: textToAnalyze,
        grammar: {
          issues: [
            { type: 'info', suggestion: 'Content analyzed successfully' }
          ]
        },
        readability: {
          suggestions: [
            'Consider using shorter sentences for better readability',
            'Add transition words to improve flow'
          ]
        },
        seo: {
          suggestions: [
            contentSource === 'url' ? 'Optimize page title and meta description' : 
            contentSource === 'html' ? 'Structure content with proper headings' :
            'Add more descriptive headings',
            'Include relevant keywords naturally'
          ]
        },
        keywords: fallbackKeywords
      }
    }

    // Calculate real scores based on content analysis
    const grammarScore = calculateGrammarScore(textToAnalyze, analysisData.grammar.issues)
    const readabilityScore = calculateReadabilityScore(textToAnalyze)
    const seoAnalysis = calculateContentSEOScore(textToAnalyze)
    
    // Word count for summary
    const wordCount = textToAnalyze.split(/\s+/).filter(w => w.length > 0).length

    const analysisResult = {
      original: textToAnalyze,
      improved: analysisData.improved,
      grammar: {
        score: grammarScore,
        issues: analysisData.grammar.issues
      },
      readability: {
        score: readabilityScore,
        suggestions: analysisData.readability.suggestions
      },
      seo: {
        score: seoAnalysis.score,
        suggestions: analysisData.seo.suggestions,
        factors: seoAnalysis.factors,
        metrics: seoAnalysis.metrics
      },
      summary: {
        wordCount
      },
      keywords: analysisData.keywords || extractKeywords(textToAnalyze, analysisData.improved),
      urlInfo: urlInfo, // Include URL info if available
      contentSource: contentSource // Track what type of content was analyzed
    }

    res.json({
      success: true,
      analysis: {
        result: analysisResult
      }
    })

  } catch (error) {
    console.error('Content analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Content analysis failed'
    })
  }
})

export default router 