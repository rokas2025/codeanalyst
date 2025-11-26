// PHPCS Service - PHP CodeSniffer for WordPress Coding Standards
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

export class PHPCSService {
  constructor() {
    this.phpcsPath = process.env.PHPCS_PATH || 'phpcs'
    this.standard = process.env.PHPCS_STANDARD || 'WordPress'
    this.timeout = 120000 // 2 minutes
    this.maxFiles = 100 // Limit files for performance
  }

  /**
   * Analyze PHP files for WordPress coding standards compliance
   * @param {Array} files - Array of PHP file objects
   * @param {string} projectPath - Path to project directory (optional)
   * @returns {Object} - PHPCS analysis results
   */
  async analyzeCode(files, projectPath = null) {
    try {
      logger.info(`🔍 Starting PHPCS analysis for ${files.length} files`)

      // Filter PHP files
      const phpFiles = files.filter(f => {
        const ext = f.extension || (f.path ? path.extname(f.path).toLowerCase() : '')
        return ext === '.php'
      })

      if (phpFiles.length === 0) {
        logger.info('No PHP files found for PHPCS analysis')
        return this.getEmptyResult()
      }

      logger.info(`Found ${phpFiles.length} PHP files for PHPCS analysis`)

      // Check if PHPCS is available
      const phpcsAvailable = await this.checkPHPCSAvailable()
      if (!phpcsAvailable) {
        logger.warn('PHPCS not available, skipping coding standards analysis')
        return this.getErrorResult('PHPCS not available on this system')
      }

      // Create temporary directory for analysis
      const tempDir = await this.createTempDirectory(phpFiles)

      try {
        // Run PHPCS analysis
        const analysisResult = await this.runPHPCS(tempDir)

        // Clean up
        await this.cleanupTempDirectory(tempDir)

        // Format results
        const formatted = this.formatResults(analysisResult, phpFiles.length)

        logger.info(`✅ PHPCS analysis complete: ${formatted.totalViolations} violations found`)

        return formatted

      } catch (error) {
        // Clean up on error
        await this.cleanupTempDirectory(tempDir)
        throw error
      }

    } catch (error) {
      logger.error('PHPCS analysis failed:', error)
      return this.getErrorResult(error.message)
    }
  }

