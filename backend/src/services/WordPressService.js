// WordPress Service - Handle WordPress ZIP uploads and Elementor data extraction
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import { logger } from '../utils/logger.js'

export class WordPressService {
  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true
    })
  }

  /**
   * Parse WordPress ZIP file
   * @param {Buffer} zipBuffer - ZIP file buffer
   * @returns {Object} - Parsed WordPress data
   */
  async parseWordPressZip(zipBuffer) {
    try {
      logger.info('📦 Parsing WordPress ZIP file...')
      
      const zip = new AdmZip(zipBuffer)
      const zipEntries = zip.getEntries()
      
      const result = {
        themeFiles: [],
        pluginFiles: [],
        elementorFiles: [],
        xmlExport: null,
        sqlDump: null,
        totalFiles: zipEntries.length,
        totalSize: 0
      }

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue
        
        const filePath = entry.entryName
        const fileSize = entry.header.size
        result.totalSize += fileSize
        
        // Skip very large files (> 5MB)
        if (fileSize > 5 * 1024 * 1024) {
          logger.warn(`Skipping large file: ${filePath} (${fileSize} bytes)`)
          continue
        }

        // Detect file type and categorize
        if (filePath.includes('wp-content/themes/')) {
          // Theme files
          if (this.isCodeFile(filePath)) {
            result.themeFiles.push({
              path: filePath,
              content: entry.getData().toString('utf8'),
              size: fileSize,
              type: this.getFileType(filePath)
            })
          }
        } else if (filePath.includes('wp-content/plugins/elementor/')) {
          // Elementor plugin files (for reference)
          if (this.isCodeFile(filePath)) {
            result.elementorFiles.push({
              path: filePath,
              size: fileSize,
              type: this.getFileType(filePath)
            })
          }
        } else if (filePath.includes('wp-content/uploads/elementor/')) {
          // Elementor assets
          result.elementorFiles.push({
            path: filePath,
            size: fileSize,
            type: this.getFileType(filePath)
          })
        } else if (filePath.endsWith('.xml') && !filePath.includes('node_modules')) {
          // WordPress XML export
          try {
            const xmlContent = entry.getData().toString('utf8')
            if (xmlContent.includes('<wp:post_type>') || xmlContent.includes('wordpress')) {
              result.xmlExport = xmlContent
              logger.info(`Found WordPress XML export: ${filePath}`)
            }
          } catch (error) {
            logger.warn(`Failed to read XML file ${filePath}:`, error.message)
          }
        } else if (filePath.endsWith('.sql')) {
          // SQL dump
          try {
            result.sqlDump = entry.getData().toString('utf8')
            logger.info(`Found SQL dump: ${filePath}`)
          } catch (error) {
            logger.warn(`Failed to read SQL file ${filePath}:`, error.message)
          }
        }
      }

      logger.info(`📊 Parsed ZIP: ${result.themeFiles.length} theme files, ${result.elementorFiles.length} Elementor files`)
      
      return result
      
    } catch (error) {
      logger.error('Failed to parse WordPress ZIP:', error)
      throw new Error(`Failed to parse ZIP file: ${error.message}`)
    }
  }

  /**
   * Extract all WordPress pages/posts from XML export
   * Supports: Gutenberg blocks, Classic editor, and Elementor
   * @param {string} xmlContent - WordPress XML export content
   * @returns {Object} - { gutenbergPages, elementorPages, classicPages }
   */
  async extractWordPressPages(xmlContent) {
    try {
      logger.info('🔍 Extracting WordPress pages from XML export...')
      
      const parsed = this.xmlParser.parse(xmlContent)
      
      // Navigate to items/posts
      const channel = parsed.rss?.channel || parsed.channel
      if (!channel) {
        throw new Error('Invalid WordPress XML format: missing channel')
      }

      const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)
      
      const gutenbergPages = []
      const elementorPages = []
      const classicPages = []

      for (const item of items) {
        if (!item) continue
        
        const postId = item['wp:post_id']
        const postTitle = item.title?.['#text'] || item.title || 'Untitled'
        const postType = item['wp:post_type']
        const postContent = item['content:encoded']?.['#text'] || item['content:encoded'] || ''
        const pageUrl = item.link?.['#text'] || item.link || ''
        const lastModified = item['wp:post_modified'] || item.pubDate || null
        const postStatus = item['wp:status']
        
        // Skip drafts, trash, etc.
        if (postStatus !== 'publish') continue
        
        // Check post meta for Elementor
        const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']].filter(Boolean)
        
        let elementorData = null
        let elementorEditMode = false
        
        for (const meta of postMeta) {
          if (!meta) continue
          
          const metaKey = meta['wp:meta_key']?.['#text'] || meta['wp:meta_key']
          const metaValue = meta['wp:meta_value']?.['#text'] || meta['wp:meta_value']
          
          if (metaKey === '_elementor_data' && metaValue) {
            try {
              elementorData = JSON.parse(metaValue)
            } catch (e) {
              logger.warn(`Failed to parse Elementor data for post ${postId}: ${e.message}`)
            }
          }
          
          if (metaKey === '_elementor_edit_mode' && metaValue === 'builder') {
            elementorEditMode = true
          }
        }

        // Categorize by editor type
        if (elementorData && elementorEditMode) {
          // Elementor page
          elementorPages.push({
            postId,
            postTitle,
            postType,
            editorType: 'elementor',
            elementorData,
            pageUrl,
            lastModified
          })
        } else if (postContent.includes('<!-- wp:')) {
          // Gutenberg (Block Editor) page
          const blocks = this.extractGutenbergBlocks(postContent)
          gutenbergPages.push({
            postId,
            postTitle,
            postType,
            editorType: 'gutenberg',
            content: postContent,
            blocks,
            blockCount: blocks.length,
            pageUrl,
            lastModified
          })
        } else if (postContent) {
          // Classic Editor page
          classicPages.push({
            postId,
            postTitle,
            postType,
            editorType: 'classic',
            content: postContent,
            pageUrl,
            lastModified
          })
        }
      }

      logger.info(`✅ Found ${gutenbergPages.length} Gutenberg pages, ${elementorPages.length} Elementor pages, ${classicPages.length} Classic editor pages`)
      
      return {
        gutenbergPages,
        elementorPages,
        classicPages,
        totalPages: gutenbergPages.length + elementorPages.length + classicPages.length
      }
      
    } catch (error) {
      logger.error('Failed to extract WordPress pages:', error)
      throw new Error(`Failed to extract WordPress pages: ${error.message}`)
    }
  }

  /**
   * Extract Gutenberg blocks from post content
   * @param {string} content - Post content with Gutenberg block comments
   * @returns {Array} - Array of block objects
   */
  extractGutenbergBlocks(content) {
    const blocks = []
    
    // Match Gutenberg block comments: <!-- wp:block-name {...} -->
    const blockRegex = /<!-- wp:([^\s]+)(?:\s+(\{[^}]*\}))?\s*(?:\/)?-->/g
    
    let match
    while ((match = blockRegex.exec(content)) !== null) {
      const blockName = match[1]
      const blockAttrs = match[2]
      
      let attributes = {}
      if (blockAttrs) {
        try {
          attributes = JSON.parse(blockAttrs)
        } catch (e) {
          // Invalid JSON in attributes
        }
      }
      
      blocks.push({
        blockName,
        attributes,
        position: match.index
      })
    }
    
    return blocks
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use extractWordPressPages instead
   */
  async extractElementorData(xmlContent) {
    const result = await this.extractWordPressPages(xmlContent)
    return result.elementorPages
  }

  /**
   * Extract Elementor data from SQL dump
   * @param {string} sqlContent - SQL dump content
   * @returns {Array} - Array of Elementor pages
   */
  async extractElementorDataFromSQL(sqlContent) {
    try {
      logger.info('🔍 Extracting Elementor data from SQL dump...')
      
      const elementorPages = []
      
      // Find INSERT statements for wp_postmeta table
      const postmetaInserts = sqlContent.match(/INSERT INTO [`']?wp_postmeta[`']? .*?VALUES\s*\((.*?)\);/gis)
      
      if (!postmetaInserts) {
        logger.warn('No wp_postmeta INSERT statements found in SQL dump')
        return elementorPages
      }

      // Build a map of post_id -> meta_key -> meta_value
      const postMeta = new Map()
      
      for (const insert of postmetaInserts) {
        // Extract values
        const valuesMatch = insert.match(/VALUES\s*\((.*?)\)/is)
        if (!valuesMatch) continue
        
        const values = valuesMatch[1]
        // Parse values (simplified - may need more robust parsing)
        const valueMatches = values.matchAll(/\((\d+),\s*(\d+),\s*'([^']+)',\s*'(.*?)'\)/g)
        
        for (const match of valueMatches) {
          const [, metaId, postId, metaKey, metaValue] = match
          
          if (!postMeta.has(postId)) {
            postMeta.set(postId, new Map())
          }
          
          postMeta.get(postId).set(metaKey, metaValue)
        }
      }

      // Find posts with Elementor data
      for (const [postId, meta] of postMeta.entries()) {
        const elementorDataRaw = meta.get('_elementor_data')
        const elementorEditMode = meta.get('_elementor_edit_mode')
        
        if (elementorDataRaw && elementorEditMode === 'builder') {
          try {
            const elementorData = JSON.parse(elementorDataRaw)
            
            elementorPages.push({
              postId: parseInt(postId),
              postTitle: meta.get('_wp_page_template') || 'Untitled',
              elementorData: elementorData,
              pageUrl: '',
              lastModified: null
            })
          } catch (e) {
            logger.warn(`Failed to parse Elementor data for post ${postId}: ${e.message}`)
          }
        }
      }

      logger.info(`✅ Found ${elementorPages.length} Elementor pages in SQL dump`)
      
      return elementorPages
      
    } catch (error) {
      logger.error('Failed to extract Elementor data from SQL:', error)
      throw new Error(`Failed to extract Elementor data from SQL: ${error.message}`)
    }
  }

  /**
   * Validate Elementor JSON structure
   * @param {Object} elementorData - Elementor data object
   * @returns {boolean} - True if valid
   */
  validateElementorJSON(elementorData) {
    try {
      // Check if it's an array (Elementor data is typically an array of sections)
      if (!Array.isArray(elementorData)) {
        return false
      }

      // Check if elements have expected Elementor structure
      for (const element of elementorData) {
        if (!element.elType || !element.elements) {
          return false
        }
      }

      return true
      
    } catch (error) {
      return false
    }
  }

  /**
   * Check if file is a code file we want to analyze
   */
  isCodeFile(filePath) {
    const codeExtensions = ['.php', '.css', '.js', '.scss', '.sass', '.less', '.jsx', '.ts', '.tsx']
    return codeExtensions.some(ext => filePath.endsWith(ext))
  }

  /**
   * Get file type from path
   */
  getFileType(filePath) {
    const ext = filePath.split('.').pop().toLowerCase()
    return ext || 'unknown'
  }

  /**
   * Store WordPress files in database
   * @param {string} connectionId - WordPress connection ID
   * @param {Array} files - Array of file objects
   * @param {Object} db - Database connection
   */
  async storeWordPressFiles(connectionId, files, db) {
    try {
      logger.info(`💾 Storing ${files.length} WordPress files...`)
      
      for (const file of files) {
        await db.query(`
          INSERT INTO wordpress_files (connection_id, file_path, file_type, file_content, file_size)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (connection_id, file_path) 
          DO UPDATE SET 
            file_content = EXCLUDED.file_content,
            file_size = EXCLUDED.file_size,
            uploaded_at = CURRENT_TIMESTAMP
        `, [connectionId, file.path, file.type, file.content, file.size])
      }

      logger.info(`✅ Stored ${files.length} files successfully`)
      
    } catch (error) {
      logger.error('Failed to store WordPress files:', error)
      throw new Error(`Failed to store files: ${error.message}`)
    }
  }

  /**
   * Store WordPress pages in database (all editor types)
   * @param {string} connectionId - WordPress connection ID
   * @param {Object} pagesData - Object with gutenbergPages, elementorPages, classicPages
   * @param {Object} db - Database connection
   */
  async storeWordPressPages(connectionId, pagesData, db) {
    try {
      const { gutenbergPages = [], elementorPages = [], classicPages = [] } = pagesData
      const totalPages = gutenbergPages.length + elementorPages.length + classicPages.length
      
      logger.info(`💾 Storing ${totalPages} WordPress pages (${gutenbergPages.length} Gutenberg, ${elementorPages.length} Elementor, ${classicPages.length} Classic)...`)
      
      // Store Gutenberg pages
      for (const page of gutenbergPages) {
        await db.query(`
          INSERT INTO wordpress_pages (
            connection_id, post_id, post_title, post_type, editor_type, 
            content, blocks, block_count, page_url, last_modified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (connection_id, post_id) 
          DO UPDATE SET 
            post_title = EXCLUDED.post_title,
            post_type = EXCLUDED.post_type,
            editor_type = EXCLUDED.editor_type,
            content = EXCLUDED.content,
            blocks = EXCLUDED.blocks,
            block_count = EXCLUDED.block_count,
            page_url = EXCLUDED.page_url,
            last_modified = EXCLUDED.last_modified
        `, [
          connectionId,
          page.postId,
          page.postTitle,
          page.postType,
          'gutenberg',
          page.content,
          JSON.stringify(page.blocks),
          page.blockCount,
          page.pageUrl,
          page.lastModified
        ])
      }

      // Store Elementor pages
      for (const page of elementorPages) {
        await db.query(`
          INSERT INTO wordpress_pages (
            connection_id, post_id, post_title, post_type, editor_type, 
            elementor_data, page_url, last_modified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (connection_id, post_id) 
          DO UPDATE SET 
            post_title = EXCLUDED.post_title,
            post_type = EXCLUDED.post_type,
            editor_type = EXCLUDED.editor_type,
            elementor_data = EXCLUDED.elementor_data,
            page_url = EXCLUDED.page_url,
            last_modified = EXCLUDED.last_modified
        `, [
          connectionId,
          page.postId,
          page.postTitle,
          page.postType,
          'elementor',
          JSON.stringify(page.elementorData),
          page.pageUrl,
          page.lastModified
        ])
      }

      // Store Classic editor pages
      for (const page of classicPages) {
        await db.query(`
          INSERT INTO wordpress_pages (
            connection_id, post_id, post_title, post_type, editor_type, 
            content, page_url, last_modified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (connection_id, post_id) 
          DO UPDATE SET 
            post_title = EXCLUDED.post_title,
            post_type = EXCLUDED.post_type,
            editor_type = EXCLUDED.editor_type,
            content = EXCLUDED.content,
            page_url = EXCLUDED.page_url,
            last_modified = EXCLUDED.last_modified
        `, [
          connectionId,
          page.postId,
          page.postTitle,
          page.postType,
          'classic',
          page.content,
          page.pageUrl,
          page.lastModified
        ])
      }

      logger.info(`✅ Stored ${totalPages} WordPress pages successfully`)
      
    } catch (error) {
      logger.error('Failed to store WordPress pages:', error)
      throw new Error(`Failed to store WordPress pages: ${error.message}`)
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use storeWordPressPages instead
   */
  async storeElementorPages(connectionId, pages, db) {
    await this.storeWordPressPages(connectionId, { elementorPages: pages }, db)
  }
}

export default WordPressService

