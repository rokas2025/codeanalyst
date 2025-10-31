// Supabase ZIP Service - Handles ZIP uploads and extraction using Supabase Storage
// This avoids filesystem issues on Railway's ephemeral containers
import JSZip from 'jszip'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

export class SupabaseZipService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.bucketName = 'code-analysis-zips'
    this.maxZipSize = parseInt(process.env.MAX_ZIP_SIZE) || 100 * 1024 * 1024 // 100MB
    this.maxFiles = parseInt(process.env.MAX_ZIP_FILES) || 5000
    
    logger.info('SupabaseZipService initialized', {
      bucketName: this.bucketName,
      maxZipSize: `${this.maxZipSize / 1024 / 1024}MB`,
      maxFiles: this.maxFiles
    })
  }

  /**
   * Ensure the storage bucket exists
   */
  async ensureBucket() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets()
      
      if (error) {
        logger.error('Failed to list buckets:', error)
        throw error
      }

      const bucketExists = buckets.some(b => b.name === this.bucketName)
      
      if (!bucketExists) {
        logger.info(`Creating bucket: ${this.bucketName}`)
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false,
          fileSizeLimit: this.maxZipSize
        })
        
        if (createError) {
          logger.error('Failed to create bucket:', createError)
          throw createError
        }
        
        logger.info(`✅ Bucket created: ${this.bucketName}`)
      }
    } catch (error) {
      logger.warn('Bucket check/creation failed (may already exist):', error.message)
    }
  }

  /**
   * Upload ZIP file to Supabase Storage
   */
  async uploadZip(fileBuffer, analysisId, originalName) {
    try {
      await this.ensureBucket()
      
      const fileName = `${analysisId}/${originalName}`
      
      logger.info(`📤 Uploading ZIP to Supabase`, {
        fileName,
        size: fileBuffer.length
      })
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileBuffer, {
          contentType: 'application/zip',
          upsert: false
        })
      
      if (error) {
        logger.error('Supabase upload failed:', error)
        throw error
      }
      
      logger.info(`✅ ZIP uploaded to Supabase`, { path: data.path })
      
      return {
        path: data.path,
        fullPath: data.fullPath || fileName
      }
    } catch (error) {
      logger.error('Failed to upload ZIP to Supabase:', error)
      throw new Error(`Supabase upload failed: ${error.message}`)
    }
  }

  /**
   * Download and extract ZIP from Supabase Storage (in-memory)
   */
  async extractZipFromSupabase(storagePath, analysisId, originalName) {
    try {
      logger.info(`📥 Downloading ZIP from Supabase`, { storagePath, analysisId })
      
      // Download the file
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(storagePath)
      
      if (error) {
        logger.error('Supabase download failed:', error)
        throw error
      }
      
      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer()
      const zipBuffer = Buffer.from(arrayBuffer)
      
      logger.info(`📦 Extracting ZIP in memory`, {
        size: zipBuffer.length,
        originalName
      })
      
      // Extract ZIP in memory
      const zip = new JSZip()
      const zipContents = await zip.loadAsync(zipBuffer)
      
      const extractedFiles = []
      const fileContents = {} // Store file contents in memory
      const fileEntries = Object.keys(zipContents.files)
      
      if (fileEntries.length > this.maxFiles) {
        throw new Error(`Too many files in ZIP: ${fileEntries.length} (max: ${this.maxFiles})`)
      }
      
      // Extract files to memory
      for (const filename of fileEntries) {
        const zipEntry = zipContents.files[filename]
        
        if (!zipEntry.dir && !this.shouldSkipFile(filename)) {
          try {
            const content = await zipEntry.async('text')
            const lines = content.split('\n').length
            const extension = path.extname(filename).toLowerCase()
            
            // Store in memory
            fileContents[filename] = content
            
            extractedFiles.push({
              path: filename,
              name: path.basename(filename),
              size: content.length,
              lines: lines,
              extension: extension,
              language: this.detectLanguage(extension),
              content // Include content for in-memory processing
            })
          } catch (error) {
            // Skip binary files
            logger.warn(`Skipping binary/corrupt file: ${filename}`)
          }
        }
      }
      
      logger.info(`✅ ZIP extracted in memory`, {
        totalFiles: extractedFiles.length,
        analysisId
      })
      
      // Get project statistics
      const stats = this.getProjectStatsFromMemory(extractedFiles)
      
      return {
        extractedFiles,
        fileContents,
        stats,
        originalName,
        success: true,
        inMemory: true // Flag to indicate this is in-memory extraction
      }
    } catch (error) {
      logger.error('ZIP extraction from Supabase failed:', error)
      throw new Error(`ZIP extraction failed: ${error.message}`)
    }
  }

  /**
   * Clean up ZIP file from Supabase Storage
   */
  async cleanupZip(storagePath) {
    try {
      logger.info(`🗑️ Cleaning up ZIP from Supabase`, { storagePath })
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath])
      
      if (error) {
        logger.warn('Failed to cleanup ZIP:', error)
      } else {
        logger.info(`✅ ZIP cleaned up from Supabase`)
      }
    } catch (error) {
      logger.warn('ZIP cleanup failed:', error.message)
    }
  }

  /**
   * Validate ZIP file
   */
  async validateZipFile(fileBuffer, originalName) {
    try {
      // Check file size
      if (fileBuffer.length > this.maxZipSize) {
        throw new Error(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB (max: ${this.maxZipSize / 1024 / 1024}MB)`)
      }

      // Try to load as ZIP
      const zip = new JSZip()
      await zip.loadAsync(fileBuffer)

      const fileCount = Object.keys(zip.files).length
      if (fileCount === 0) {
        throw new Error('ZIP file is empty')
      }

      if (fileCount > this.maxFiles) {
        throw new Error(`Too many files: ${fileCount} (max: ${this.maxFiles})`)
      }

      logger.info('✅ ZIP validation passed', {
        filename: originalName,
        size: fileBuffer.length,
        fileCount
      })

      return {
        filename: originalName,
        size: fileBuffer.length,
        fileCount,
        valid: true
      }
    } catch (error) {
      logger.error('ZIP validation failed:', error)
      throw error
    }
  }

  /**
   * Check if file should be skipped
   */
  shouldSkipFile(filename) {
    const skipPatterns = [
      /node_modules\//,
      /\.git\//,
      /\.next\//,
      /dist\//,
      /build\//,
      /coverage\//,
      /\.DS_Store$/,
      /Thumbs\.db$/,
      /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i
    ]

    return skipPatterns.some(pattern => pattern.test(filename))
  }

  /**
   * Get project statistics from in-memory files
   */
  getProjectStatsFromMemory(extractedFiles) {
    try {
      const stats = {
        totalFiles: extractedFiles.length,
        totalLines: 0,
        languages: {},
        fileTypes: {},
        largestFiles: []
      }

      for (const file of extractedFiles) {
        // Count lines
        if (file.content) {
          const lines = file.content.split('\n').length
          stats.totalLines += lines
        }

        // Count file types
        const ext = file.extension || 'unknown'
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1

        // Detect languages
        const language = this.detectLanguage(file.extension)
        if (language) {
          stats.languages[language] = (stats.languages[language] || 0) + 1
        }
      }

      // Get largest files
      stats.largestFiles = extractedFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(f => ({
          path: f.path,
          size: f.size
        }))

      return stats
    } catch (error) {
      logger.error('Failed to get project stats:', error)
      return {
        totalFiles: extractedFiles.length,
        totalLines: 0,
        languages: {},
        fileTypes: {}
      }
    }
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(extension) {
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash'
    }

    return languageMap[extension?.toLowerCase()] || null
  }
}

