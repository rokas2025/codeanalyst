// PHPStan Service - PHP Static Analysis
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import { createWriteStream, unlink as unlinkSync } from 'fs'
import path from 'path'
import https from 'https'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

export class PHPStanService {
  constructor() {
    this.pharUrl = 'https://github.com/phpstan/phpstan/releases/latest/download/phpstan.phar'
    this.pharPath = path.join(process.cwd(), 'temp', 'phpstan.phar')
    this.phpPath = process.env.PHP_PATH || 'php'
    this.analysisLevel = parseInt(process.env.PHPSTAN_LEVEL) || 5 // 0-9
    this.memoryLimit = process.env.PHPSTAN_MEMORY_LIMIT || '512M'
    this.timeout = 120000 // 2 minutes
  }

  /**
   * Analyze PHP files for quality and type issues
   * @param {Array} files - Array of PHP file objects
   * @param {string} projectPath - Path to project directory (optional)
   * @returns {Object} - PHP static analysis results
   */
  async analyzeCode(files, projectPath = null) {
    try {
      logger.info(`🔍 Starting PHPStan analysis for ${files.length} files`)

      // Filter PHP files
      const phpFiles = files.filter(f => {
        const ext = f.extension || (f.path ? path.extname(f.path).toLowerCase() : '')
        return ext === '.php'
      })

      if (phpFiles.length === 0) {
        logger.info('No PHP files found for analysis')
        return this.getEmptyResult()
      }

      logger.info(`Found ${phpFiles.length} PHP files for analysis`)

      // Check if PHP is available
      const phpAvailable = await this.checkPHPAvailable()
      if (!phpAvailable) {
        logger.warn('PHP not available, skipping PHPStan analysis')
        return this.getErrorResult('PHP not available on this system')
      }

      // Ensure PHPStan PHAR is available
      await this.ensurePHPStanPhar()

      // Create temporary directory for analysis
      const tempDir = await this.createTempDirectory(phpFiles)

      try {
        // Run PHPStan analysis
        const analysisResult = await this.runPHPStan(tempDir)

        // Clean up
        await this.cleanupTempDirectory(tempDir)

        // Format results
        const formatted = this.formatResults(analysisResult, phpFiles.length)

        logger.info(`✅ PHPStan analysis complete: ${formatted.totalErrors} errors found`)

        return formatted

      } catch (error) {
        // Clean up on error
        await this.cleanupTempDirectory(tempDir)
        throw error
      }

    } catch (error) {
      logger.error('PHPStan analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Check if PHP is available
   */
  async checkPHPAvailable() {
    try {
      await execAsync(`${this.phpPath} --version`, { timeout: 5000 })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Ensure PHPStan PHAR file is downloaded
   */
  async ensurePHPStanPhar() {
    try {
      // Check if PHAR already exists
      try {
        await fs.access(this.pharPath)
        logger.info('PHPStan PHAR already exists')
        return
      } catch {
        // File doesn't exist, download it
      }

      logger.info('Downloading PHPStan PHAR...')

      // Create temp directory if it doesn't exist
      const tempDir = path.dirname(this.pharPath)
      await fs.mkdir(tempDir, { recursive: true })

      // Download PHAR file
      await this.downloadFile(this.pharUrl, this.pharPath)

      logger.info('✅ PHPStan PHAR downloaded successfully')

    } catch (error) {
      throw new Error(`Failed to download PHPStan: ${error.message}`)
    }
  }

  /**
   * Download file from URL
   */
  downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(destination)

      https.get(url, {
        headers: {
          'User-Agent': 'CodeAnalyst/1.0'
        }
      }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(file)
            file.on('finish', () => {
              file.close()
              resolve()
            })
          }).on('error', reject)
        } else {
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        }
      }).on('error', (err) => {
        unlinkSync(destination, () => {}) // Delete on error
        reject(err)
      })

      file.on('error', (err) => {
        unlinkSync(destination, () => {})
        reject(err)
      })
    })
  }

  /**
   * Create temporary directory with PHP files
   */
  async createTempDirectory(files) {
    const tempDir = path.join(process.cwd(), 'temp', `phpstan-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Write PHP files to temp directory (limit to 100 files)
    const filesToAnalyze = files.slice(0, 100)

    for (const file of filesToAnalyze) {
      const filePath = path.join(tempDir, file.name || 'file.php')
      const content = file.content || ''

      // Create subdirectories if needed
      const fileDir = path.dirname(filePath)
      await fs.mkdir(fileDir, { recursive: true })

      await fs.writeFile(filePath, content, 'utf8')
    }

    logger.info(`Created temp directory: ${tempDir} with ${filesToAnalyze.length} files`)

    return tempDir
  }

  /**
   * Run PHPStan analysis
   */
  async runPHPStan(directory) {
    try {
      const command = `${this.phpPath} -d memory_limit=${this.memoryLimit} ${this.pharPath} analyse --level=${this.analysisLevel} --error-format=json --no-progress ${directory}`

      logger.info(`Running PHPStan: level ${this.analysisLevel}`)

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      // Handle empty output (no errors found)
      if (!stdout || stdout.trim() === '') {
        logger.info('PHPStan returned no output (no errors found)')
        return { totals: { file_errors: 0 }, files: {} }
      }

      // Try to parse JSON
      try {
        return JSON.parse(stdout)
      } catch (parseError) {
        logger.warn('PHPStan output is not valid JSON:', stdout.substring(0, 200))
        return { totals: { file_errors: 0 }, files: {} }
      }

    } catch (error) {
      // PHPStan returns non-zero exit code when errors are found
      if (error.stdout) {
        // Handle empty stdout in error case
        if (!error.stdout.trim()) {
          logger.info('PHPStan error with empty stdout')
          return { totals: { file_errors: 0 }, files: {} }
        }
        
        try {
          return JSON.parse(error.stdout)
        } catch {
          logger.warn('PHPStan error output is not valid JSON:', error.stdout?.substring(0, 200))
          // Return empty result instead of throwing
          return { totals: { file_errors: 0 }, files: {} }
        }
      }
      
      // Log the error but return empty result instead of throwing
      logger.error('PHPStan execution failed:', error.message)
      return { totals: { file_errors: 0 }, files: {}, error: error.message }
    }
  }

  /**
   * Clean up temporary directory
   */
  async cleanupTempDirectory(directory) {
    try {
      await fs.rm(directory, { recursive: true, force: true })
      logger.info(`Cleaned up temp directory: ${directory}`)
    } catch (error) {
      logger.warn(`Failed to cleanup temp directory: ${error.message}`)
    }
  }

  /**
   * Format PHPStan results
   */
  formatResults(phpstanResult, fileCount) {
    const result = {
      filesAnalyzed: fileCount,
      totalErrors: phpstanResult.totals?.file_errors || 0,
      level: this.analysisLevel,
      errors: [],
      errorsByCategory: {
        typeErrors: 0,
        undefinedVariables: 0,
        unreachableCode: 0,
        deadCode: 0,
        other: 0
      },
      recommendations: []
    }

    // Extract errors from files
    if (phpstanResult.files) {
      Object.entries(phpstanResult.files).forEach(([filePath, fileData]) => {
        if (fileData.messages) {
          fileData.messages.forEach(message => {
            const error = {
              file: path.basename(filePath),
              line: message.line,
              message: message.message,
              ignorable: message.ignorable || false
            }

            result.errors.push(error)

            // Categorize errors
            if (message.message.includes('type')) {
              result.errorsByCategory.typeErrors++
            } else if (message.message.includes('Undefined variable')) {
              result.errorsByCategory.undefinedVariables++
            } else if (message.message.includes('unreachable')) {
              result.errorsByCategory.unreachableCode++
            } else if (message.message.includes('never read') || message.message.includes('unused')) {
              result.errorsByCategory.deadCode++
            } else {
              result.errorsByCategory.other++
            }
          })
        }
      })
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result)

    // Calculate quality score (0-100)
    result.qualityScore = this.calculateQualityScore(result)

    return result
  }

  /**
   * Generate recommendations based on errors
   */
  generateRecommendations(result) {
    const recommendations = []

    if (result.totalErrors === 0) {
      recommendations.push({
        priority: 'low',
        message: '✅ No errors found at this analysis level. Consider increasing level for stricter checks.',
        category: 'quality'
      })
      return recommendations
    }

    if (result.totalErrors > 50) {
      recommendations.push({
        priority: 'critical',
        message: `Found ${result.totalErrors} errors. Major code quality issues detected.`,
        category: 'quality'
      })
    } else if (result.totalErrors > 20) {
      recommendations.push({
        priority: 'high',
        message: `Found ${result.totalErrors} errors. Significant improvements needed.`,
        category: 'quality'
      })
    }

    if (result.errorsByCategory.typeErrors > 0) {
      recommendations.push({
        priority: 'high',
        message: `Fix ${result.errorsByCategory.typeErrors} type-related errors. Add type declarations.`,
        category: 'types'
      })
    }

    if (result.errorsByCategory.undefinedVariables > 0) {
      recommendations.push({
        priority: 'high',
        message: `Fix ${result.errorsByCategory.undefinedVariables} undefined variable errors.`,
        category: 'variables'
      })
    }

    if (result.errorsByCategory.deadCode > 0) {
      recommendations.push({
        priority: 'medium',
        message: `Remove ${result.errorsByCategory.deadCode} unused variables/code.`,
        category: 'cleanup'
      })
    }

    return recommendations
  }

  /**
   * Calculate quality score based on errors
   */
  calculateQualityScore(result) {
    if (result.filesAnalyzed === 0) return 0

    // Base score is 100
    let score = 100

    // Deduct points based on error density
    const errorsPerFile = result.totalErrors / result.filesAnalyzed

    if (errorsPerFile > 5) {
      score -= 50 // Critical
    } else if (errorsPerFile > 2) {
      score -= 30 // High
    } else if (errorsPerFile > 0.5) {
      score -= 15 // Medium
    } else {
      score -= errorsPerFile * 10 // Low
    }

    return Math.max(0, Math.round(score))
  }

  /**
   * Get empty result structure
   */
  getEmptyResult() {
    return {
      filesAnalyzed: 0,
      totalErrors: 0,
      level: this.analysisLevel,
      errors: [],
      errorsByCategory: {
        typeErrors: 0,
        undefinedVariables: 0,
        unreachableCode: 0,
        deadCode: 0,
        other: 0
      },
      recommendations: [],
      qualityScore: 0
    }
  }

  /**
   * Get error result structure
   */
  getErrorResult(errorMessage) {
    return {
      ...this.getEmptyResult(),
      error: errorMessage,
      recommendations: [
        {
          priority: 'high',
          message: `PHPStan analysis failed: ${errorMessage}`,
          category: 'error'
        }
      ]
    }
  }
}

export default PHPStanService

