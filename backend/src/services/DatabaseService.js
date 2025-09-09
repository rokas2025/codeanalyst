// Database Service - Complete PostgreSQL implementation
import { db } from '../database/connection.js'
import { logger } from '../utils/logger.js'

export class DatabaseService {
  /**
   * Create URL analysis record
   */
  static async createUrlAnalysis(data) {
    try {
      const query = `
        INSERT INTO url_analyses (id, user_id, url, status, progress, meta_tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      const values = [
        data.id,
        data.userId || '00000000-0000-0000-0000-000000000001',
        data.url,
        data.status || 'pending',
        data.progress || 0,
        JSON.stringify(data.options || {})
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('insert', 'url_analyses', 0, { analysisId: data.id })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createUrlAnalysis', error, { analysisId: data.id })
      throw error
    }
  }

  /**
   * Update URL analysis status
   */
  static async updateUrlAnalysisStatus(analysisId, status, progress, error = null) {
    try {
      const query = `
        UPDATE url_analyses 
        SET status = $2::VARCHAR(50), progress = $3::INTEGER, error_message = $4::TEXT, 
            completed_at = CASE WHEN $2::VARCHAR(50) = 'completed' OR $2::VARCHAR(50) = 'failed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $1::UUID
        RETURNING *
      `
      const values = [analysisId, status, progress, error]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'url_analyses', 0, { analysisId, status, progress })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateUrlAnalysisStatus', error, { analysisId })
      throw error
    }
  }

  /**
   * Update URL analysis data
   */
  static async updateUrlAnalysisData(analysisId, data) {
    try {
      const query = `
        UPDATE url_analyses 
        SET title = $2, technologies = $3, html_content = $4, 
            basic_website_data = $5, performance_metrics = $6, seo_analysis = $7, 
            accessibility_analysis = $8, security_analysis = $9
        WHERE id = $1
        RETURNING *
      `
      // Ensure proper data types for database storage
      let technologies = []
      try {
        if (Array.isArray(data.technologies)) {
          technologies = data.technologies
        } else if (typeof data.technologies === 'string') {
          const parsed = JSON.parse(data.technologies)
          // If parsed object has technologies array, use it
          technologies = parsed.technologies || []
        } else if (data.technologies && typeof data.technologies === 'object') {
          // If it's an object with technologies array, extract it
          technologies = data.technologies.technologies || []
        } else {
          technologies = []
        }
      } catch (parseError) {
        logger.warn('Failed to parse technologies data:', parseError)
        technologies = []
      }

      const values = [
        analysisId,
        data.title,
        technologies,
        data.html_content,
        JSON.stringify(data.basic_website_data || {}),
        JSON.stringify(data.performance_metrics || {}),
        JSON.stringify(data.seo_analysis || {}),
        JSON.stringify(data.accessibility_analysis || {}),
        JSON.stringify(data.security_analysis || {})
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'url_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateUrlAnalysisData', error, { analysisId })
      throw error
    }
  }

  /**
   * Update URL analysis AI results
   */
  static async updateUrlAnalysisAI(analysisId, aiData) {
    try {
      const query = `
        UPDATE url_analyses 
        SET ai_insights = $2, business_recommendations = $3, 
            technical_recommendations = $4, risk_assessment = $5, 
            confidence_score = $6, ai_provider = $7, ai_model = $8
        WHERE id = $1
        RETURNING *
      `
      const values = [
        analysisId,
        JSON.stringify(aiData.ai_insights),
        JSON.stringify(aiData.business_recommendations),
        JSON.stringify(aiData.technical_recommendations),
        JSON.stringify(aiData.risk_assessment),
        aiData.confidence_score,
        aiData.ai_provider,
        aiData.ai_model
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'url_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateUrlAnalysisAI', error, { analysisId })
      throw error
    }
  }

  /**
   * Store complete URL analysis result
   */
  static async storeUrlAnalysisResult(analysisId, resultData) {
    try {
      // Extract simple tech names for database array
      let techNames = []
      if (resultData.technologies) {
        if (Array.isArray(resultData.technologies)) {
          techNames = resultData.technologies.map(tech => 
            typeof tech === 'string' ? tech : tech.name || tech
          )
        } else if (resultData.technologies.technologies && Array.isArray(resultData.technologies.technologies)) {
          techNames = resultData.technologies.technologies.map(tech => tech.name || tech)
        }
      }

      // Update the main analysis data
      await this.updateUrlAnalysisData(analysisId, {
        title: resultData.basic?.title || resultData.url,
        technologies: techNames,
        html_content: resultData.basic?.html || '',
        basic_website_data: resultData.basic || {},
        performance_metrics: resultData.lighthouse || resultData.performance || {},
        seo_analysis: resultData.seo || {},
        accessibility_analysis: resultData.accessibility || {},
        security_analysis: resultData.security || {}
      })

      // Update AI insights if available
      if (resultData.aiInsights) {
        await this.updateUrlAnalysisAI(analysisId, {
          ai_insights: resultData.aiInsights,
          business_recommendations: resultData.businessRecommendations || [],
          technical_recommendations: resultData.technicalRecommendations || [],
          risk_assessment: resultData.riskAssessment || {},
          confidence_score: resultData.confidenceScore || 0.8,
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        })
      }

      logger.logDatabase('store', 'url_analyses', 0, { analysisId })
      return { success: true, analysisId }
    } catch (error) {
      logger.logError('Database storeUrlAnalysisResult', error, { analysisId })
      throw error
    }
  }

  /**
   * Get URL analysis
   */
  static async getUrlAnalysis(analysisId, userId) {
    try {
      const query = `
        SELECT * FROM url_analyses 
        WHERE id = $1 AND user_id = $2
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('select', 'url_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getUrlAnalysis', error, { analysisId })
      throw error
    }
  }

