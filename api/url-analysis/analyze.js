// Basic URL analysis endpoint for Vercel
import { JSDOM } from 'jsdom'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { url, options = {} } = req.body

    if (!url) {
      res.status(400).json({ error: 'URL is required' })
      return
    }

    // Validate URL
    let targetUrl
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch (error) {
      res.status(400).json({ error: 'Invalid URL format' })
      return
    }

    // Generate analysis ID
    const analysisId = Date.now().toString()

    // Fetch the webpage
    const fetchResponse = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'CodeAnalyst-Bot/1.0 (Website Analysis Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000
    })

    if (!fetchResponse.ok) {
      res.status(400).json({ 
        error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` 
      })
      return
    }

    const html = await fetchResponse.text()
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Basic SEO and structure analysis
    const title = document.title || ''
    const description = document.querySelector('meta[name="description"]')?.content || ''
    const keywords = document.querySelector('meta[name="keywords"]')?.content?.split(',').map(k => k.trim()) || []
    
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(Boolean)
    }

    const images = Array.from(document.querySelectorAll('img'))
    const imagesWithoutAlt = images.filter(img => !img.getAttribute('alt')).length

    // Basic technology detection
    const technologies = []
    if (html.includes('react')) technologies.push('React')
    if (html.includes('vue')) technologies.push('Vue.js')
    if (html.includes('angular')) technologies.push('Angular')
    if (html.includes('bootstrap')) technologies.push('Bootstrap')
    if (html.includes('jquery')) technologies.push('jQuery')

    // Calculate basic scores
    const seoScore = Math.min(100, Math.max(0, 
      (title ? 25 : 0) + 
      (description ? 25 : 0) + 
      (keywords.length > 0 ? 15 : 0) +
      (headings.h1.length > 0 ? 20 : 0) +
      (headings.h1.length === 1 ? 15 : headings.h1.length > 1 ? -10 : 0)
    ))

    const accessibilityScore = Math.min(100, Math.max(0,
      100 - (imagesWithoutAlt * 10) // Deduct points for images without alt text
    ))

    const performanceScore = 75 // Static for now since we can't run Lighthouse in serverless
    const securityScore = fetchResponse.headers.get('strict-transport-security') ? 80 : 60
    const overallScore = Math.round((seoScore + accessibilityScore + performanceScore + securityScore) / 4)

    // Create analysis result
    const analysis = {
      id: analysisId,
      url: targetUrl.toString(),
      status: 'completed',
      title,
      technologies,
      basic: {
        title,
        description,
        keywords,
        headingStructure: headings,
        imageCount: images.length,
        imagesWithoutAlt
      },
      scores: {
        performance: performanceScore,
        seo: seoScore,
        accessibility: accessibilityScore,
        security: securityScore,
        bestPractices: 70,
        overall: overallScore
      },
      performance: {
        score: performanceScore,
        metrics: {},
        opportunities: []
      },
      lighthouse: {
        performance: performanceScore,
        seo: seoScore,
        accessibility: accessibilityScore,
        bestPractices: 70
      },
      seo: {
        score: seoScore,
        title,
        description,
        keywords,
        headings,
        recommendations: title ? [] : ['Add a page title'],
        criticalIssues: !description ? ['Missing meta description'] : []
      },
      accessibility: {
        score: accessibilityScore,
        issues: imagesWithoutAlt > 0 ? [`${imagesWithoutAlt} images missing alt text`] : [],
        details: []
      },
      security: {
        score: securityScore,
        headers: {},
        vulnerabilities: [],
        recommendations: !fetchResponse.headers.get('strict-transport-security') ? 
          ['Enable HTTPS Strict Transport Security'] : []
      },
      aiInsights: {
        summary: `Website analysis completed. Overall score: ${overallScore}/100. ${title ? 'Good page title present.' : 'Missing page title.'} ${description ? 'Meta description found.' : 'Missing meta description.'}`
      },
      businessRecommendations: [
        {
          category: 'SEO',
          recommendation: seoScore < 80 ? 'Improve SEO by adding missing meta tags and optimizing content structure' : 'SEO looks good, maintain current practices',
          impact: seoScore < 50 ? 'high' : seoScore < 80 ? 'medium' : 'low',
          urgency: seoScore < 50 ? 'high' : 'medium'
        }
      ],
      riskAssessment: {
        overallRisk: overallScore > 80 ? 'low' : overallScore > 60 ? 'medium' : 'high',
        technicalRisks: accessibilityScore < 70 ? ['Accessibility issues detected'] : [],
        businessRisks: seoScore < 60 ? ['Poor SEO may affect search rankings'] : [],
        securityConcerns: securityScore < 70 ? ['Security headers missing'] : []
      },
      analysisDate: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: 2000,
      confidenceScore: 65 // Lower confidence for simplified analysis
    }

    res.status(200).json({
      success: true,
      analysisId,
      status: 'completed',
      estimatedTime: 'completed',
      analysis
    })

  } catch (error) {
    console.error('URL analysis error:', error)
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    })
  }
}
