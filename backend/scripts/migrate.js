// Database Migration Script - Create all tables for CodeAnalyst
import pkg from 'pg'
import dotenv from 'dotenv'
import { logger } from '../src/utils/logger.js'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'codeanalyst',
  user: process.env.DB_USER || 'ghostarcade.xyz',
  password: process.env.DB_PASSWORD || '',
  ssl: false
})

const migrations = [
  {
    name: 'Create users table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        github_username VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        api_usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'Create projects table',
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        source_url TEXT,
        github_repo VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'Create url_analyses table',
    sql: `
      CREATE TABLE IF NOT EXISTS url_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        
        -- Raw scan data
        html_content TEXT,
        basic_website_data JSONB,
        meta_tags JSONB,
        technologies TEXT[],
        scripts JSONB,
        stylesheets JSONB,
        links JSONB,
        images JSONB,
        
        -- Analysis metrics
        performance_metrics JSONB,
        seo_analysis JSONB,
        accessibility_analysis JSONB,
        security_analysis JSONB,
        
        -- AI analysis results
        ai_insights JSONB,
        business_recommendations JSONB,
        technical_recommendations JSONB,
        risk_assessment JSONB,
        
        -- Metadata
        analysis_duration_ms INTEGER,
        ai_provider VARCHAR(50),
        ai_model VARCHAR(100),
        confidence_score DECIMAL(3,2),
        error_message TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `
  },
  {
    name: 'Create code_analyses table',
    sql: `
      CREATE TABLE IF NOT EXISTS code_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        source_reference TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        
        -- Code structure
        total_files INTEGER,
        total_lines INTEGER,
        languages TEXT[],
        frameworks TEXT[],
        
        -- Quality metrics
        code_quality_score INTEGER,
        technical_debt_percentage DECIMAL(5,2),
        test_coverage_percentage DECIMAL(5,2),
        complexity_score DECIMAL(8,2),
        
        -- AI analysis
        system_overview JSONB,
        technical_structure JSONB,
        maintenance_needs JSONB,
        ai_explanations JSONB,
        business_recommendations JSONB,
        risk_assessment JSONB,
        
        -- Execution results
        test_results JSONB,
        build_results JSONB,
        static_analysis_results JSONB,
        
        -- Metadata
        analysis_duration_ms INTEGER,
        error_message TEXT,
        metadata JSONB,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `
  },
  {
    name: 'Create ai_response_cache table',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_response_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        input_hash VARCHAR(64) UNIQUE NOT NULL,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        prompt_text TEXT NOT NULL,
        response_text TEXT NOT NULL,
        confidence_score DECIMAL(3,2),
        token_count INTEGER,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      );
    `
  },
  {
    name: 'Create api_usage_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        analysis_id UUID,
        analysis_type VARCHAR(50),
        provider VARCHAR(50),
        model VARCHAR(100),
        tokens_used INTEGER,
        cost_usd DECIMAL(10,4),
        duration_ms INTEGER,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'Create indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_url_analyses_user_id ON url_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_url_analyses_status ON url_analyses(status);
      CREATE INDEX IF NOT EXISTS idx_code_analyses_user_id ON code_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_code_analyses_status ON code_analyses(status);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_response_cache(input_hash);
      CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage_logs(user_id, created_at);
    `
  },
  {
    name: 'Create updated_at trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
  },
  {
    name: 'Create triggers for updated_at',
    sql: `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_url_analyses_updated_at ON url_analyses;
      CREATE TRIGGER update_url_analyses_updated_at BEFORE UPDATE ON url_analyses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_code_analyses_updated_at ON code_analyses;
      CREATE TRIGGER update_code_analyses_updated_at BEFORE UPDATE ON code_analyses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  }
]

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    logger.info('🚀 Starting database migration...')
    
    for (const migration of migrations) {
      logger.info(`📝 Running: ${migration.name}`)
      await client.query(migration.sql)
      logger.info(`✅ Completed: ${migration.name}`)
    }
    
    logger.info('🎉 All database migrations completed successfully!')
    
  } catch (error) {
    logger.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export { runMigrations } 