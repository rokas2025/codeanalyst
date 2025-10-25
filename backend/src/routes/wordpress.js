import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseService } from '../services/DatabaseService.js'
import { WordPressService } from '../services/WordPressService.js'
import { authMiddleware } from '../middleware/auth.js'
import { db } from '../database/connection.js'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
      cb(null, true)
    } else {
      cb(new Error('Only ZIP files are allowed'))
    }
  }
})

/**
 * GET /api/wordpress/plugin/download
 * Download WordPress plugin ZIP file
 */
router.get('/plugin/download', authMiddleware, async (req, res) => {
  try {
    logger.info('📥 Plugin download requested', { userId: req.user.id })
    
    const fs = await import('fs')
    
    // Try multiple possible paths for the ZIP file
    const possiblePaths = [
      path.join(__dirname, '../../../codeanalyst-connector.zip'), // Project root (development)
      path.join(__dirname, '../../codeanalyst-connector.zip'),    // Backend parent directory
      path.join(process.cwd(), 'codeanalyst-connector.zip'),      // Current working directory (Railway)
      path.join(process.cwd(), 'backend/codeanalyst-connector.zip') // Backend subdirectory
    ]
    
    let zipPath = null
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        zipPath = testPath
        logger.info('✅ Found plugin ZIP at:', { zipPath })
        break
      }
    }
    
    if (!zipPath) {
      logger.error('❌ Plugin ZIP file not found in any location', { 
        tried: possiblePaths,
        cwd: process.cwd(),
        __dirname 
      })
      return res.status(404).json({
        success: false,
        error: 'Plugin file not found. Please contact support.',
        details: 'ZIP file not found on server'
      })
    }
    
    // Add cache-busting headers to prevent serving old cached versions
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('X-Plugin-Version', '1.0.0')
    res.setHeader('X-Build-Time', new Date().toISOString())
    
    // Send file for download
    res.download(zipPath, 'codeanalyst-connector.zip', (err) => {
      if (err) {
        logger.error('Error sending plugin file', { error: err.message })
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download plugin'
          })
        }
      } else {
        logger.info('✅ Plugin downloaded successfully', { userId: req.user.id })
      }
    })
  } catch (error) {
    logger.error('Plugin download error', { error: error.message, stack: error.stack })
    res.status(500).json({
      success: false,
      error: 'Failed to download plugin',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/generate-key
 * Generate new WordPress API key for user
 */
router.post('/generate-key', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    logger.info('🔑 Generating WordPress API key', { userId })

    // Generate the API key
    const apiKey = await DatabaseService.generateWordPressApiKey(userId)

    // Create a pending connection record with the API key
    // This will be updated when the WordPress site connects
    await DatabaseService.createWordPressConnection(userId, apiKey, {
      site_url: 'pending',
      site_name: 'Pending Connection',
      wordpress_version: null,
      active_theme: null,
      active_plugins: null,
      site_health: null,
      php_version: null
    })

    res.json({
      success: true,
      apiKey,
      message: 'WordPress API key generated successfully'
    })

  } catch (error) {
    logger.error('Failed to generate WordPress API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/connect
 * WordPress plugin calls this to establish connection
 * No auth middleware - uses API key instead
 */
router.post('/connect', async (req, res) => {
  try {
    const {
      api_key,
      site_url,
      site_name,
      wordpress_version,
      active_theme,
      active_plugins,
      site_health,
      php_version
    } = req.body

    if (!api_key || !site_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'api_key and site_url are required'
      })
    }

    logger.info('🔌 WordPress site attempting to connect', {
      site_url,
      apiKey: api_key.substring(0, 8) + '...'
    })

    // Check if this is an existing connection (update) or new connection
    const existingConnection = await DatabaseService.verifyWordPressApiKey(api_key)

    let connection
    if (existingConnection) {
      // Update existing connection
      logger.info('🔄 Updating existing WordPress connection', {
        connectionId: existingConnection.id
      })

      connection = await DatabaseService.updateWordPressConnection(api_key, {
        site_url,
        site_name,
        wordpress_version,
        active_theme,
        active_plugins,
        site_health,
        php_version
      })
    } else {
      // This shouldn't happen - API key should be generated first
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'API key not found. Please generate a new key from CodeAnalyst settings.'
      })
    }

    logger.info('✅ WordPress connection established', {
      connectionId: connection.id,
      site_url
    })

    res.json({
      success: true,
      connection: {
        id: connection.id,
        site_url: connection.site_url,
        connected_at: connection.updated_at
      },
      message: 'Successfully connected to CodeAnalyst'
    })

  } catch (error) {
    logger.error('Failed to connect WordPress site:', error)
    res.status(500).json({
      success: false,
      error: 'Connection failed',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/initialize
 * Initialize connection with API key (creates the connection record)
 */
router.post('/initialize', async (req, res) => {
  try {
    const {
      api_key,
      site_url,
      site_name,
      wordpress_version,
      active_theme,
      active_plugins,
      site_health,
      php_version
    } = req.body

    if (!api_key || !site_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'api_key and site_url are required'
      })
    }

    logger.info('🆕 Initializing WordPress connection', {
      site_url,
      apiKey: api_key.substring(0, 8) + '...'
    })

    // Verify the API key exists and get the user_id
    // We need to check if this API key was generated but not yet used
    // For now, we'll extract user_id from a separate table or require it in request
    // Better approach: Store pending API keys in a separate table

    // For simplicity, we'll accept user_id in the request for initialization
    // In production, you'd want a more secure flow

    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Please use the connect endpoint after generating an API key'
    })

  } catch (error) {
    logger.error('Failed to initialize WordPress connection:', error)
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    })
  }
})