  /**
   * Get URL analysis with results
   */
  static async getUrlAnalysisWithResults(analysisId, userId) {
    try {
      const query = `
        SELECT * FROM url_analyses 
        WHERE id = $1 AND user_id = $2
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('select', 'url_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getUrlAnalysisWithResults', error, { analysisId })
      throw error
    }
  }

  /**
   * Get user URL analyses
   */
  static async getUserUrlAnalyses(userId, options = {}) {
    try {
      const { page = 1, limit = 20, orderBy = 'created_at', order = 'DESC' } = options
      const offset = (page - 1) * limit

      const countQuery = `SELECT COUNT(*) FROM url_analyses WHERE user_id = $1`
      const countResult = await db.query(countQuery, [userId])
      const total = parseInt(countResult.rows[0].count)

      const query = `
        SELECT * FROM url_analyses 
        WHERE user_id = $1
        ORDER BY ${orderBy} ${order}
        LIMIT $2 OFFSET $3
      `
      const result = await db.query(query, [userId, limit, offset])
      
      logger.logDatabase('select', 'url_analyses', 0, { userId, page, limit })
      return {
        analyses: result.rows,
        total
      }
    } catch (error) {
      logger.logError('Database getUserUrlAnalyses', error, { userId })
      throw error
    }
  }

  /**
   * Delete URL analysis
   */
  static async deleteUrlAnalysis(analysisId, userId) {
    try {
      const query = `
        DELETE FROM url_analyses 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('delete', 'url_analyses', 0, { analysisId })
      return result.rows.length > 0
    } catch (error) {
      logger.logError('Database deleteUrlAnalysis', error, { analysisId })
      throw error
    }
  }

  // CODE ANALYSIS METHODS
  
