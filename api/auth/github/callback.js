// GitHub OAuth callback handler for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { code, state } = req.query

  if (!code) {
    res.status(400).json({ error: 'Authorization code not provided' })
    return
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      res.status(400).json({ error: tokenData.error_description || 'Failed to get access token' })
      return
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'CodeAnalyst-App'
      }
    })

    const userData = await userResponse.json()

    // Create a simple JWT token (you should use a proper JWT library in production)
    const userToken = Buffer.from(JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      github_token: tokenData.access_token,
      created_at: new Date().toISOString()
    })).toString('base64')

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/auth/callback?token=${userToken}`)

  } catch (error) {
    console.error('GitHub OAuth error:', error)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}
