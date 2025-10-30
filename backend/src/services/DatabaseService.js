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
   * Get user by email
   */
  static async getUserByEmail(email) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE LOWER(email) = LOWER($1::VARCHAR(255))
      `
      const result = await db.query(query, [email])
      logger.logDatabase('select', 'users', 0, { email })
      return result.rows[0] || null
    } catch (error) {
      logger.logError('Database getUserByEmail', error, { email })
      throw error
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      // Handle both GitHub and Supabase users
      const isGithubUser = !!userData.github_id
      
      let query, values
      
      if (isGithubUser) {
        // GitHub user
        query = `
          INSERT INTO users (
            id, github_id, github_username, github_access_token, 
            email, name, avatar_url, plan, auth_provider,
            is_active, pending_approval, created_at, updated_at
          ) 
          VALUES (
            COALESCE($1::UUID, gen_random_uuid()), $2::BIGINT, $3::VARCHAR(255), $4::TEXT,
            $5::VARCHAR(255), $6::VARCHAR(255), $7::TEXT, $8::VARCHAR(50), 'github',
            COALESCE($9::BOOLEAN, false), COALESCE($10::BOOLEAN, true),
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING *
        `
        values = [
          userData.id || null,
          userData.github_id,
          userData.github_username,
          userData.github_access_token,
          userData.email,
          userData.name,
          userData.avatar_url,
          userData.plan || 'free',
          userData.is_active,
          userData.pending_approval
        ]
      } else {
        // Supabase user (email/Google)
        query = `
          INSERT INTO users (
            id, email, name, avatar_url, plan, auth_provider,
            is_active, pending_approval, created_at, updated_at
          ) 
          VALUES (
            COALESCE($1::UUID, gen_random_uuid()), $2::VARCHAR(255), $3::VARCHAR(255), 
            $4::TEXT, $5::VARCHAR(50), COALESCE($6::VARCHAR(50), 'supabase'),
            COALESCE($7::BOOLEAN, false), COALESCE($8::BOOLEAN, true),
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING *
        `
        values = [
          userData.id || null,
          userData.email,
          userData.name,
          userData.avatar_url,
          userData.plan || 'free',
          userData.auth_provider,
          userData.is_active,
          userData.pending_approval
        ]
      }

      const result = await db.query(query, values)
      logger.logDatabase('insert', 'users', 0, { 
        email: userData.email, 
        githubUsername: userData.github_username 
      })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createUser', error, { 
        email: userData.email, 
        githubUsername: userData.github_username 
      })
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

  /**
   * Get URL analysis by ID
   */
  static async getUrlAnalysis(analysisId, userId) {
    try {
      const query = `
        SELECT * FROM url_analyses 
        WHERE id = $1::UUID AND user_id = $2::UUID
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('select', 'url_analyses', result.rows.length, { analysisId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database getUrlAnalysis', error, { analysisId })
      throw error
    }
  }

  /**
   * Get URL analysis with complete results
   */
  static async getUrlAnalysisWithResults(analysisId, userId) {
    try {
      const query = `
        SELECT 
          id, url, title, status, progress, created_at, completed_at, error_message,
          technologies, html_content,
          basic_website_data, performance_metrics, seo_analysis, 
          accessibility_analysis, security_analysis,
          ai_insights, business_recommendations, technical_recommendations, risk_assessment
        FROM url_analyses 
        WHERE id = $1::UUID AND user_id = $2::UUID
      `
      const result = await db.query(query, [analysisId, userId])

      if (result.rows.length === 0) {
        return null
      }

      const analysis = result.rows[0]

      // Fix technology parsing - ensure technologies are parsed as objects, not JSON strings
      if (analysis.technologies && Array.isArray(analysis.technologies)) {
        analysis.technologies = analysis.technologies.map(tech => {
          if (typeof tech === 'string') {
            try {
              // If it's a JSON string, parse it
              return JSON.parse(tech)
            } catch (e) {
              // If parsing fails, treat as simple string name
              return { name: tech, categories: [], confidence: 50 }
            }
          }
          return tech // Already an object
        })
      }

      logger.logDatabase('select', 'url_analyses', 1, { analysisId })
      return analysis
    } catch (error) {
      logger.logError('Database getUrlAnalysisWithResults', error, { analysisId })
      throw error
    }
  }

  /**
   * Get user's URL analysis history
   */
  static async getUserUrlAnalyses(userId, options = {}) {
    try {
      const page = options.page || 1
      const limit = options.limit || 20
      const offset = (page - 1) * limit
      const orderBy = options.orderBy || 'created_at'
      const order = options.order || 'DESC'

      const query = `
        SELECT 
          id, url, title, status, created_at, completed_at, technologies
        FROM url_analyses 
        WHERE user_id = $1::UUID 
        ORDER BY ${orderBy} ${order}
        LIMIT $2 OFFSET $3
      `

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM url_analyses 
        WHERE user_id = $1::UUID
      `

      const [result, countResult] = await Promise.all([
        db.query(query, [userId, limit, offset]),
        db.query(countQuery, [userId])
      ])

      const analyses = result.rows.map(analysis => {
        // Fix technology parsing for history too
        if (analysis.technologies && Array.isArray(analysis.technologies)) {
          analysis.technologies = analysis.technologies.map(tech => {
            if (typeof tech === 'string') {
              try {
                return JSON.parse(tech)
              } catch (e) {
                return { name: tech, categories: [], confidence: 50 }
              }
            }
            return tech
          })
        }
        return analysis
      })

      logger.logDatabase('select', 'url_analyses', analyses.length, { userId })
      return {
        analyses,
        total: parseInt(countResult.rows[0].total)
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
        WHERE id = $1::UUID AND user_id = $2::UUID
        RETURNING id
      `
      const result = await db.query(query, [analysisId, userId])
      logger.logDatabase('delete', 'url_analyses', result.rows.length, { analysisId })
      return result.rows.length > 0
    } catch (error) {
      logger.logError('Database deleteUrlAnalysis', error, { analysisId })
      throw error
    }
  }

  // ==========================================
  // USER API KEYS MANAGEMENT
  // ==========================================

  /**
   * Store encrypted API key for user
   * @param {string} userId - User ID
   * @param {string} provider - AI provider (openai, anthropic, google)
   * @param {object} keyData - Encrypted key data
   */
  static async setUserApiKey(userId, provider, keyData) {
    try {
      const query = `
        INSERT INTO user_api_keys (user_id, provider, encrypted_key, key_name, is_active, created_at, updated_at)
        VALUES ($1::UUID, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, provider) 
        DO UPDATE SET 
          encrypted_key = $3,
          key_name = $4,
          is_active = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, provider
      `

      const result = await db.query(query, [
        userId,
        provider,
        keyData.encrypted_key,
        keyData.key_name,
        keyData.is_active
      ])

      logger.logDatabase('upsert', 'user_api_keys', result.rows.length, { userId, provider })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database setUserApiKey', error, { userId, provider })
      throw error
    }
  }

  /**
   * Get specific API key for user and provider
   * @param {string} userId - User ID
   * @param {string} provider - AI provider
   */
  static async getUserApiKey(userId, provider) {
    try {
      const query = `
        SELECT * FROM user_api_keys 
        WHERE user_id = $1::UUID AND provider = $2 AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `

      const result = await db.query(query, [userId, provider])
      logger.logDatabase('select', 'user_api_keys', result.rows.length, { userId, provider })
      return result.rows[0] || null
    } catch (error) {
      logger.logError('Database getUserApiKey', error, { userId, provider })
      throw error
    }
  }

  /**
   * Get all API keys for user (for settings display)
   * @param {string} userId - User ID
   */
  static async getUserApiKeys(userId) {
    try {
      const query = `
        SELECT provider, key_name, is_active, last_used, created_at, updated_at
        FROM user_api_keys 
        WHERE user_id = $1::UUID AND is_active = true
        ORDER BY provider ASC
      `

      const result = await db.query(query, [userId])
      logger.logDatabase('select', 'user_api_keys', result.rows.length, { userId })
      return result.rows
    } catch (error) {
      logger.logError('Database getUserApiKeys', error, { userId })
      throw error
    }
  }

  /**
   * Delete API key for user and provider
   * @param {string} userId - User ID
   * @param {string} provider - AI provider
   */
  static async deleteUserApiKey(userId, provider) {
    try {
      const query = `
        UPDATE user_api_keys 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1::UUID AND provider = $2
        RETURNING id
      `

      const result = await db.query(query, [userId, provider])
      logger.logDatabase('update', 'user_api_keys', result.rows.length, { userId, provider })
      return result.rowCount > 0
    } catch (error) {
      logger.logError('Database deleteUserApiKey', error, { userId, provider })
      throw error
    }
  }

  /**
   * Update last_used timestamp for API key
   * @param {string} userId - User ID
   * @param {string} provider - AI provider
   */
  static async updateApiKeyLastUsed(userId, provider) {
    try {
      const query = `
        UPDATE user_api_keys 
        SET last_used = CURRENT_TIMESTAMP
        WHERE user_id = $1::UUID AND provider = $2 AND is_active = true
      `

      await db.query(query, [userId, provider])
      logger.logDatabase('update', 'user_api_keys', 1, { userId, provider })
    } catch (error) {
      logger.logError('Database updateApiKeyLastUsed', error, { userId, provider })
      // Don't throw for this non-critical operation
    }
  }

  // ==========================================
  // WORDPRESS CONNECTIONS MANAGEMENT
  // ==========================================

  /**
   * Generate unique API key for WordPress connection
   * @param {string} userId - User ID
   * @returns {string} Generated API key
   */
  static async generateWordPressApiKey(userId) {
    try {
      const crypto = await import('crypto')
      const apiKey = crypto.randomUUID()

      logger.logDatabase('generate', 'wordpress_api_key', 1, { userId })
      return apiKey
    } catch (error) {
      logger.logError('Database generateWordPressApiKey', error, { userId })
      throw error
    }
  }

  /**
   * Create WordPress connection
   * @param {string} userId - User ID
   * @param {string} apiKey - Generated API key
   * @param {object} siteData - WordPress site data
   */
  static async createWordPressConnection(userId, apiKey, siteData) {
    try {
      const query = `
        INSERT INTO wordpress_connections (
          user_id, api_key, site_url, site_name, wordpress_version,
          active_theme, active_plugins, site_health, php_version,
          is_connected, last_sync
        )
        VALUES ($1::UUID, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const result = await db.query(query, [
        userId,
        apiKey,
        siteData.site_url,
        siteData.site_name || null,
        siteData.wordpress_version || null,
        siteData.active_theme || null,
        siteData.active_plugins ? JSON.stringify(siteData.active_plugins) : null,
        siteData.site_health ? JSON.stringify(siteData.site_health) : null,
        siteData.php_version || null
      ])

      logger.logDatabase('insert', 'wordpress_connections', result.rows.length, { userId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createWordPressConnection', error, { userId })
      throw error
    }
  }

  /**
   * Get all WordPress connections for user
   * @param {string} userId - User ID
   */
  static async getWordPressConnections(userId) {
    try {
      const query = `
        SELECT * FROM wordpress_connections
        WHERE user_id = $1::UUID
        ORDER BY created_at DESC
      `

      const result = await db.query(query, [userId])
      logger.logDatabase('select', 'wordpress_connections', result.rows.length, { userId })
      return result.rows
    } catch (error) {
      logger.logError('Database getWordPressConnections', error, { userId })
      throw error
    }
  }

  /**
   * Update WordPress connection data
   * @param {string} apiKey - WordPress API key
   * @param {object} siteData - Updated site data
   */
  static async updateWordPressConnection(apiKey, siteData) {
    try {
      const query = `
        UPDATE wordpress_connections
        SET 
          site_url = COALESCE($2, site_url),
          site_name = COALESCE($3, site_name),
          wordpress_version = COALESCE($4, wordpress_version),
          active_theme = COALESCE($5, active_theme),
          active_plugins = COALESCE($6, active_plugins),
          site_health = COALESCE($7, site_health),
          php_version = COALESCE($8, php_version),
          last_sync = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE api_key = $1
        RETURNING *
      `

      const result = await db.query(query, [
        apiKey,
        siteData.site_url || null,
        siteData.site_name || null,
        siteData.wordpress_version || null,
        siteData.active_theme || null,
        siteData.active_plugins ? JSON.stringify(siteData.active_plugins) : null,
        siteData.site_health ? JSON.stringify(siteData.site_health) : null,
        siteData.php_version || null
      ])

      logger.logDatabase('update', 'wordpress_connections', result.rows.length, { apiKey })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateWordPressConnection', error, { apiKey })
      throw error
    }
  }

  /**
   * Delete WordPress connection
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User ID
   */
  static async deleteWordPressConnection(connectionId, userId) {
    try {
      const query = `
        DELETE FROM wordpress_connections
        WHERE id = $1::UUID AND user_id = $2::UUID
        RETURNING id
      `

      const result = await db.query(query, [connectionId, userId])
      logger.logDatabase('delete', 'wordpress_connections', result.rows.length, { connectionId, userId })
      return result.rowCount > 0
    } catch (error) {
      logger.logError('Database deleteWordPressConnection', error, { connectionId, userId })
      throw error
    }
  }

  /**
   * Verify WordPress API key and return user_id
   * @param {string} apiKey - WordPress API key
   * @returns {object|null} Connection data with user_id or null
   */
  static async verifyWordPressApiKey(apiKey) {
    try {
      const query = `
        SELECT id, user_id, site_url, is_connected
        FROM wordpress_connections
        WHERE api_key = $1
      `

      const result = await db.query(query, [apiKey])
      logger.logDatabase('select', 'wordpress_connections', result.rows.length, { apiKey: apiKey.substring(0, 8) + '...' })
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.logError('Database verifyWordPressApiKey', error)
      throw error
    }
  }

  // ============================================
  // USER MANAGEMENT METHODS
  // ============================================

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {object|null} User object or null
   */
  static async getUserById(userId) {
    try {
      const query = `
        SELECT u.*, ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = $1::UUID
      `
      const result = await db.query(query, [userId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.logError('Database getUserById', error, { userId })
      throw error
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {object|null} User object or null
   */
  static async getUserByEmail(email) {
    try {
      const query = `
        SELECT u.*, ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE LOWER(u.email) = LOWER($1)
      `
      const result = await db.query(query, [email])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.logError('Database getUserByEmail', error, { email })
      throw error
    }
  }

  /**
   * Get user's role
   * @param {string} userId - User ID
   * @returns {string} Role name (superadmin, admin, user)
   */
  static async getUserRole(userId) {
    try {
      const query = `SELECT get_user_role($1::UUID) as role`
      const result = await db.query(query, [userId])
      return result.rows[0]?.role || 'user'
    } catch (error) {
      logger.logError('Database getUserRole', error, { userId })
      return 'user' // Default to user role on error
    }
  }

  /**
   * Get all users (superadmin only)
   * @returns {array} Array of users with their roles
   */
  static async getAllUsers() {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.github_username, u.auth_provider, 
               u.is_active, u.pending_approval, u.approved_at, u.created_at,
               ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        ORDER BY u.created_at DESC
      `
      const result = await db.query(query)
      logger.logDatabase('select', 'users', result.rows.length)
      return result.rows
    } catch (error) {
      logger.logError('Database getAllUsers', error)
      throw error
    }
  }

  /**
   * Approve a pending user
   * @param {string} userId - User ID to approve
   * @param {string} approvedBy - ID of approving superadmin
   */
  static async approveUser(userId, approvedBy) {
    try {
      const query = `
        UPDATE users
        SET is_active = true,
            pending_approval = false,
            approved_at = NOW(),
            approved_by = $2::UUID
        WHERE id = $1::UUID
        RETURNING *
      `
      const result = await db.query(query, [userId, approvedBy])
      
      // Log the approval
      await db.query(`
        INSERT INTO user_activation_log (user_id, action, performed_by, reason)
        VALUES ($1::UUID, 'approved', $2::UUID, 'User approved by superadmin')
      `, [userId, approvedBy])
      
      logger.logDatabase('update', 'users', result.rows.length, { userId, action: 'approved' })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database approveUser', error, { userId, approvedBy })
      throw error
    }
  }

  /**
   * Deactivate a user
   * @param {string} userId - User ID to deactivate
   * @param {string} deactivatedBy - ID of deactivating superadmin
   * @param {string} reason - Reason for deactivation
   */
  static async deactivateUser(userId, deactivatedBy, reason = null) {
    try {
      const query = `
        UPDATE users
        SET is_active = false,
            deactivated_at = NOW(),
            deactivated_by = $2::UUID
        WHERE id = $1::UUID
        RETURNING *
      `
      const result = await db.query(query, [userId, deactivatedBy])
      
      // Log the deactivation
      await db.query(`
        INSERT INTO user_activation_log (user_id, action, performed_by, reason)
        VALUES ($1::UUID, 'deactivated', $2::UUID, $3)
      `, [userId, deactivatedBy, reason])
      
      logger.logDatabase('update', 'users', result.rows.length, { userId, action: 'deactivated' })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database deactivateUser', error, { userId, deactivatedBy })
      throw error
    }
  }

  /**
   * Reactivate a user
   * @param {string} userId - User ID to reactivate
   * @param {string} reactivatedBy - ID of reactivating superadmin
   */
  static async reactivateUser(userId, reactivatedBy) {
    try {
      const query = `
        UPDATE users
        SET is_active = true,
            deactivated_at = NULL,
            deactivated_by = NULL
        WHERE id = $1::UUID
        RETURNING *
      `
      const result = await db.query(query, [userId])
      
      // Log the reactivation
      await db.query(`
        INSERT INTO user_activation_log (user_id, action, performed_by, reason)
        VALUES ($1::UUID, 'activated', $2::UUID, 'User reactivated by superadmin')
      `, [userId, reactivatedBy])
      
      logger.logDatabase('update', 'users', result.rows.length, { userId, action: 'reactivated' })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database reactivateUser', error, { userId, reactivatedBy })
      throw error
    }
  }

  // ============================================
  // PROJECT MANAGEMENT METHODS
  // ============================================

  /**
   * Create a new project
   * @param {object} projectData - Project data (name, url, description, admin_id)
   */
  static async createProject(projectData) {
    try {
      const query = `
        INSERT INTO projects (name, url, description, admin_id)
        VALUES ($1, $2, $3, $4::UUID)
        RETURNING *
      `
      const values = [
        projectData.name,
        projectData.url,
        projectData.description || null,
        projectData.admin_id
      ]
      
      const result = await db.query(query, values)
      logger.logDatabase('insert', 'projects', result.rows.length)
      return result.rows[0]
    } catch (error) {
      logger.logError('Database createProject', error, projectData)
      throw error
    }
  }

  /**
   * Get all projects for an admin
   * @param {string} adminId - Admin user ID
   */
  static async getAdminProjects(adminId) {
    try {
      const query = `
        SELECT p.*, 
               COUNT(DISTINCT pu.user_id) as user_count,
               COUNT(DISTINCT wc.id) as wordpress_sites_count
        FROM projects p
        LEFT JOIN project_users pu ON p.id = pu.project_id AND pu.is_active = true
        LEFT JOIN wordpress_connections wc ON p.id = wc.project_id
        WHERE p.admin_id = $1::UUID AND p.is_active = true
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `
      const result = await db.query(query, [adminId])
      logger.logDatabase('select', 'projects', result.rows.length, { adminId })
      return result.rows
    } catch (error) {
      logger.logError('Database getAdminProjects', error, { adminId })
      throw error
    }
  }

  /**
   * Get all projects a user has access to
   * @param {string} userId - User ID
   */
  static async getUserProjects(userId) {
    try {
      const query = `
        SELECT p.*, pu.invited_at
        FROM projects p
        INNER JOIN project_users pu ON p.id = pu.project_id
        WHERE pu.user_id = $1::UUID AND pu.is_active = true AND p.is_active = true
        ORDER BY pu.invited_at DESC
      `
      const result = await db.query(query, [userId])
      logger.logDatabase('select', 'projects', result.rows.length, { userId })
      return result.rows
    } catch (error) {
      logger.logError('Database getUserProjects', error, { userId })
      throw error
    }
  }

  /**
   * Check if user has access to a project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {boolean} True if user has access
   */
  static async checkProjectAccess(userId, projectId) {
    try {
      // Check if user is the project admin
      const adminQuery = `
        SELECT 1 FROM projects WHERE id = $1::UUID AND admin_id = $2::UUID AND is_active = true
      `
      const adminResult = await db.query(adminQuery, [projectId, userId])
      if (adminResult.rows.length > 0) return true

      // Check if user is invited to the project
      const userQuery = `
        SELECT 1 FROM project_users 
        WHERE project_id = $1::UUID AND user_id = $2::UUID AND is_active = true
      `
      const userResult = await db.query(userQuery, [projectId, userId])
      return userResult.rows.length > 0
    } catch (error) {
      logger.logError('Database checkProjectAccess', error, { userId, projectId })
      return false
    }
  }

  /**
   * Invite a user to a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to invite
   * @param {string} invitedBy - ID of user sending invitation
   */
  static async inviteUserToProject(projectId, userId, invitedBy) {
    try {
      const query = `
        INSERT INTO project_users (project_id, user_id, invited_by)
        VALUES ($1::UUID, $2::UUID, $3::UUID)
        ON CONFLICT (project_id, user_id) 
        DO UPDATE SET is_active = true, invited_at = NOW()
        RETURNING *
      `
      const result = await db.query(query, [projectId, userId, invitedBy])
      logger.logDatabase('insert', 'project_users', result.rows.length)
      return result.rows[0]
    } catch (error) {
      logger.logError('Database inviteUserToProject', error, { projectId, userId, invitedBy })
      throw error
    }
  }

  /**
   * Remove a user from a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID to remove
   */
  static async removeUserFromProject(projectId, userId) {
    try {
      const query = `
        UPDATE project_users
        SET is_active = false
        WHERE project_id = $1::UUID AND user_id = $2::UUID
        RETURNING *
      `
      const result = await db.query(query, [projectId, userId])
      logger.logDatabase('update', 'project_users', result.rows.length)
      return result.rowCount > 0
    } catch (error) {
      logger.logError('Database removeUserFromProject', error, { projectId, userId })
      throw error
    }
  }

  /**
   * Get users in a project
   * @param {string} projectId - Project ID
   */
  static async getProjectUsers(projectId) {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.github_username, 
               pu.invited_at, pu.invited_by, pu.is_active
        FROM project_users pu
        INNER JOIN users u ON pu.user_id = u.id
        WHERE pu.project_id = $1::UUID
        ORDER BY pu.invited_at DESC
      `
      const result = await db.query(query, [projectId])
      logger.logDatabase('select', 'project_users', result.rows.length, { projectId })
      return result.rows
    } catch (error) {
      logger.logError('Database getProjectUsers', error, { projectId })
      throw error
    }
  }

  /**
   * Set module permissions for a user in a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @param {array} modules - Array of module names with access flags
   */
  static async setModulePermissions(projectId, userId, modules) {
    try {
      const queries = modules.map(module => {
        return db.query(`
          INSERT INTO module_permissions (project_id, user_id, module_name, has_access)
          VALUES ($1::UUID, $2::UUID, $3, $4)
          ON CONFLICT (project_id, user_id, module_name)
          DO UPDATE SET has_access = $4, updated_at = NOW()
        `, [projectId, userId, module.name, module.hasAccess])
      })
      
      await Promise.all(queries)
      logger.logDatabase('upsert', 'module_permissions', modules.length, { projectId, userId })
      return true
    } catch (error) {
      logger.logError('Database setModulePermissions', error, { projectId, userId, modules })
      throw error
    }
  }

  /**
   * Get module permissions for a user in a project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   */
  static async getModulePermissions(projectId, userId) {
    try {
      const query = `
        SELECT module_name, has_access
        FROM module_permissions
        WHERE project_id = $1::UUID AND user_id = $2::UUID
      `
      const result = await db.query(query, [projectId, userId])
      logger.logDatabase('select', 'module_permissions', result.rows.length, { projectId, userId })
      return result.rows
    } catch (error) {
      logger.logError('Database getModulePermissions', error, { projectId, userId })
      throw error
    }
  }

  /**
   * Check if user has permission for a specific module
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {string} moduleName - Module name
   * @returns {boolean} True if user has access
   */
  static async checkModulePermission(userId, projectId, moduleName) {
    try {
      // Check if user is the project admin (admins have all permissions)
      const adminQuery = `
        SELECT 1 FROM projects WHERE id = $1::UUID AND admin_id = $2::UUID AND is_active = true
      `
      const adminResult = await db.query(adminQuery, [projectId, userId])
      if (adminResult.rows.length > 0) return true

      // Check specific module permission
      const query = `
        SELECT has_access
        FROM module_permissions
        WHERE project_id = $1::UUID AND user_id = $2::UUID AND module_name = $3
      `
      const result = await db.query(query, [projectId, userId, moduleName])
      return result.rows.length > 0 && result.rows[0].has_access
    } catch (error) {
      logger.logError('Database checkModulePermission', error, { userId, projectId, moduleName })
      return false
    }
  }

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {object} updates - Fields to update
   */
  static async updateProject(projectId, updates) {
    try {
      const query = `
        UPDATE projects
        SET name = COALESCE($2, name),
            url = COALESCE($3, url),
            description = COALESCE($4, description),
            updated_at = NOW()
        WHERE id = $1::UUID
        RETURNING *
      `
      const values = [projectId, updates.name, updates.url, updates.description]
      const result = await db.query(query, values)
      logger.logDatabase('update', 'projects', result.rows.length, { projectId })
      return result.rows[0]
    } catch (error) {
      logger.logError('Database updateProject', error, { projectId, updates })
      throw error
    }
  }

  /**
   * Delete project (soft delete)
   * @param {string} projectId - Project ID
   */
  static async deleteProject(projectId) {
    try {
      const query = `
        UPDATE projects
        SET is_active = false, updated_at = NOW()
        WHERE id = $1::UUID
        RETURNING *
      `
      const result = await db.query(query, [projectId])
      logger.logDatabase('update', 'projects', result.rows.length, { projectId, action: 'soft_delete' })
      return result.rowCount > 0
    } catch (error) {
      logger.logError('Database deleteProject', error, { projectId })
      throw error
    }
  }
}

export default DatabaseService 