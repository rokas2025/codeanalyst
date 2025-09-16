// Serverless function for URL fetching (Vercel/Netlify compatible)
// This bypasses CORS by running on the server side

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const url = req.method === 'GET' ? req.query.url : req.body.url

    if (!url) {
      res.status(400).json({ error: 'URL parameter is required' })
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

    console.log(`Fetching URL: ${targetUrl.toString()}`)

    // Fetch the URL
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'CodeAnalyst-Bot/1.0 (Website Analysis Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      timeout: 30000
    })

    if (!response.ok) {
      res.status(response.status).json({ 
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        url: targetUrl.toString()
      })
      return
    }

    const html = await response.text()
    const headers = {}
    
    // Convert Headers to plain object
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    res.status(200).json({
      success: true,
      url: targetUrl.toString(),
      html,
      headers,
      statusCode: response.status,
      contentLength: html.length,
      contentType: response.headers.get('content-type') || 'text/html'
    })

  } catch (error) {
    console.error('URL fetch error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch URL',
      message: error.message,
      url: req.query.url || req.body.url
    })
  }
} 