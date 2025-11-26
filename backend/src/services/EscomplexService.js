// Escomplex Service - Code Complexity Analysis
import escomplex from 'escomplex'
import { logger } from '../utils/logger.js'

export class EscomplexService {
  constructor() {
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
  }

  /**
   * Analyze code complexity for JavaScript/TypeScript files
   * @param {Array} files - Array of file objects with path, content
   * @returns {Object} - Complexity analysis results
   */
  async analyzeComplexity(files) {
    try {
      logger.info(`🔍 Starting escomplex analysis for ${files.length} files`)

      // Log sample file structure for debugging
      if (files.length > 0) {
        logger.info(`📋 Sample file structure: ${JSON.stringify({
          path: files[0].path,
          name: files[0].name,
          extension: files[0].extension,
          hasContent: !!files[0].content
        })}`)
      }

      const jsFiles = files.filter(f => {
        // Get file path from various possible properties
        const filePath = f.path || f.name || ''
        const ext = f.extension || (filePath ? filePath.split('.').pop() : '')
        
        // Check if it's a supported extension
        const isSupported = this.supportedExtensions.includes(`.${ext}`.toLowerCase())
        
        // Skip minified files - they cause parsing errors and aren't useful for complexity
        const isMinified = filePath.includes('.min.') || filePath.includes('-min.')
        
        return isSupported && !isMinified
      })

      logger.info(`📊 Escomplex: ${files.length} total files, ${jsFiles.length} JS/TS files (excluding minified)`)

      if (jsFiles.length === 0) {
        logger.info('No JavaScript/TypeScript files found for complexity analysis (minified files excluded)')
        return this.getEmptyResult()
      }

      logger.info(`Found ${jsFiles.length} JS/TS files for complexity analysis`)

      const results = {
        maintainabilityIndex: 0,
        averageComplexity: 0,
        totalComplexity: 0,
        filesAnalyzed: 0,
        functionsAnalyzed: 0,
        complexFunctions: [],
        perFileComplexity: [],
        aggregateMetrics: {
          cyclomaticComplexity: 0,
          halsteadDifficulty: 0,
          halsteadVolume: 0,
          halsteadEffort: 0
        }
      }

      // Analyze each file (limit to first 100 files for performance)
      const filesToAnalyze = jsFiles.slice(0, 100)
      
      for (const file of filesToAnalyze) {
        try {
          const fileResult = this.analyzeFile(file)
          if (fileResult) {
            results.perFileComplexity.push(fileResult)
            results.filesAnalyzed++
            results.totalComplexity += fileResult.averageComplexity
            results.functionsAnalyzed += fileResult.functions.length

            // Track complex functions (complexity > 10)
            const complexFuncs = fileResult.functions.filter(f => f.cyclomatic > 10)
            results.complexFunctions.push(...complexFuncs.map(f => ({
              ...f,
              file: file.path
            })))

            // Aggregate metrics
            results.aggregateMetrics.cyclomaticComplexity += fileResult.cyclomatic || 0
            results.aggregateMetrics.halsteadDifficulty += fileResult.halstead?.difficulty || 0
            results.aggregateMetrics.halsteadVolume += fileResult.halstead?.volume || 0
            results.aggregateMetrics.halsteadEffort += fileResult.halstead?.effort || 0
          }
        } catch (error) {
          logger.warn(`Failed to analyze file ${file.path}: ${error.message}`)
        }
      }

      // Calculate averages
      if (results.filesAnalyzed > 0) {
        results.averageComplexity = results.totalComplexity / results.filesAnalyzed
        results.maintainabilityIndex = this.calculateMaintainabilityIndex(results)
        
        // Calculate average aggregate metrics
        results.aggregateMetrics.cyclomaticComplexity = 
          results.aggregateMetrics.cyclomaticComplexity / results.filesAnalyzed
        results.aggregateMetrics.halsteadDifficulty = 
          results.aggregateMetrics.halsteadDifficulty / results.filesAnalyzed
      }

      // Sort complex functions by complexity (highest first)
      results.complexFunctions.sort((a, b) => b.cyclomatic - a.cyclomatic)
      
      // Limit to top 20 most complex functions
      results.complexFunctions = results.complexFunctions.slice(0, 20)

      logger.info(`✅ Complexity analysis complete:`, {
        filesAnalyzed: results.filesAnalyzed,
        functionsAnalyzed: results.functionsAnalyzed,
        averageComplexity: results.averageComplexity.toFixed(2),
        maintainabilityIndex: results.maintainabilityIndex.toFixed(2),
        complexFunctions: results.complexFunctions.length
      })

      return results

    } catch (error) {
      logger.error('Escomplex analysis failed:', error)
      return this.getEmptyResult()
    }
  }

