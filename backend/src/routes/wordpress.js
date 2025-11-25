import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseService } from '../services/DatabaseService.js'
import { WordPressService } from '../services/WordPressService.js'
import { WordPressPreviewService } from '../services/WordPressPreviewService.js'
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
    res.setHeader('X-Plugin-Version', '1.1.0')
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

    // Fetch and store site info (builders, theme, versions) in background
    // Don't block the response if this fails
    try {
      const wpService = new WordPressService()
      const siteInfo = await wpService.fetchSiteInfo(connection)
      
      // Store site info in database
      await db.query(
        `UPDATE wordpress_connections 
         SET site_info = $1 
         WHERE id = $2`,
        [JSON.stringify(siteInfo), connection.id]
      )
      
      logger.info('✅ Site info fetched and stored', {
        connectionId: connection.id,
        builders: siteInfo.builders
      })
    } catch (siteInfoError) {
      logger.warn('⚠️  Failed to fetch site info (non-critical):', siteInfoError.message)
      // Continue anyway - site info is optional
    }

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
    const formattedConnections = connections.map(conn => {
      // Extract plugin version from site_info if available
      let pluginVersion = null
      if (conn.site_info) {
        try {
          const siteInfo = typeof conn.site_info === 'string' ? JSON.parse(conn.site_info) : conn.site_info
          pluginVersion = siteInfo.plugin_version || null
        } catch (e) {
          logger.warn('Failed to parse site_info for plugin version', { connectionId: conn.id })
        }
      }

      return {
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
        api_key: conn.api_key.substring(0, 8) + '...', // Masked API key
        plugin_version: pluginVersion,
        site_info: conn.site_info
      }
    })

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
 * Fetches directly from WordPress REST API
 */
