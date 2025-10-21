// Authentication Routes - JWT auth with GitHub OAuth
import express from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger.js'
import { GitHubService } from '../services/GitHubService.js'
import { DatabaseService } from '../services/DatabaseService.js'
import { authMiddleware } from '../middleware/auth.js'
import { db } from '../database/connection.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = process.env.GITHUB_CALLBACK_URL

  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: 'GitHub OAuth not configured'
    })
  }

  const scope = 'user:email,repo'
  const state = jwt.sign({ timestamp: Date.now() }, process.env.JWT_SECRET, { expiresIn: '10m' })

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

  res.json({
    success: true,
    authUrl: githubAuthUrl,
    state
  })
})

/**
 * Shared handler for GitHub OAuth callback
 */
async function handleGitHubCallback(code, state, res) {
  try {
    if (!code) return res.status(400).json({ success: false, error: 'Authorization code required' })

    // Verify state
    try { jwt.verify(state, process.env.JWT_SECRET) } 
    catch { return res.status(400).json({ success: false, error: 'Invalid state parameter' }) }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    logger.info('GitHub token response:', { hasAccessToken: !!tokenData.access_token, tokenType: tokenData.token_type, scope: tokenData.scope, error: tokenData.error })

    if (tokenData.error) {
      logger.error('GitHub OAuth token error:', tokenData)
      return res.status(400).json({ success: false, error: 'GitHub OAuth failed', details: tokenData.error_description })
    }

    const accessToken = tokenData.access_token
    if (!accessToken) return res.status(400).json({ success: false, error: 'No access token received from GitHub' })

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${accessToken}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'CodeAnalyst-App' },
    })
    if (!userResponse.ok) return res.status(400).json({ success: false, error: `GitHub API error: ${userResponse.status} ${userResponse.statusText}` })
    const githubUser = await userResponse.json()

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { 'Authorization': `token ${accessToken}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'CodeAnalyst-App' },
    })
    const emails = await emailResponse.json()
    const primaryEmail = emails.find(email => email.primary)?.email || githubUser.email

    // Create or update user in database
    let user
    try {
      user = await DatabaseService.getUserByGithubId(githubUser.id)
      if (user) {
        user = await DatabaseService.updateUser(user.id, {
          github_username: githubUser.login,
          github_access_token: accessToken,
          name: githubUser.name || githubUser.login,
          avatar_url: githubUser.avatar_url,
          last_login: new Date().toISOString()
        })
      } else {
        user = await DatabaseService.createUser({
          github_id: githubUser.id,
          github_username: githubUser.login,
          github_access_token: accessToken,
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          avatar_url: githubUser.avatar_url,
          plan: 'free'
        })
      }
    } catch (dbError) {
      logger.error('Database error during GitHub auth:', dbError)
      return res.status(500).json({ success: false, error: 'Database error during authentication' })
    }

    // Generate JWT with 30-day expiration
    const jwtToken = jwt.sign({ 
      userId: user.id, 
      githubId: githubUser.id, 
      githubUsername: githubUser.login,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/github/callback?token=${jwtToken}`
    res.redirect(redirectUrl)

  } catch (error) {
    logger.error('GitHub OAuth callback failed:', error)
    res.status(500).json({ success: false, error: 'OAuth authentication failed' })
  }
}

// Handle GitHub redirect (GET)
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query
  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state parameter')
  }
  await handleGitHubCallback(code, state, res)
})

/**
 * GET /api/auth/github/repos
 * Get user's GitHub repositories
 */
router.get('/github/repos', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' })
    const user = await DatabaseService.getUserById(userId)
    if (!user?.github_access_token) return res.status(400).json({ success: false, error: 'GitHub account not connected' })

    const repos = await GitHubService.getUserRepositories(user.github_access_token)
    res.json({ success: true, repositories: repos })
  } catch (error) {
    logger.error('Failed to get GitHub repos:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch repositories' })
  }
})

/**
 * POST /api/auth/login
 * Simple login for development
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' })
    
    // Check if user exists in database
    const user = await DatabaseService.getUserByEmail(email)
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }
    
    // Check password if user has a password hash
    if (user.password_hash) {
      // Verify password using PostgreSQL crypt function
      const passwordCheckQuery = `SELECT (password_hash = crypt($1, password_hash)) AS password_match FROM users WHERE id = $2`
      const result = await db.query(passwordCheckQuery, [password, user.id])
      
      if (!result.rows[0]?.password_match) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' })
      }
    }
    
    // Generate proper JWT token with 30-day expiration
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        plan: user.plan || 'free',
        avatarUrl: user.avatar_url
      } 
    })
  } catch (error) {
    logger.error('Login failed:', error)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

/**
 * POST /api/auth/register
 * Register with email/password - works with or without Supabase Auth
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      })
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      })
    }
    
    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      })
    }
    
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists' 
      })
    }
    
    // If Supabase is configured, use it
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm for now
          user_metadata: { name }
        })
        
        if (authError) throw authError
        
        // Sync to our users table
        const user = await DatabaseService.createUser({
          id: authData.user.id, // Use Supabase user ID
          email: authData.user.email,
          name: name,
          plan: 'free',
          auth_provider: 'supabase'
        })
        
        const token = jwt.sign({
          userId: user.id,
          email: user.email,
          name: user.name
        }, process.env.JWT_SECRET, { expiresIn: '30d' })
        
        logger.info(`✅ User registered with Supabase Auth: ${email}`)
        
        return res.status(201).json({ 
          success: true, 
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            plan: user.plan 
          } 
        })
      } catch (supabaseError) {
        logger.warn('Supabase Auth failed, falling back to direct database:', supabaseError.message)
        // Fall through to direct database registration
      }
    }
    
    // Direct database registration (no Supabase Auth)
    // Hash password using PostgreSQL's pgcrypto extension
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const createUserQuery = `
      INSERT INTO users (id, email, name, password_hash, plan, auth_provider, created_at, updated_at)
      VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, $6, NOW(), NOW())
      RETURNING id, email, name, plan
    `
    
    const result = await db.query(createUserQuery, [
      userId,
      email,
      name,
      password,
      'free',
      'email'
    ])
    
    const user = result.rows[0]
    
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: '30d' })
    
    logger.info(`✅ User registered successfully (database): ${email}`)
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        plan: user.plan 
      } 
    })
    
  } catch (error) {
    logger.error('Registration failed:', error)
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    })
  }
})

/**
 * POST /api/auth/login-supabase
 * Login with email/password - works with or without Supabase Auth
 */