  /**
   * Create code analysis record
   */
  static async createCodeAnalysis(data) {
    try {
      const query = `
        INSERT INTO code_analyses (id, user_id, source_type, source_reference, status, progress, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      const values = [
        data.id,
        data.userId || '00000000-0000-0000-0000-000000000001',
        data.sourceType,
        data.sourceReference,
        data.status || 'pending',
        data.progress || 0,
        JSON.stringify(data.metadata || {})
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('insert', 'code_analyses', 0, { analysisId: data.id })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createCodeAnalysis', error, { analysisId: data.id })
      throw error
    }
  }

  /**
   * Update code analysis status
   */
  static async updateCodeAnalysisStatus(analysisId, status, progress, error = null) {
    try {
      const query = `
        UPDATE code_analyses 
        SET status = $2::VARCHAR(50), progress = $3::INTEGER, error_message = $4::TEXT,
            completed_at = CASE WHEN $2::VARCHAR(50) = 'completed' OR $2::VARCHAR(50) = 'failed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $1::UUID
        RETURNING *
      `
      const values = [analysisId, status, progress, error]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'code_analyses', 0, { analysisId, status, progress })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateCodeAnalysisStatus', error, { analysisId })
      throw error
    }
  }

  /**
   * Update code analysis data
   */
  static async updateCodeAnalysisData(analysisId, data) {
    try {
      const query = `
        UPDATE code_analyses 
        SET total_files = $2, total_lines = $3, languages = $4, frameworks = $5,
            code_quality_score = $6, technical_debt_percentage = $7, 
            test_coverage_percentage = $8, complexity_score = $9,
            test_results = $10, build_results = $11, static_analysis_results = $12
        WHERE id = $1
        RETURNING *
      `
      const values = [
        analysisId,
        data.total_files,
        data.total_lines,
        data.languages,
        data.frameworks,
        data.code_quality_score,
        data.technical_debt_percentage,
        data.test_coverage_percentage,
        data.complexity_score,
        JSON.stringify(data.test_results),
        JSON.stringify(data.build_results),
        JSON.stringify(data.static_analysis_results)
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'code_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateCodeAnalysisData', error, { analysisId })
      throw error
    }
  }

  /**
   * Update code analysis AI results
   */
  static async updateCodeAnalysisAI(analysisId, aiData) {
    try {
      const query = `
        UPDATE code_analyses 
        SET system_overview = $2, technical_structure = $3, maintenance_needs = $4,
            ai_explanations = $5, business_recommendations = $6, risk_assessment = $7
        WHERE id = $1
        RETURNING *
      `
      const values = [
        analysisId,
        JSON.stringify(aiData.system_overview),
        JSON.stringify(aiData.technical_structure),
        JSON.stringify(aiData.maintenance_needs),
        JSON.stringify(aiData.ai_explanations),
        JSON.stringify(aiData.business_recommendations),
        JSON.stringify(aiData.risk_assessment)
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'code_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateCodeAnalysisAI', error, { analysisId })
      throw error
    }
  }

  /**
   * Get code analysis
   */
  static async getCodeAnalysis(analysisId, userId) {
    try {
      const query = `
        SELECT * FROM code_analyses 
        WHERE id = $1 AND user_id = $2
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('select', 'code_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getCodeAnalysis', error, { analysisId })
      throw error
    }
  }

  /**
   * Get code analysis with results
   */
  static async getCodeAnalysisWithResults(analysisId, userId) {
    try {
      const query = `
        SELECT * FROM code_analyses 
        WHERE id = $1 AND user_id = $2
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('select', 'code_analyses', 0, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getCodeAnalysisWithResults', error, { analysisId })
      throw error
    }
  }

  /**
   * Get user code analyses
   */
  static async getUserCodeAnalyses(userId, options = {}) {
    try {
      const { page = 1, limit = 20, sourceType, orderBy = 'created_at', order = 'DESC' } = options
      const offset = (page - 1) * limit

      let whereClause = 'WHERE user_id = $1'
      let params = [userId]
      
      if (sourceType) {
        whereClause += ' AND source_type = $2'
        params.push(sourceType)
      }

      const countQuery = `SELECT COUNT(*) FROM code_analyses ${whereClause}`
      const countResult = await db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].count)

      const query = `
        SELECT * FROM code_analyses 
        ${whereClause}
        ORDER BY ${orderBy} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(limit, offset)
      
      const result = await db.query(query, params)
      
      logger.logDatabase('select', 'code_analyses', 0, { userId, page, limit, sourceType })
      return {
        analyses: result.rows,
        total
      }
    } catch (error) {
      logger.logError('Database getUserCodeAnalyses', error, { userId })
      throw error
    }
  }