  /**
   * Analyze a single file
   * @param {Object} file - File object with path and content
   * @returns {Object} - File complexity analysis
   */
  analyzeFile(file) {
    try {
      const content = file.content || ''
      if (!content || content.length < 10) {
        return null
      }

      // Run escomplex analysis
      const report = escomplex.analyse(content, {
        sourceFile: file.path || file.name
      })

      // Extract function-level complexity
      const functions = (report.functions || []).map(fn => ({
        name: fn.name || '<anonymous>',
        line: fn.line || 0,
        cyclomatic: fn.cyclomatic || 0,
        halstead: {
          difficulty: fn.halstead?.difficulty || 0,
          volume: fn.halstead?.volume || 0,
          effort: fn.halstead?.effort || 0
        },
        sloc: {
          physical: fn.sloc?.physical || 0,
          logical: fn.sloc?.logical || 0
        },
        params: fn.params || 0
      }))

      // Calculate average complexity for this file
      const avgComplexity = functions.length > 0
        ? functions.reduce((sum, f) => sum + f.cyclomatic, 0) / functions.length
        : 0

      return {
        file: file.path || file.name,
        cyclomatic: report.cyclomatic || 0,
        halstead: {
          difficulty: report.halstead?.difficulty || 0,
          volume: report.halstead?.volume || 0,
          effort: report.halstead?.effort || 0,
          bugs: report.halstead?.bugs || 0
        },
        maintainability: report.maintainability || 0,
        averageComplexity: avgComplexity,
        functions: functions,
        sloc: {
          physical: report.sloc?.physical || 0,
          logical: report.sloc?.logical || 0
        },
        dependencies: report.dependencies?.length || 0
      }

    } catch (error) {
      // Syntax errors are common, don't log them
      if (!error.message.includes('Unexpected token')) {
        logger.debug(`Could not analyze ${file.path}: ${error.message}`)
      }
      return null
    }
  }

  /**
   * Calculate overall Maintainability Index
   * Based on Microsoft's maintainability index formula
   * @param {Object} results - Complexity results
   * @returns {Number} - Maintainability index (0-100)
   */
  calculateMaintainabilityIndex(results) {
    if (results.filesAnalyzed === 0) return 0

    // Get average metrics
    const avgCyclomatic = results.aggregateMetrics.cyclomaticComplexity
    const avgHalsteadVolume = results.aggregateMetrics.halsteadVolume
    const avgLOC = results.perFileComplexity.reduce(
      (sum, f) => sum + (f.sloc?.physical || 0), 0
    ) / results.filesAnalyzed

    // Microsoft Maintainability Index formula
    // MI = MAX(0, (171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)) * 100 / 171)
    
    let mi = 171
    
    if (avgHalsteadVolume > 0) {
      mi -= 5.2 * Math.log(avgHalsteadVolume)
    }
    
    if (avgCyclomatic > 0) {
      mi -= 0.23 * avgCyclomatic
    }
    
    if (avgLOC > 0) {
      mi -= 16.2 * Math.log(avgLOC)
    }

    // Normalize to 0-100 scale
    mi = Math.max(0, (mi * 100) / 171)
    
    return Math.min(100, mi)
  }

  /**
   * Get empty result structure
   */
  getEmptyResult() {
    return {
      maintainabilityIndex: 0,
      averageComplexity: 0,
      totalComplexity: 0,
      filesAnalyzed: 0,
      functionsAnalyzed: 0,
      complexFunctions: [],
      perFileComplexity: [],
      aggregateMetrics: {
        cyclomaticComplexity: 0,
        halsteadDifficulty: 0,
        halsteadVolume: 0,
        halsteadEffort: 0
      }
    }
  }

  /**
   * Get human-readable complexity recommendations
   * @param {Object} complexityResults - Results from analyzeComplexity()
   * @returns {Array} - Array of recommendation strings
   */
  getRecommendations(complexityResults) {
    const recommendations = []

    if (complexityResults.maintainabilityIndex < 20) {
      recommendations.push('🔴 Critical: Code maintainability is very low. Consider major refactoring.')
    } else if (complexityResults.maintainabilityIndex < 40) {
      recommendations.push('🟡 Warning: Code maintainability is below average. Refactoring recommended.')
    } else if (complexityResults.maintainabilityIndex < 70) {
      recommendations.push('🟢 Good: Code maintainability is acceptable but could be improved.')
    } else {
      recommendations.push('✅ Excellent: Code maintainability is high.')
    }

    if (complexityResults.averageComplexity > 15) {
      recommendations.push('Functions are too complex on average. Break down large functions.')
    } else if (complexityResults.averageComplexity > 10) {
      recommendations.push('Some functions have high complexity. Consider simplifying logic.')
    }

    if (complexityResults.complexFunctions.length > 10) {
      recommendations.push(`Found ${complexityResults.complexFunctions.length} overly complex functions (complexity > 10).`)
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Code complexity is within acceptable limits.')
    }

    return recommendations
  }
}

export default EscomplexService

