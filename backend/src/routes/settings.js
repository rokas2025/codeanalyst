import express from 'express'
import crypto from 'crypto'
import { DatabaseService } from '../services/DatabaseService.js'
import { authMiddleware } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

// Encryption settings
const ALGORITHM = 'aes-256-gcm'
const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default-key-change-in-production').digest()

/**
 * Encrypt API key for secure storage
 */
function encryptApiKey(text) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipher(ALGORITHM, KEY)
  cipher.setAAD(Buffer.from('apikey'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt API key for usage
 */
function decryptApiKey(encryptedData) {
  try {
    const decipher = crypto.createDecipher(ALGORITHM, KEY)
    decipher.setAAD(Buffer.from('apikey'))
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    logger.error('Failed to decrypt API key:', error)
    return null
  }
}

/**
 * PUT /api/settings/api-keys
 * Store encrypted API key for user
 */
router.put('/api-keys', authMiddleware, async (req, res) => {
  try {
    const { provider, key } = req.body
    const userId = req.user.id

    // Validate provider
    if (!['openai', 'anthropic', 'google'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider',
        message: 'Provider must be one of: openai, anthropic, google'
      })
    }

    // Validate API key format
    let isValid = false
    switch (provider) {
      case 'openai':
        isValid = key.startsWith('sk-') && key.length > 40
        break
      case 'anthropic':
        isValid = key.startsWith('sk-ant-') && key.length > 40
        break
      case 'google':
        isValid = key.startsWith('AI') && key.length > 30
        break
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format',
        message: `Invalid ${provider} API key format`
      })
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(key)

    // Store in database (this method needs to be implemented in DatabaseService)
    await DatabaseService.setUserApiKey(userId, provider, {
      encrypted_key: JSON.stringify(encryptedKey),
      key_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`,
      is_active: true,
      last_used: null
    })

    logger.info(`API key stored for user ${userId}, provider: ${provider}`)

    res.json({
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key stored successfully`,
      provider,
      masked_key: key.substring(0, 8) + '...'
    })

  } catch (error) {
    logger.error('Failed to store API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to store API key',
      message: error.message
    })
  }
})

/**
 * GET /api/settings/api-keys
 * Get user's configured API keys (masked)
 */
router.get('/api-keys', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user's API keys (this method needs to be implemented)
    const apiKeys = await DatabaseService.getUserApiKeys(userId)

    // Return masked keys for display
    const maskedKeys = {}
    for (const keyData of apiKeys) {
      maskedKeys[keyData.provider] = keyData.encrypted_key ? 
        keyData.encrypted_key.substring(0, 8) + '...' : null
    }

    res.json({
      success: true,
      apiKeys: maskedKeys,
      availableProviders: ['openai', 'anthropic', 'google']
    })

  } catch (error) {
    logger.error('Failed to get API keys:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get API keys',
      message: error.message
    })
  }
})

/**
 * DELETE /api/settings/api-keys/:provider
 * Remove API key for a provider
 */
router.delete('/api-keys/:provider', authMiddleware, async (req, res) => {
  try {
    const { provider } = req.params
    const userId = req.user.id

    if (!['openai', 'anthropic', 'google'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider'
      })
    }

    await DatabaseService.deleteUserApiKey(userId, provider)

    res.json({
      success: true,
      message: `${provider} API key removed successfully`
    })

  } catch (error) {
    logger.error('Failed to delete API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key',
      message: error.message
    })
  }
})

/**
 * Helper function to get decrypted API key for internal use
 * This will be used by AI services to get user's API keys
 */
export async function getUserApiKey(userId, provider) {
  try {
    const keyData = await DatabaseService.getUserApiKey(userId, provider)
    if (!keyData || !keyData.encrypted_key) {
      return null
    }

    const encryptedData = JSON.parse(keyData.encrypted_key)
    return decryptApiKey(encryptedData)
  } catch (error) {
    logger.error(`Failed to get API key for user ${userId}, provider ${provider}:`, error)
    return null
  }
}

export default router