  /**
   * Delete code analysis
   */
  static async deleteCodeAnalysis(analysisId, userId) {
    try {
      const query = `
        DELETE FROM code_analyses 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('delete', 'code_analyses', 0, { analysisId })
      return result.rows.length > 0
    } catch (error) {
      logger.logError('Database deleteCodeAnalysis', error, { analysisId })
      throw error
    }
  }

  // AI CACHE METHODS

  /**
   * Get cached AI response
   */
  static async getCachedAIResponse(inputHash) {
    try {
      const query = `
        SELECT * FROM ai_response_cache 
        WHERE input_hash = $1 AND expires_at > CURRENT_TIMESTAMP
      `
      const result = await db.query(query, [inputHash])
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getCachedAIResponse', error, { inputHash })
      throw error
    }
  }

  /**
   * Cache AI response
   */
  static async cacheAIResponse(data) {
    try {
      const query = `
        INSERT INTO ai_response_cache 
        (input_hash, provider, model, prompt_text, response_text, confidence_score, token_count, response_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (input_hash) DO UPDATE SET
          response_text = EXCLUDED.response_text,
          confidence_score = EXCLUDED.confidence_score,
          token_count = EXCLUDED.token_count,
          response_time_ms = EXCLUDED.response_time_ms,
          created_at = CURRENT_TIMESTAMP,
          expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'
        RETURNING *
      `
      const values = [
        data.inputHash,
        data.provider,
        data.model,
        data.promptText,
        data.responseText,
        data.confidenceScore,
        data.tokenCount,
        data.responseTimeMs
      ]
      
      const result = await db.query(query, values)
      return result.rows[0]
    } catch (error) {
      logger.logError('Database cacheAIResponse', error)
      throw error
    }
  }

  /**
   * Log API usage
   */
  static async logAPIUsage(data) {
    try {
      const query = `
        INSERT INTO api_usage_logs 
        (user_id, analysis_id, analysis_type, provider, model, tokens_used, cost_usd, duration_ms, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `
      const values = [
        data.userId,
        data.analysisId,
        data.analysisType,
        data.provider,
        data.model,
        data.tokensUsed,
        data.costUsd,
        data.durationMs,
        data.success,
        data.errorMessage
      ]
      
      const result = await db.query(query, values)
      return result.rows[0]
    } catch (error) {
      logger.logError('Database logAPIUsage', error)
      throw error
    }
  }

  /**
   * Get user by GitHub ID
   */
  static async getUserByGithubId(githubId) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE github_id = $1::BIGINT
      `
      const result = await db.query(query, [githubId])
      logger.logDatabase('select', 'users', 0, { githubId })
      return result.rows[0] || null
    } catch (error) {
      logger.logError('Database getUserByGithubId', error, { githubId })
      throw error
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE id = $1::UUID
      `
      const result = await db.query(query, [userId])
      logger.logDatabase('select', 'users', 0, { userId })
      return result.rows[0] || null
    } catch (error) {
      logger.logError('Database getUserById', error, { userId })
      throw error
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      const query = `
        INSERT INTO users (
          id, github_id, github_username, github_access_token, 
          email, name, avatar_url, plan, created_at, updated_at
        ) 
        VALUES (
          gen_random_uuid(), $1::BIGINT, $2::VARCHAR(255), $3::TEXT,
          $4::VARCHAR(255), $5::VARCHAR(255), $6::TEXT, $7::VARCHAR(50),
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `
      const values = [
        userData.github_id,
        userData.github_username,
        userData.github_access_token,
        userData.email,
        userData.name,
        userData.avatar_url,
        userData.plan || 'free'
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('insert', 'users', 0, { githubUsername: userData.github_username })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createUser', error, { githubUsername: userData.github_username })
      throw error
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId, updateData) {
    try {
      const updateFields = []
      const values = [userId]
      let paramCounter = 2

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramCounter}`)
          values.push(value)
          paramCounter++
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $1::UUID
        RETURNING *
      `
      
      const result = await db.query(query, values)
      logger.logDatabase('update', 'users', 0, { userId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateUser', error, { userId })
      throw error
    }
  }
}

export default DatabaseService 