/**
 * GET /api/wordpress/connections
 * Get all WordPress connections for authenticated user
 */
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    logger.info('📋 Fetching WordPress connections', { userId })

    const connections = await DatabaseService.getWordPressConnections(userId)

    // Format the response to hide sensitive data
    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      site_url: conn.site_url,
      site_name: conn.site_name,
      wordpress_version: conn.wordpress_version,
      active_theme: conn.active_theme,
      active_plugins: conn.active_plugins,
      site_health: conn.site_health,
      php_version: conn.php_version,
      is_connected: conn.is_connected,
      last_sync: conn.last_sync,
      created_at: conn.created_at,
      api_key: conn.api_key.substring(0, 8) + '...' // Masked API key
    }))

    res.json({
      success: true,
      connections: formattedConnections,
      count: formattedConnections.length
    })

  } catch (error) {
    logger.error('Failed to fetch WordPress connections:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connections',
      message: error.message
    })
  }
})

/**
 * DELETE /api/wordpress/connections/:id
 * Remove WordPress connection
 */
router.delete('/connections/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const connectionId = req.params.id

    logger.info('🗑️ Deleting WordPress connection', { userId, connectionId })

    const deleted = await DatabaseService.deleteWordPressConnection(connectionId, userId)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
        message: 'WordPress connection not found or already deleted'
      })
    }

    logger.info('✅ WordPress connection deleted', { connectionId })

    res.json({
      success: true,
      message: 'WordPress connection removed successfully'
    })

  } catch (error) {
    logger.error('Failed to delete WordPress connection:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete connection',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/files/read
 * Read files from WordPress site (future implementation)
 */
router.post('/files/read', async (req, res) => {
  try {
    const { api_key, file_path } = req.body

    if (!api_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing API key',
        message: 'api_key is required'
      })
    }

    // Verify API key
    const connection = await DatabaseService.verifyWordPressApiKey(api_key)

    if (!connection) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'API key not found or inactive'
      })
    }

    // TODO: Implement file reading logic
    // This will require the WordPress plugin to send file contents

    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'File reading will be implemented in a future update'
    })

  } catch (error) {
    logger.error('Failed to read WordPress files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to read files',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/upload-zip
 * Upload WordPress ZIP file with theme files and Elementor data
 */
router.post('/upload-zip/:connectionId', authMiddleware, upload.single('zipFile'), async (req, res) => {
  try {
    const { connectionId } = req.params
    const userId = req.user.id

    logger.info('📦 WordPress ZIP upload initiated', { userId, connectionId })

    // Verify connection belongs to user
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
        message: 'WordPress connection not found or does not belong to you'
      })
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a ZIP file'
      })
    }

    logger.info(`📦 Processing ZIP file: ${req.file.originalname} (${req.file.size} bytes)`)

    // Parse the ZIP file
    const wpService = new WordPressService()
    const zipData = await wpService.parseWordPressZip(req.file.buffer)

    // Store theme files
    if (zipData.themeFiles.length > 0) {
      await wpService.storeWordPressFiles(connectionId, zipData.themeFiles, db)
    }

    // Extract and store WordPress pages (all editor types)
    let pagesData = {
      gutenbergPages: [],
      elementorPages: [],
      classicPages: [],
      totalPages: 0
    }
    
    if (zipData.xmlExport) {
      logger.info('📄 Found WordPress XML export, extracting pages...')
      pagesData = await wpService.extractWordPressPages(zipData.xmlExport)
    } else if (zipData.sqlDump) {
      logger.info('📄 Found SQL dump, extracting Elementor data...')
      const elementorPages = await wpService.extractElementorDataFromSQL(zipData.sqlDump)
      pagesData = { gutenbergPages: [], elementorPages, classicPages: [], totalPages: elementorPages.length }
    }

    if (pagesData.totalPages > 0) {
      await wpService.storeWordPressPages(connectionId, pagesData, db)
    }

    // Return summary
    res.json({
      success: true,
      message: 'WordPress ZIP uploaded successfully',
      data: {
        themeFiles: zipData.themeFiles.length,
        elementorFiles: zipData.elementorFiles.length,
        gutenbergPages: pagesData.gutenbergPages.length,
        elementorPages: pagesData.elementorPages.length,
        classicPages: pagesData.classicPages.length,
        totalPages: pagesData.totalPages,
        totalFiles: zipData.totalFiles,
        totalSize: zipData.totalSize
      }
    })

  } catch (error) {
    logger.error('Failed to upload WordPress ZIP:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload ZIP',
      message: error.message
    })
  }
})

