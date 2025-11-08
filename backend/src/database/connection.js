// Database Connection Service - PostgreSQL with pg library
import pkg from 'pg'
import { logger } from '../utils/logger.js'

const { Pool } = pkg

class DatabaseConnection {
  constructor() {
    this.pool = null
    this.isConnected = false
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      let config;
      
      // Use DATABASE_URL if available (for production/Supabase)
      if (process.env.DATABASE_URL) {
        config = {
          connectionString: process.env.DATABASE_URL,
          // Connection pool settings optimized for Supabase
          max: 5, // Reduced max connections for Railway free tier
          min: 1, // Keep minimum connections alive
          idleTimeoutMillis: 30000, // Keep idle connections for 30 seconds
          connectionTimeoutMillis: 30000, // 30 second timeout for initial connection
          
          // Add keepalive to prevent connection termination during long operations
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000, // Send keepalive every 10 seconds
          
          // Prevent statement timeout during long operations
          statement_timeout: 300000, // 5 minutes max per query
          query_timeout: 300000, // 5 minutes max
          
          // SSL configuration for Supabase - required for pooler connections
          ssl: { 
            rejectUnauthorized: false,
            // Add additional SSL options for better compatibility
            checkServerIdentity: () => undefined
          }
        }
      } else {
        // Fallback to individual environment variables for local development
        config = {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'codeanalyst',
          user: process.env.DB_USER || 'ghostarcade.xyz',
          password: process.env.DB_PASSWORD || '', // No password for local dev
          
          // Connection pool settings
          max: 20, // Maximum number of clients in the pool
          idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
          connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
          
          // SSL configuration (disable for local development)
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
      }

      // Create connection pool
      this.pool = new Pool(config)

      // Test the connection
      const client = await this.pool.connect()
      const result = await client.query('SELECT NOW() as current_time, version() as version')
      client.release()

      this.isConnected = true
      
      logger.info('✅ Database connected successfully', {
        host: config.host || 'Supabase',
        port: config.port || 5432,
        database: config.database || 'postgres',
        user: config.user || 'postgres',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] // Just PostgreSQL version
      })

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Database pool error:', err)
        this.isConnected = false
      })

      return this.pool

    } catch (error) {
      logger.error('Database connection failed:', error)
      throw new Error(`Database connection failed: ${error.message}`)
    }
  }

  /**
   * Execute a query
   */
  async query(text, params = []) {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      logger.logDatabase('query', 'unknown', duration, {
        rowCount: result.rowCount,
        command: result.command
      })

      return result
    } catch (error) {
      const duration = Date.now() - start
      logger.logError('Database query', error, {
        duration,
        query: text.substring(0, 100), // First 100 chars of query
        params: params.length
      })
      throw error
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await this.pool.connect()
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.getClient()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Check database health
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health')
      return {
        status: 'healthy',
        connected: this.isConnected,
        response_time: 'fast',
        database: process.env.DB_NAME || 'codeanalyst'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        database: process.env.DB_NAME || 'codeanalyst'
      }
    }
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end()
      this.isConnected = false
      logger.info('Database connections closed')
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection()

/**
 * Initialize database connection
 */
export async function initDatabase() {
  return await dbConnection.initialize()
}

/**
 * Export database instance for queries
 */
export const db = dbConnection

export default dbConnection 