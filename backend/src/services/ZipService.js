// ZIP Service - Extract and analyze ZIP file uploads
import JSZip from 'jszip'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger.js'

export class ZipService {
  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp'
    this.maxZipSize = parseInt(process.env.MAX_ZIP_SIZE) || 100 * 1024 * 1024 // 100MB
    this.maxFiles = parseInt(process.env.MAX_ZIP_FILES) || 5000
  }

  /**
   * Validate ZIP file
   */
  async validateZipFile(filePath, originalName) {
    try {
      const stats = await fs.stat(filePath)
      
      if (stats.size > this.maxZipSize) {
        throw new Error(`ZIP file too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max: ${this.maxZipSize / 1024 / 1024}MB)`)
      }
      
      if (!originalName.toLowerCase().endsWith('.zip')) {
        throw new Error('File must be a ZIP archive')
      }
      
      return {
        size: stats.size,
        valid: true
      }
    } catch (error) {
      logger.error('ZIP validation failed:', error)
      throw error
    }
  }

  /**
   * Extract ZIP file to temporary directory
   */
  async extractZipFile(filePath, analysisId, originalName) {
    try {
      await this.validateZipFile(filePath, originalName)
      
      const zipBuffer = await fs.readFile(filePath)
      const zip = new JSZip()
      
      logger.info(`📦 Extracting ZIP file: ${originalName}`, {
        analysisId,
        size: zipBuffer.length
      })
      
      const zipContents = await zip.loadAsync(zipBuffer)
      const extractPath = path.join(this.tempDir, `codeanalyst-zip-${analysisId}`)
      
      // Create extraction directory
      await fs.mkdir(extractPath, { recursive: true })
      
      const extractedFiles = []
      const fileEntries = Object.keys(zipContents.files)
      
      if (fileEntries.length > this.maxFiles) {
        throw new Error(`Too many files in ZIP: ${fileEntries.length} (max: ${this.maxFiles})`)
      }
      
      // Extract files
      for (const filename of fileEntries) {
        const zipEntry = zipContents.files[filename]
        
        if (!zipEntry.dir && !this.shouldSkipFile(filename)) {
          try {
            const content = await zipEntry.async('text')
            const extractedFilePath = path.join(extractPath, filename)
            
            // Create directory structure
            const dirPath = path.dirname(extractedFilePath)
            await fs.mkdir(dirPath, { recursive: true })
            
            // Write file
            await fs.writeFile(extractedFilePath, content)
            
            extractedFiles.push({
              path: filename,
              name: path.basename(filename),
              size: content.length,
              extension: path.extname(filename).toLowerCase()
            })
          } catch (error) {
            // Skip files that can't be extracted as text
            logger.warn(`Skipping binary/corrupt file: ${filename}`)
          }
        }
      }
      
      // Get project statistics
      const stats = await this.getProjectStats(extractPath, extractedFiles)
      
      return {
        extractPath,
        extractedFiles,
        stats,
        originalName,
        success: true
      }
    } catch (error) {
      logger.error('ZIP extraction failed:', error, { analysisId, originalName })
      throw new Error(`ZIP extraction failed: ${error.message}`)
    }
  }

  /**
   * Get project statistics from extracted files
   */
  async getProjectStats(extractPath, extractedFiles) {
    try {
      const stats = {
        totalFiles: extractedFiles.length,
        totalLines: 0,
        languages: {},
        directories: new Set(),
        largestFile: { name: '', size: 0 },
        fileTypes: {},
        projectType: 'unknown',
        frameworks: []
      }
      
      // Analyze each file
      for (const file of extractedFiles) {
        // Track directories
        const dir = path.dirname(file.path)
        if (dir !== '.') {
          stats.directories.add(dir)
        }
        
        // Track largest file
        if (file.size > stats.largestFile.size) {
          stats.largestFile = {
            name: file.path,
            size: file.size
          }
        }
        
        // Track file types
        const ext = file.extension
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1
        
        // Count lines and languages for text files
        if (this.isTextFile(ext)) {
          try {
            const filePath = path.join(extractPath, file.path)
            const content = await fs.readFile(filePath, 'utf-8')
            const lines = content.split('\n').length
            stats.totalLines += lines
            
            // Track languages
            const language = this.getLanguageFromExtension(ext)
            if (language) {
              stats.languages[language] = (stats.languages[language] || 0) + lines
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
      
      // Convert directories set to count
      stats.directories = stats.directories.size
      
      // Detect project type and frameworks
      stats.projectType = this.detectProjectType(extractedFiles)
      stats.frameworks = this.detectFrameworks(extractedFiles)
      
      return stats
    } catch (error) {
      logger.error('Failed to get project stats:', error)
      throw error
    }
  }

  /**
   * Detect project type from files
   */
  detectProjectType(files) {
    const fileNames = files.map(f => f.name.toLowerCase())
    const paths = files.map(f => f.path.toLowerCase())
    
    // Check for specific project files
    if (fileNames.includes('package.json')) return 'Node.js'
    if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py')) return 'Python'
    if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) return 'Java'
    if (fileNames.includes('composer.json')) return 'PHP'
    if (fileNames.includes('gemfile')) return 'Ruby'
    if (fileNames.includes('go.mod')) return 'Go'
    if (fileNames.includes('cargo.toml')) return 'Rust'
    if (fileNames.includes('pubspec.yaml')) return 'Dart/Flutter'
    if (fileNames.includes('project.clj')) return 'Clojure'
    if (fileNames.includes('mix.exs')) return 'Elixir'
    
    // Check for framework-specific files
    if (paths.some(p => p.includes('app.module.ts') || p.includes('angular.json'))) return 'Angular'
    if (paths.some(p => p.includes('src/app.js') || p.includes('src/app.tsx'))) return 'React'
    if (paths.some(p => p.includes('nuxt.config') || p.includes('vue.config'))) return 'Vue.js'
    if (fileNames.includes('svelte.config.js')) return 'Svelte'
    
    // Check for web projects
    if (fileNames.includes('index.html')) return 'Web'
    if (fileNames.includes('dockerfile')) return 'Docker'
    
    return 'Unknown'
  }

  /**
   * Detect frameworks from files
   */
  detectFrameworks(files) {
    const frameworks = []
    const fileNames = files.map(f => f.name.toLowerCase())
    const paths = files.map(f => f.path.toLowerCase())
    
    // Frontend frameworks
    if (paths.some(p => p.includes('react') || p.includes('jsx'))) frameworks.push('React')
    if (paths.some(p => p.includes('vue') || p.includes('.vue'))) frameworks.push('Vue.js')
    if (paths.some(p => p.includes('angular') || p.includes('.component.ts'))) frameworks.push('Angular')
    if (paths.some(p => p.includes('svelte'))) frameworks.push('Svelte')
    if (fileNames.includes('next.config.js')) frameworks.push('Next.js')
    if (fileNames.includes('nuxt.config.js')) frameworks.push('Nuxt.js')
    
    // Backend frameworks
    if (fileNames.includes('package.json')) {
      // Would need to read package.json to detect Express, Fastify, etc.
      frameworks.push('Node.js')
    }
    if (paths.some(p => p.includes('django') || p.includes('manage.py'))) frameworks.push('Django')
    if (paths.some(p => p.includes('flask'))) frameworks.push('Flask')
    if (paths.some(p => p.includes('rails'))) frameworks.push('Ruby on Rails')
    if (paths.some(p => p.includes('laravel'))) frameworks.push('Laravel')
    if (paths.some(p => p.includes('spring'))) frameworks.push('Spring')
    
    // CSS frameworks
    if (paths.some(p => p.includes('bootstrap'))) frameworks.push('Bootstrap')
    if (paths.some(p => p.includes('tailwind'))) frameworks.push('Tailwind CSS')
    if (paths.some(p => p.includes('material'))) frameworks.push('Material UI')
    
    // Testing frameworks
    if (paths.some(p => p.includes('jest') || p.includes('.test.') || p.includes('.spec.'))) frameworks.push('Jest')
    if (paths.some(p => p.includes('cypress'))) frameworks.push('Cypress')
    if (paths.some(p => p.includes('mocha'))) frameworks.push('Mocha')
    
    return [...new Set(frameworks)] // Remove duplicates
  }

  /**
   * Check if file should be skipped during extraction
   */
  shouldSkipFile(filename) {
    const skipPatterns = [
      '__MACOSX/',
      '.DS_Store',
      'Thumbs.db',
      '.git/',
      'node_modules/',
      '.npm/',
      '.yarn/',
      'bower_components/',
      'vendor/',
      '__pycache__/',
      '.pytest_cache/',
      'venv/',
      'env/',
      'build/',
      'dist/',
      'target/',
      '.gradle/',
      '.mvn/',
      'coverage/',
      '.nyc_output/',
      '.sass-cache/'
    ]
    
    return skipPatterns.some(pattern => filename.includes(pattern))
  }

  /**
   * Check if file is a text file
   */
  isTextFile(extension) {
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
      '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
      '.md', '.txt', '.rst', '.tex', '.sql', '.sh', '.bash', '.zsh', '.fish',
      '.dockerfile', '.makefile', '.gradle', '.maven', '.sbt', '.lock'
    ]
    
    return textExtensions.includes(extension)
  }

  /**
   * Get programming language from file extension
   */
  getLanguageFromExtension(extension) {
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C',
      '.hpp': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Shell',
      '.zsh': 'Shell',
      '.fish': 'Shell'
    }
    
    return languageMap[extension]
  }

  /**
   * Get files for analysis
   */
  async getAnalysisFiles(extractPath, maxFiles = 1000) {
    try {
      const files = []
      await this.collectAnalysisFiles(extractPath, files, maxFiles)
      
      return files.slice(0, maxFiles)
    } catch (error) {
      logger.error('Failed to get analysis files:', error)
      throw error
    }
  }

  /**
   * Collect files for analysis
   */
  async collectAnalysisFiles(dirPath, files, maxFiles, basePath = '') {
    if (files.length >= maxFiles) return
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (files.length >= maxFiles) break
        
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.join(basePath, entry.name)
        
        if (entry.isDirectory()) {
          await this.collectAnalysisFiles(fullPath, files, maxFiles, relativePath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          
          if (this.isTextFile(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8')
              const stat = await fs.stat(fullPath)
              
              files.push({
                path: relativePath,
                name: entry.name,
                extension: ext,
                size: stat.size,
                content: content.slice(0, 100000), // Limit content to 100KB
                lines: content.split('\n').length,
                language: this.getLanguageFromExtension(ext)
              })
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error collecting analysis files:', error)
    }
  }

  /**
   * Clean up extracted files
   */
  async cleanup(extractPath) {
    try {
      if (extractPath && await fs.access(extractPath).then(() => true).catch(() => false)) {
        await fs.rm(extractPath, { recursive: true, force: true })
        logger.info(`🧹 Cleaned up extracted files: ${extractPath}`)
      }
    } catch (error) {
      logger.error('Failed to cleanup extracted files:', error)
    }
  }

  /**
   * Get ZIP file information without extracting
   */
  async getZipInfo(filePath) {
    try {
      const zipBuffer = await fs.readFile(filePath)
      const zip = new JSZip()
      const zipContents = await zip.loadAsync(zipBuffer)
      
      const files = Object.keys(zipContents.files)
      const fileCount = files.filter(name => !zipContents.files[name].dir).length
      const dirCount = files.filter(name => zipContents.files[name].dir).length
      
      return {
        totalFiles: fileCount,
        totalDirectories: dirCount,
        size: zipBuffer.length,
        valid: true
      }
    } catch (error) {
      throw new Error(`Invalid ZIP file: ${error.message}`)
    }
  }
}

export default ZipService 