router.post('/login-supabase', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      })
    }
    
    // Try Supabase Auth first if configured
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (!authError && authData.user) {
          // Get user from our database
          let user = await DatabaseService.getUserById(authData.user.id)
          
          // If user doesn't exist in our table (shouldn't happen, but safety check)
          if (!user) {
            user = await DatabaseService.createUser({
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
              plan: 'free',
              auth_provider: 'supabase'
            })
          }
          
          // Update last login
          await DatabaseService.updateUser(user.id, {
            last_login: new Date().toISOString()
          })
          
          // Generate our custom JWT
          const token = jwt.sign({
            userId: user.id,
            email: user.email,
            name: user.name
          }, process.env.JWT_SECRET, { expiresIn: '30d' })
          
          return res.json({ 
            success: true, 
            token, 
            user: { 
              id: user.id, 
              email: user.email, 
              name: user.name, 
              plan: user.plan,
              avatarUrl: user.avatar_url
            } 
          })
        }
      } catch (supabaseError) {
        logger.warn('Supabase Auth failed, trying database:', supabaseError.message)
        // Fall through to database authentication
      }
    }
    
    // Direct database authentication
    const user = await DatabaseService.getUserByEmail(email)
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }
    
    // Check password if user has a password hash
    if (user.password_hash) {
      // Verify password using PostgreSQL crypt function
      const passwordCheckQuery = `SELECT (password_hash = crypt($1, password_hash)) AS password_match FROM users WHERE id = $2`
      const result = await db.query(passwordCheckQuery, [password, user.id])
      
      if (!result.rows[0]?.password_match) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' })
      }
    } else {
      // User doesn't have a password (probably registered with OAuth)
      return res.status(401).json({ 
        success: false, 
        error: 'This account was created with a different login method. Please use the original method to sign in.' 
      })
    }
    
    // Update last login
    await DatabaseService.updateUser(user.id, {
      last_login: new Date().toISOString()
    })
    
    // Generate our custom JWT
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: '30d' })
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        plan: user.plan || 'free',
        avatarUrl: user.avatar_url
      } 
    })
    
  } catch (error) {
    logger.error('Login failed:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    })
  }
})

/**
 * POST /api/auth/google
 * Initiate Google OAuth with Supabase
 */
router.post('/google', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google login is not configured. Please use GitHub to sign in.' 
      })
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      logger.error('Google OAuth error:', error)
      return res.status(500).json({ 
        success: false, 
        error: 'Google OAuth initialization failed' 
      })
    }
    
    res.json({ 
      success: true, 
      url: data.url 
    })
    
  } catch (error) {
    logger.error('Google OAuth failed:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Google OAuth failed' 
    })
  }
})

/**
 * POST /api/auth/sync-supabase
 * Sync Supabase OAuth user to our database
 */
router.post('/sync-supabase', async (req, res) => {
  try {
    const { supabaseUserId, email, name } = req.body
    
    if (!supabaseUserId || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and email are required' 
      })
    }
    
    let user = await DatabaseService.getUserById(supabaseUserId)
    
    if (!user) {
      user = await DatabaseService.createUser({
        id: supabaseUserId,
        email: email,
        name: name || email.split('@')[0],
        plan: 'free',
        auth_provider: 'supabase'
      })
      logger.info(`✅ New Supabase user synced: ${email}`)
    } else {
      await DatabaseService.updateUser(user.id, {
        last_login: new Date().toISOString()
      })
    }
    
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: '30d' })
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        plan: user.plan,
        avatarUrl: user.avatar_url
      } 
    })
    
  } catch (error) {
    logger.error('Supabase sync failed:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Sync failed' 
    })
  }
})

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    res.json({ success: true, user: { id: 'dev-user-1', email: 'dev@codeanalyst.ai', name: 'Development User', plan: 'free' } })
  } catch (error) {
    logger.error('Get user failed:', error)
    res.status(500).json({ success: false, error: 'Failed to get user' })
  }
})

export default router