-- CodeAnalyst Database Schema
-- Stores all analysis results, user sessions, and AI insights

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    github_id BIGINT UNIQUE,
    github_username VARCHAR(255),
    github_access_token TEXT,
    avatar_url TEXT,
    plan VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    api_usage_count INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- github, zip, url, wordpress
    source_url TEXT,
    github_repo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, paused, archived
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website analyses
CREATE TABLE url_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, analyzing, completed, failed
    
    -- Raw scan data
    html_content TEXT,
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
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Code analyses (for ZIP/GitHub uploads)
CREATE TABLE code_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- zip, github
    source_reference TEXT, -- filename or repo URL
    status VARCHAR(50) DEFAULT 'pending',
    
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
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis cache (to avoid duplicate API calls)
CREATE TABLE ai_response_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of input
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

-- User API usage tracking
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID, -- can reference either url_analyses or code_analyses
    analysis_type VARCHAR(50), -- url, code, content, auto_programmer, content_creator
    provider VARCHAR(50),
    model VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis history and comparisons
CREATE TABLE analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50), -- url, code
    analysis_id UUID NOT NULL, -- reference to specific analysis
    
    -- Comparison metrics
    previous_score INTEGER,
    current_score INTEGER,
    score_change INTEGER,
    
    -- Change summary
    changes_detected JSONB,
    improvement_areas TEXT[],
    regression_areas TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_url_analyses_project_id ON url_analyses(project_id);
CREATE INDEX idx_code_analyses_project_id ON code_analyses(project_id);
CREATE INDEX idx_ai_cache_hash ON ai_response_cache(input_hash);
CREATE INDEX idx_api_usage_user_date ON api_usage_logs(user_id, created_at);
CREATE INDEX idx_analysis_history_project ON analysis_history(project_id, created_at);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_url_analyses_updated_at BEFORE UPDATE ON url_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_code_analyses_updated_at BEFORE UPDATE ON code_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 