router.get('/pages/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params
    const userId = req.user.id

    logger.info('📄 Fetching WordPress pages', { connectionId, userId })

    // Verify connection belongs to user
    const connection = await DatabaseService.getWordPressConnectionById(connectionId, userId)

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

    // Fetch pages from WordPress REST API
    const wordpressService = new WordPressService()
    const pagesData = await wordpressService.fetchPages(connection)

    logger.info(`✅ Successfully fetched ${pagesData.pages?.length || 0} pages`)

    res.json({
      success: true,
      pages: pagesData.pages || [],
      total: pagesData.total || 0
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
 * Fetch theme files from connected WordPress site via REST API WITH CONTENT
 */
router.get('/theme-files/:connectionId', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params
    const userId = req.user.id

    logger.info('📁 [WordPress CodeAnalyst] Fetching theme files', { connectionId, userId })

    // Verify connection belongs to user
    const connections = await DatabaseService.getWordPressConnections(userId)
    const connection = connections.find(c => c.id === connectionId)

    if (!connection) {
      logger.error('❌ [WordPress CodeAnalyst] Connection not found', { connectionId, userId })
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    logger.info('🔗 [WordPress CodeAnalyst] Connection verified', {
      site_url: connection.site_url,
      site_name: connection.site_name,
      is_connected: connection.is_connected
    })

    // Check if site is connected
    if (!connection.is_connected) {
      logger.error('❌ [WordPress CodeAnalyst] Site not connected', { connectionId })
      return res.status(400).json({
        success: false,
        error: 'WordPress site is not connected',
        message: 'Please reconnect your WordPress site first'
      })
    }

    // Get optional pageId filter from query params (for context only, not for filtering)
    const { pageId } = req.query
    
    // Fetch theme files list using WordPressService
    const wordpressService = new WordPressService()
    logger.info('📋 [WordPress CodeAnalyst] Fetching file list from WordPress...', { pageId: pageId || 'all' })
    let fileList = await wordpressService.fetchThemeFiles(connection)
    logger.info(`📋 [WordPress CodeAnalyst] Got ${fileList.length} files from WordPress REST API`)
    
    // NO FILTERING: CodeAnalyst needs ALL theme files for comprehensive code analysis
    // The pageId parameter is only used for user context, not for file filtering
    logger.info(`📋 [WordPress CodeAnalyst] Fetching ALL ${fileList.length} theme files (no filtering)`)

    // Fetch content for each file in batches to prevent overwhelming WordPress server
    logger.info(`📄 [WordPress CodeAnalyst] Fetching content for ${fileList.length} theme files...`)
    const BATCH_SIZE = 25
    const BATCH_DELAY_MS = 500 // Wait 500ms between batches
    const totalBatches = Math.ceil(fileList.length / BATCH_SIZE)
    const filesWithContent = []
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE
      const batchEnd = Math.min(batchStart + BATCH_SIZE, fileList.length)
      const batch = fileList.slice(batchStart, batchEnd)
      
      logger.info(`📦 [WordPress CodeAnalyst] Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} files)`)
      
      const batchResults = await Promise.all(
        batch.map(async (file, indexInBatch) => {
          const globalIndex = batchStart + indexInBatch
          try {
            logger.info(`📄 [${globalIndex + 1}/${fileList.length}] Fetching: ${file.path}`)
            const fileData = await wordpressService.fetchThemeFileContent(connection, file.path)
            
            // Decode base64 content
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
            
            logger.debug(`✅ [${globalIndex + 1}/${fileList.length}] Success: ${file.path} (${content.length} chars)`)
            
            return {
              path: file.path,
              content: content,
              size: fileData.size || file.size
            }
          } catch (error) {
            logger.warn(`⚠️ [${globalIndex + 1}/${fileList.length}] Failed: ${file.path} - ${error.message}`)
            // Return file without content if fetch fails
            return {
              path: file.path,
              content: '',
              size: file.size
            }
          }
        })
      )
      
      filesWithContent.push(...batchResults)
      logger.info(`✅ [WordPress CodeAnalyst] Batch ${batchIndex + 1}/${totalBatches} complete (${filesWithContent.filter(f => f.content.length > 0).length} files with content so far)`)
      
      // Wait between batches to avoid overwhelming WordPress server (except for last batch)
      if (batchIndex < totalBatches - 1) {
        logger.debug(`⏱️  [WordPress CodeAnalyst] Waiting ${BATCH_DELAY_MS}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // Filter out empty files
    const validFiles = filesWithContent.filter(f => f.content.length > 0)

    logger.info(`✅ [WordPress CodeAnalyst] Successfully fetched ${validFiles.length}/${fileList.length} theme files with content`)
    
    // Log sample of returned data
    logger.info(`📦 [WordPress CodeAnalyst] Response structure:`, {
      success: true,
      filesCount: validFiles.length,
      sampleFile: validFiles[0] ? {
        path: validFiles[0].path,
        contentLength: validFiles[0].content.length,
        size: validFiles[0].size
      } : null
    })

    res.json({
      success: true,
      files: validFiles,
      total_files: validFiles.length,
      connection: {
        site_url: connection.site_url,
        site_name: connection.site_name
      }
    })

  } catch (error) {
    logger.error('❌ [WordPress CodeAnalyst] Failed to fetch theme files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch theme files',
      message: error.message,
      details: error.response?.data || null
    })
  }
})

/**
 * GET /api/wordpress/page-content/:connectionId/:pageId
 * Fetch content of a specific page from connected WordPress site
 */
router.get('/page-content/:connectionId/:pageId', authMiddleware, async (req, res) => {
  try {
    const { connectionId, pageId } = req.params
    const userId = req.user.id

    logger.info('📄 Fetching page content', { connectionId, pageId, userId })

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

    // Fetch page content using WordPressService
    const wordpressService = new WordPressService()
    const pageContent = await wordpressService.fetchPageContent(connection, pageId)

    logger.info(`✅ Successfully fetched page content: ${pageContent.title}`)

    res.json({
      success: true,
      ...pageContent
    })

  } catch (error) {
    logger.error('Failed to fetch page content:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page content',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/preview
 * Mint a preview URL for WordPress page/post
 */
router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { connectionId, target, builder = 'auto' } = req.body
    const userId = req.user.id

    if (!connectionId || !target) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'connectionId and target are required'
      })
    }

    logger.info('🔍 Minting preview URL', { connectionId, target, builder, userId })

    // Verify connection belongs to user
    const connection = await DatabaseService.getWordPressConnectionById(connectionId, userId)

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

    // Mint preview URL from WordPress plugin
    const { previewUrl, ttl } = await WordPressPreviewService.mintPreviewUrl({
      siteUrl: connection.site_url,
      pluginApiKey: connection.api_key,
      target,
      builder
    })

    logger.info('✅ Preview URL minted successfully', { connectionId, ttl })

    res.json({
      success: true,
      preview_url: previewUrl,
      ttl
    })

  } catch (error) {
    logger.error('Failed to mint preview URL:', error)
    
    // Determine error type
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'Request timeout',
        message: 'WordPress site did not respond in time'
      })
    }

    if (error.message.includes('HTTP')) {
      return res.status(502).json({
        success: false,
        error: 'Upstream error',
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to mint preview URL',
      message: error.message
    })
  }
})

/**
 * POST /api/wordpress/snapshot
 * Generate snapshot of WordPress page/post (stub - TODO: implement with Puppeteer)
 */
router.post('/snapshot', authMiddleware, async (req, res) => {
  try {
    const { connectionId, target } = req.body
    const userId = req.user.id

    if (!connectionId || !target) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'connectionId and target are required'
      })
    }

    logger.info('📸 Snapshot requested (stub)', { connectionId, target, userId })

    // Verify connection belongs to user
    const connection = await DatabaseService.getWordPressConnectionById(connectionId, userId)

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      })
    }

    // TODO: Implement Puppeteer-based snapshot generation
    // 1. Mint preview URL (same as live preview)
    // 2. Use Puppeteer to open preview URL
    // 3. Wait for network idle
    // 4. Take full-page screenshot
    // 5. Store screenshot by revision key
    // 6. Return snapshot URL

    res.json({
      success: true,
      snapshotUrl: null,
      message: 'Snapshot mode coming soon'
    })

  } catch (error) {
    logger.error('Failed to generate snapshot:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate snapshot',
      message: error.message
    })
  }
})

export default router