/**
 * GET /api/wordpress/files/:connectionId
 * Get uploaded WordPress files for a connection
 */
router.get('/files/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params
    const userId = req.user.id

    // Verify connection belongs to user
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    // Get files from database
    const result = await db.query(`
      SELECT id, file_path, file_type, file_size, uploaded_at
      FROM wordpress_files
      WHERE connection_id = $1
      ORDER BY file_path
    `, [connectionId])

    res.json({
      success: true,
      files: result.rows
    })

  } catch (error) {
    logger.error('Failed to get WordPress files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
      message: error.message
    })
  }
})

/**
 * GET /api/wordpress/pages/:connectionId
 * Get all WordPress pages for a connection (Gutenberg, Elementor, Classic)
 */
router.get('/pages/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params
    const { editorType } = req.query // Optional filter
    const userId = req.user.id

    // Verify connection belongs to user
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    // Get pages from database with optional filter
    let query = `
      SELECT id, post_id, post_title, post_type, editor_type, 
             content, elementor_data, blocks, block_count, 
             page_url, last_modified, created_at
      FROM wordpress_pages
      WHERE connection_id = $1
    `
    const params = [connectionId]

    if (editorType && ['gutenberg', 'elementor', 'classic'].includes(editorType)) {
      query += ` AND editor_type = $2`
      params.push(editorType)
    }

    query += ` ORDER BY post_id`

    const result = await db.query(query, params)

    // Group by editor type for summary
    const summary = {
      gutenberg: result.rows.filter(p => p.editor_type === 'gutenberg').length,
      elementor: result.rows.filter(p => p.editor_type === 'elementor').length,
      classic: result.rows.filter(p => p.editor_type === 'classic').length,
      total: result.rows.length
    }

    res.json({
      success: true,
      pages: result.rows,
      summary
    })

  } catch (error) {
    logger.error('Failed to get WordPress pages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get pages',
      message: error.message
    })
  }
})

/**
 * GET /api/wordpress/elementor-pages/:connectionId
 * Legacy endpoint for backward compatibility
 * @deprecated Use /api/wordpress/pages/:connectionId?editorType=elementor instead
 */
router.get('/elementor-pages/:connectionId', authMiddleware, async (req, res) => {
  // Redirect to the new endpoint with editorType filter
  const { connectionId } = req.params
  req.url = `/pages/${connectionId}?editorType=elementor`
  req.query.editorType = 'elementor'
  
  // Forward to the main pages handler
  try {
    const userId = req.user.id
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    const query = `
      SELECT id, post_id, post_title, post_type, editor_type, 
             content, elementor_data, blocks, block_count, 
             page_url, last_modified, created_at
      FROM wordpress_pages
      WHERE connection_id = $1 AND editor_type = $2
      ORDER BY post_id
    `
    
    const result = await db.query(query, [connectionId, 'elementor'])

    const summary = {
      gutenberg: 0,
      elementor: result.rows.length,
      classic: 0,
      total: result.rows.length
    }

    res.json({
      success: true,
      pages: result.rows,
      summary
    })

  } catch (error) {
    logger.error('Failed to get Elementor pages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get pages',
      message: error.message
    })
  }
})

/**
 * GET /api/wordpress/theme-files/:connectionId
 * Fetch theme files from connected WordPress site via REST API
 */
router.get('/theme-files/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params
    const userId = req.user.id

    logger.info('📁 Fetching theme files for connection', { connectionId, userId })

    // Verify connection belongs to user
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    // Check if site is connected
    if (!connection.is_connected) {
      return res.status(400).json({
        success: false,
        error: 'WordPress site is not connected',
        message: 'Please reconnect your WordPress site first'
      })
    }

    // Fetch theme files using WordPressService
    const wordpressService = new WordPressService()
    const files = await wordpressService.fetchThemeFiles(connection)

    logger.info(`✅ Successfully fetched ${files.length} theme files`)

    res.json({
      success: true,
      files,
      total_files: files.length,
      connection: {
        site_url: connection.site_url,
        site_name: connection.site_name
      }
    })

  } catch (error) {
    logger.error('Failed to fetch theme files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch theme files',
      message: error.message,
      details: error.response?.data || null
    })
  }
})

export default router