  /**
   * Check if PHPCS is available
   */
  async checkPHPCSAvailable() {
    try {
      await execAsync(`${this.phpcsPath} --version`, { timeout: 5000 })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Create temporary directory with PHP files
   */
  async createTempDirectory(files) {
    const tempDir = path.join(process.cwd(), 'temp', `phpcs-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Write PHP files to temp directory (limit files)
    const filesToAnalyze = files.slice(0, this.maxFiles)

    for (const file of filesToAnalyze) {
      const fileName = file.name || file.path || 'file.php'
      const filePath = path.join(tempDir, path.basename(fileName))
      const content = file.content || ''

      await fs.writeFile(filePath, content, 'utf8')
    }

    logger.info(`Created temp directory: ${tempDir} with ${filesToAnalyze.length} files`)

    return tempDir
  }

  /**
   * Run PHPCS analysis
   */
  async runPHPCS(directory) {
    try {
      // Run PHPCS with WordPress standard and JSON report
      const command = `${this.phpcsPath} --standard=${this.standard} --report=json --extensions=php ${directory}`

      logger.info(`Running PHPCS with ${this.standard} standard`)

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      // PHPCS returns JSON in stdout
      return JSON.parse(stdout)

    } catch (error) {
      // PHPCS returns non-zero exit code when violations are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout)
        } catch {
          // If not valid JSON, might be an error message
          logger.warn('PHPCS output not JSON, checking for errors')
          throw new Error(`PHPCS failed: ${error.message}`)
        }
      }
      throw error
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
   * Format PHPCS results
   */
  formatResults(phpcsResult, fileCount) {
    const result = {
      filesAnalyzed: fileCount,
      totalViolations: phpcsResult.totals?.errors || 0,
      totalWarnings: phpcsResult.totals?.warnings || 0,
      totalFixable: phpcsResult.totals?.fixable || 0,
      standard: this.standard,
      violations: [],
      violationsByCategory: {
        naming: 0,
        formatting: 0,
        documentation: 0,
        security: 0,
        performance: 0,
        other: 0
      },
      recommendations: []
    }

    // Extract violations from files
    if (phpcsResult.files) {
      Object.entries(phpcsResult.files).forEach(([filePath, fileData]) => {
        if (fileData.messages) {
          fileData.messages.forEach(message => {
            const violation = {
              file: path.basename(filePath),
              line: message.line,
              column: message.column,
              message: message.message,
              source: message.source,
              severity: message.type === 'ERROR' ? 'error' : 'warning',
              fixable: message.fixable || false
            }

            result.violations.push(violation)

            // Categorize violations based on source/message
            this.categorizeViolation(violation, result.violationsByCategory)
          })
        }
      })
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result)

    // Calculate compliance score (0-100)
    result.complianceScore = this.calculateComplianceScore(result)

    return result
  }

  /**
   * Categorize a violation based on its source or message
   */
  categorizeViolation(violation, categories) {
    const source = violation.source?.toLowerCase() || ''
    const message = violation.message?.toLowerCase() || ''

    if (source.includes('naming') || message.includes('naming') || 
        source.includes('camelcase') || source.includes('snakecase')) {
      categories.naming++
    } else if (source.includes('whitespace') || source.includes('spacing') ||
               source.includes('indent') || source.includes('format')) {
      categories.formatting++
    } else if (source.includes('comment') || source.includes('doc') ||
               message.includes('missing doc')) {
      categories.documentation++
    } else if (source.includes('security') || message.includes('escape') ||
               message.includes('sanitize') || message.includes('nonce')) {
      categories.security++
    } else if (source.includes('performance') || message.includes('deprecated')) {
      categories.performance++
    } else {
      categories.other++
    }
  }

  /**
   * Generate recommendations based on violations
   */
  generateRecommendations(result) {
    const recommendations = []
    const total = result.totalViolations + result.totalWarnings

    if (total === 0) {
      recommendations.push({
        priority: 'low',
        message: '✅ No coding standard violations found. Excellent code quality!',
        category: 'quality'
      })
      return recommendations
    }

    if (total > 100) {
      recommendations.push({
        priority: 'critical',
        message: `Found ${total} violations. Major coding standards cleanup needed.`,
        category: 'quality'
      })
    } else if (total > 50) {
      recommendations.push({
        priority: 'high',
        message: `Found ${total} violations. Significant improvements needed.`,
        category: 'quality'
      })
    } else if (total > 20) {
      recommendations.push({
        priority: 'medium',
        message: `Found ${total} violations. Some cleanup recommended.`,
        category: 'quality'
      })
    }

    // Specific recommendations by category
    if (result.violationsByCategory.security > 0) {
      recommendations.push({
        priority: 'critical',
        message: `Fix ${result.violationsByCategory.security} security-related violations immediately.`,
        category: 'security'
      })
    }

    if (result.violationsByCategory.naming > 10) {
      recommendations.push({
        priority: 'medium',
        message: `Consider fixing ${result.violationsByCategory.naming} naming convention violations for consistency.`,
        category: 'naming'
      })
    }

    if (result.violationsByCategory.documentation > 10) {
      recommendations.push({
        priority: 'low',
        message: `Add documentation for ${result.violationsByCategory.documentation} undocumented elements.`,
        category: 'documentation'
      })
    }

    if (result.totalFixable > 0) {
      recommendations.push({
        priority: 'info',
        message: `${result.totalFixable} violations can be auto-fixed using 'phpcbf'.`,
        category: 'fixable'
      })
    }

    return recommendations
  }

  /**
   * Calculate compliance score based on violations
   */
  calculateComplianceScore(result) {
    if (result.filesAnalyzed === 0) return 0

    // Base score is 100
    let score = 100

    // Calculate violations per file
    const total = result.totalViolations + result.totalWarnings
    const violationsPerFile = total / result.filesAnalyzed

    // Deduct points based on violation density
    if (violationsPerFile > 20) {
      score -= 60 // Critical non-compliance
    } else if (violationsPerFile > 10) {
      score -= 40 // Major issues
    } else if (violationsPerFile > 5) {
      score -= 25 // Moderate issues
    } else if (violationsPerFile > 2) {
      score -= 15 // Minor issues
    } else {
      score -= violationsPerFile * 5 // Few issues
    }

    // Security violations have higher impact
    score -= result.violationsByCategory.security * 2

    return Math.max(0, Math.round(score))
  }

  /**
   * Get empty result structure
   */
  getEmptyResult() {
    return {
      filesAnalyzed: 0,
      totalViolations: 0,
      totalWarnings: 0,
      totalFixable: 0,
      standard: this.standard,
      violations: [],
      violationsByCategory: {
        naming: 0,
        formatting: 0,
        documentation: 0,
        security: 0,
        performance: 0,
        other: 0
      },
      recommendations: [],
      complianceScore: 0
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
          message: `PHPCS analysis failed: ${errorMessage}`,
          category: 'error'
        }
      ]
    }
  }
}

export default PHPCSService

