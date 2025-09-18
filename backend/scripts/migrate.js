// Database Migration Script - Create all tables for CodeAnalyst
import pkg from 'pg'
import dotenv from 'dotenv'
// import { logger } from '../src/utils/logger.js'
const logger = {
  info: console.log,
  error: console.error
}

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
  },
  {
    name: 'Create content_templates table',
    sql: `
      CREATE TABLE IF NOT EXISTS content_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'about-us', 'product-description'
        name VARCHAR(255) NOT NULL, -- e.g., 'About Us Page'
        description TEXT, -- Template description for users
        category VARCHAR(100) NOT NULL, -- e.g., 'website', 'ecommerce', 'marketing'
        icon VARCHAR(10), -- Emoji icon for UI
        
        -- Input field configuration (JSON structure)
        input_fields JSONB NOT NULL, -- Array of field definitions
        
        -- AI prompt configuration
        prompt_template TEXT NOT NULL, -- Template with placeholders
        
        -- Output structure definition
        output_structure JSONB NOT NULL, -- Array of content sections
        
        -- Default AI settings
        default_settings JSONB DEFAULT '{
          "temperature": 0.7,
          "tone": "professional",
          "style": "detailed",
          "audience": "general"
        }',
        
        -- Metadata
        estimated_words INTEGER DEFAULT 500,
        difficulty VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category);
      CREATE INDEX IF NOT EXISTS idx_content_templates_active ON content_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_content_templates_sort ON content_templates(sort_order);
    `
  },
  {
    name: 'Create generated_content table',
    sql: `
      CREATE TABLE IF NOT EXISTS generated_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id VARCHAR(100) NOT NULL REFERENCES content_templates(template_id),
        
        -- Content generation inputs
        input_data JSONB NOT NULL, -- User inputs used for generation
        generation_settings JSONB NOT NULL, -- AI settings used (temperature, tone, etc.)
        
        -- Generated content
        content_sections JSONB NOT NULL, -- Generated content by section
        raw_content TEXT, -- Raw AI-generated text before processing
        formatted_content JSONB, -- Formatted content for different export types
        
        -- Content metadata
        title VARCHAR(500), -- User-defined title for the content
        status VARCHAR(50) DEFAULT 'draft', -- draft, approved, published, archived
        version INTEGER DEFAULT 1, -- Version number for tracking edits
        parent_content_id UUID REFERENCES generated_content(id), -- For versioning
        
        -- AI generation metadata
        ai_provider VARCHAR(50), -- openai, anthropic, google
        ai_model VARCHAR(100), -- gpt-4-turbo, claude-3, etc.
        token_count INTEGER, -- Tokens used in generation
        generation_time_ms INTEGER, -- Time taken to generate
        cost_estimate DECIMAL(10,6), -- Estimated cost in USD
        
        -- Content statistics
        word_count INTEGER,
        character_count INTEGER,
        estimated_reading_time INTEGER, -- In minutes
        
        -- User interaction
        last_edited_at TIMESTAMP,
        export_count INTEGER DEFAULT 0, -- How many times exported
        view_count INTEGER DEFAULT 0, -- How many times viewed
        
        -- Export tracking
        exported_formats TEXT[], -- Array of export formats used
        last_exported_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
      CREATE INDEX IF NOT EXISTS idx_generated_content_template_id ON generated_content(template_id);
      CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
      CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_generated_content_parent ON generated_content(parent_content_id);
      CREATE INDEX IF NOT EXISTS idx_generated_content_user_status ON generated_content(user_id, status);
    `
  },
  {
    name: 'Create user_content_settings table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_content_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- AI Generation Preferences
        default_ai_provider VARCHAR(50) DEFAULT 'openai', -- openai, anthropic, google
        default_ai_model VARCHAR(100) DEFAULT 'gpt-4-turbo',
        default_temperature DECIMAL(3,2) DEFAULT 0.7, -- 0.0 to 1.0
        
        -- Content Preferences
        default_tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, casual, formal
        default_style VARCHAR(50) DEFAULT 'detailed', -- detailed, concise, creative, technical
        default_audience VARCHAR(50) DEFAULT 'general', -- general, technical, executive, consumer
        default_content_length VARCHAR(50) DEFAULT 'medium', -- short, medium, long, custom
        
        -- Template Preferences
        favorite_templates TEXT[], -- Array of template_ids user uses most
        hidden_templates TEXT[], -- Array of template_ids user wants to hide
        custom_template_order JSONB, -- Custom ordering of templates for this user
        
        -- Export Preferences
        preferred_export_formats TEXT[] DEFAULT ARRAY['html', 'text'], -- html, text, markdown, wordpress
        auto_export_on_generation BOOLEAN DEFAULT false,
        include_metadata_in_export BOOLEAN DEFAULT true,
        
        -- UI Preferences
        show_advanced_settings BOOLEAN DEFAULT false,
        show_word_count BOOLEAN DEFAULT true,
        show_cost_estimates BOOLEAN DEFAULT true,
        auto_save_drafts BOOLEAN DEFAULT true,
        
        -- Workflow Preferences
        require_approval_before_export BOOLEAN DEFAULT false,
        enable_version_tracking BOOLEAN DEFAULT true,
        max_content_history INTEGER DEFAULT 50, -- How many past generations to keep
        
        -- Notification Settings
        notify_on_generation_complete BOOLEAN DEFAULT true,
        notify_on_export_ready BOOLEAN DEFAULT false,
        email_weekly_summary BOOLEAN DEFAULT false,
        
        -- Business Settings (for agencies/teams)
        default_client_name VARCHAR(255), -- For agencies managing multiple clients
        brand_voice_notes TEXT, -- Custom instructions for maintaining brand voice
        content_approval_workflow JSONB, -- Custom approval process if needed
        
        -- Usage Limits (for plan management)
        monthly_generation_limit INTEGER, -- NULL for unlimited
        monthly_generation_count INTEGER DEFAULT 0,
        last_reset_date DATE DEFAULT CURRENT_DATE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure one settings record per user
        UNIQUE(user_id)
      );
      
      -- Create indexes for efficient queries
      CREATE INDEX IF NOT EXISTS idx_user_content_settings_user_id ON user_content_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_content_settings_provider ON user_content_settings(default_ai_provider);
      CREATE INDEX IF NOT EXISTS idx_user_content_settings_reset_date ON user_content_settings(last_reset_date);
    `
  },
  {
    name: 'Add additional performance indexes for content creator',
    sql: `
      -- Additional indexes for content lookup and filtering
      
      -- Content search and filtering indexes
      CREATE INDEX IF NOT EXISTS idx_generated_content_title_search ON generated_content USING gin(to_tsvector('english', title));
      CREATE INDEX IF NOT EXISTS idx_generated_content_template_status ON generated_content(template_id, status);
      CREATE INDEX IF NOT EXISTS idx_generated_content_user_template ON generated_content(user_id, template_id);
      CREATE INDEX IF NOT EXISTS idx_generated_content_user_created ON generated_content(user_id, created_at DESC);
      
      -- Analytics and reporting indexes
      CREATE INDEX IF NOT EXISTS idx_generated_content_ai_provider ON generated_content(ai_provider);
      CREATE INDEX IF NOT EXISTS idx_generated_content_cost_tracking ON generated_content(user_id, created_at, cost_estimate) WHERE cost_estimate IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_generated_content_export_analytics ON generated_content(user_id, export_count, last_exported_at);
      
      -- Template usage analytics
      CREATE INDEX IF NOT EXISTS idx_content_templates_category_active ON content_templates(category, is_active);
      CREATE INDEX IF NOT EXISTS idx_content_templates_difficulty ON content_templates(difficulty, is_active);
      
      -- User settings lookup optimization
      CREATE INDEX IF NOT EXISTS idx_user_content_settings_monthly_usage ON user_content_settings(user_id, monthly_generation_count, last_reset_date);
      
      -- Version tracking and history
      CREATE INDEX IF NOT EXISTS idx_generated_content_version_chain ON generated_content(parent_content_id, version) WHERE parent_content_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_generated_content_latest_versions ON generated_content(user_id, template_id, version DESC) WHERE parent_content_id IS NULL;
      
      -- Performance indexes for dashboard queries
      CREATE INDEX IF NOT EXISTS idx_generated_content_recent_activity ON generated_content(user_id, status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_generated_content_popular_templates ON generated_content(template_id, created_at);
    `
  },
  {
    name: 'Seed content_templates with initial template data',
    sql: `
      -- Insert About Us template
      INSERT INTO content_templates (
        template_id, name, description, category, icon,
        input_fields, prompt_template, output_structure,
        default_settings, estimated_words, difficulty, sort_order
      ) VALUES (
        'about-us',
        'About Us Page',
        'Professional company introduction and story',
        'website',
        '🏢',
        '[
          {"name": "companyName", "type": "text", "label": "Company Name", "placeholder": "e.g., TechCorp Solutions", "required": true},
          {"name": "industry", "type": "text", "label": "Industry", "placeholder": "e.g., Software Development, Marketing, Healthcare", "required": true},
          {"name": "foundedYear", "type": "number", "label": "Founded Year", "placeholder": "2020", "required": false},
          {"name": "mission", "type": "textarea", "label": "Mission/Purpose", "placeholder": "What does your company do and why?", "required": true},
          {"name": "values", "type": "textarea", "label": "Core Values", "placeholder": "List 3-5 core company values", "required": false},
          {"name": "teamSize", "type": "select", "label": "Team Size", "placeholder": "Select team size", "required": false, "options": ["1-5 employees", "6-20 employees", "21-50 employees", "51-200 employees", "200+ employees"]}
        ]'::jsonb,
        'Create a professional {companyName} about us page for a {industry} company founded in {foundedYear}. Include their mission: {mission}, core values: {values}, and team size: {teamSize}. Write in a {tone} tone for {audience} audience.',
        '[
          {"id": "hero", "name": "Hero Section", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "story", "name": "Company Story", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "mission", "name": "Mission Statement", "type": "paragraph", "content": "", "editable": true, "order": 3},
          {"id": "values", "name": "Core Values", "type": "list", "content": "", "editable": true, "order": 4},
          {"id": "team", "name": "Team Introduction", "type": "paragraph", "content": "", "editable": true, "order": 5},
          {"id": "cta", "name": "Call to Action", "type": "cta", "content": "", "editable": true, "order": 6}
        ]'::jsonb,
        '{"temperature": 0.7, "tone": "professional", "style": "detailed", "audience": "general"}'::jsonb,
        800,
        'beginner',
        1
      ) ON CONFLICT (template_id) DO NOTHING;

      -- Insert Product Description template
      INSERT INTO content_templates (
        template_id, name, description, category, icon,
        input_fields, prompt_template, output_structure,
        default_settings, estimated_words, difficulty, sort_order
      ) VALUES (
        'product-description',
        'Product Description',
        'Compelling product descriptions that convert',
        'ecommerce',
        '📦',
        '[
          {"name": "productName", "type": "text", "label": "Product Name", "placeholder": "e.g., Wireless Bluetooth Headphones", "required": true},
          {"name": "productType", "type": "text", "label": "Product Category", "placeholder": "e.g., Electronics, Clothing, Home & Garden", "required": true},
          {"name": "keyFeatures", "type": "textarea", "label": "Key Features", "placeholder": "List the main features and specifications", "required": true},
          {"name": "targetAudience", "type": "text", "label": "Target Audience", "placeholder": "e.g., Tech enthusiasts, professionals, students", "required": true},
          {"name": "priceRange", "type": "select", "label": "Price Range", "placeholder": "Select price range", "required": false, "options": ["Budget ($0-50)", "Mid-range ($50-200)", "Premium ($200-500)", "Luxury ($500+)"]},
          {"name": "uniqueSellingPoint", "type": "textarea", "label": "What makes it special?", "placeholder": "What sets this product apart from competitors?", "required": true}
        ]'::jsonb,
        'Create a compelling product description for {productName}, a {productType} product. Target audience: {targetAudience}. Key features: {keyFeatures}. Unique selling point: {uniqueSellingPoint}. Price range: {priceRange}. Write in a {tone} tone that encourages purchase.',
        '[
          {"id": "headline", "name": "Product Headline", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "overview", "name": "Product Overview", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "features", "name": "Key Features", "type": "list", "content": "", "editable": true, "order": 3},
          {"id": "benefits", "name": "Benefits", "type": "paragraph", "content": "", "editable": true, "order": 4},
          {"id": "specifications", "name": "Specifications", "type": "list", "content": "", "editable": true, "order": 5},
          {"id": "cta", "name": "Purchase CTA", "type": "cta", "content": "", "editable": true, "order": 6}
        ]'::jsonb,
        '{"temperature": 0.8, "tone": "persuasive", "style": "engaging", "audience": "consumer"}'::jsonb,
        400,
        'beginner',
        2
      ) ON CONFLICT (template_id) DO NOTHING;

      -- Insert Service Description template
      INSERT INTO content_templates (
        template_id, name, description, category, icon,
        input_fields, prompt_template, output_structure,
        default_settings, estimated_words, difficulty, sort_order
      ) VALUES (
        'service-description',
        'Service Description',
        'Professional service descriptions that build trust',
        'website',
        '🔧',
        '[
          {"name": "serviceName", "type": "text", "label": "Service Name", "placeholder": "e.g., Web Design, Consulting, Marketing", "required": true},
          {"name": "serviceType", "type": "select", "label": "Service Type", "placeholder": "Select service type", "required": true, "options": ["Consulting", "Design", "Development", "Marketing", "Support", "Other"]},
          {"name": "problemSolved", "type": "textarea", "label": "What problem does this solve?", "placeholder": "Describe the main problem your service addresses", "required": true},
          {"name": "process", "type": "textarea", "label": "Service Process", "placeholder": "Briefly describe how you deliver this service", "required": true},
          {"name": "deliverables", "type": "textarea", "label": "What do clients get?", "placeholder": "List key deliverables or outcomes", "required": true},
          {"name": "experience", "type": "text", "label": "Years of Experience", "placeholder": "e.g., 5+ years", "required": false}
        ]'::jsonb,
        'Create a professional service description for {serviceName}, a {serviceType} service. Problem solved: {problemSolved}. Process: {process}. Deliverables: {deliverables}. Experience: {experience}. Write in a {tone} tone that builds trust and expertise.',
        '[
          {"id": "headline", "name": "Service Headline", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "problem", "name": "Problem Statement", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "solution", "name": "Our Solution", "type": "paragraph", "content": "", "editable": true, "order": 3},
          {"id": "process", "name": "How We Work", "type": "list", "content": "", "editable": true, "order": 4},
          {"id": "deliverables", "name": "What You Get", "type": "list", "content": "", "editable": true, "order": 5},
          {"id": "cta", "name": "Get Started CTA", "type": "cta", "content": "", "editable": true, "order": 6}
        ]'::jsonb,
        '{"temperature": 0.7, "tone": "professional", "style": "authoritative", "audience": "business"}'::jsonb,
        600,
        'intermediate',
        3
      ) ON CONFLICT (template_id) DO NOTHING;

      -- Insert Blog Post template
      INSERT INTO content_templates (
        template_id, name, description, category, icon,
        input_fields, prompt_template, output_structure,
        default_settings, estimated_words, difficulty, sort_order
      ) VALUES (
        'blog-post',
        'Blog Post',
        'Engaging blog posts that inform and engage',
        'content',
        '📝',
        '[
          {"name": "title", "type": "text", "label": "Blog Post Title", "placeholder": "e.g., 10 Tips for Better Productivity", "required": true},
          {"name": "topic", "type": "text", "label": "Main Topic", "placeholder": "e.g., Productivity, Marketing, Technology", "required": true},
          {"name": "audience", "type": "select", "label": "Target Audience", "placeholder": "Select target audience", "required": true, "options": ["General Public", "Professionals", "Entrepreneurs", "Students", "Experts"]},
          {"name": "keyPoints", "type": "textarea", "label": "Key Points to Cover", "placeholder": "List 3-5 main points you want to discuss", "required": true},
          {"name": "callToAction", "type": "text", "label": "Call to Action", "placeholder": "What should readers do after reading?", "required": false},
          {"name": "tone", "type": "select", "label": "Writing Tone", "placeholder": "Select tone", "required": false, "options": ["Informative", "Conversational", "Professional", "Entertaining", "Authoritative"]}
        ]'::jsonb,
        'Write an engaging blog post titled "{title}" about {topic}. Target audience: {audience}. Cover these key points: {keyPoints}. Include a call to action: {callToAction}. Write in a {tone} tone that keeps readers engaged.',
        '[
          {"id": "introduction", "name": "Introduction", "type": "paragraph", "content": "", "editable": true, "order": 1},
          {"id": "main-content", "name": "Main Content", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "key-points", "name": "Key Points", "type": "list", "content": "", "editable": true, "order": 3},
          {"id": "conclusion", "name": "Conclusion", "type": "paragraph", "content": "", "editable": true, "order": 4},
          {"id": "cta", "name": "Call to Action", "type": "cta", "content": "", "editable": true, "order": 5}
        ]'::jsonb,
        '{"temperature": 0.8, "tone": "conversational", "style": "engaging", "audience": "general"}'::jsonb,
        1200,
        'intermediate',
        4
      ) ON CONFLICT (template_id) DO NOTHING;

      -- Insert Landing Page template
      INSERT INTO content_templates (
        template_id, name, description, category, icon,
        input_fields, prompt_template, output_structure,
        default_settings, estimated_words, difficulty, sort_order
      ) VALUES (
        'landing-page',
        'Landing Page',
        'High-converting landing pages for campaigns',
        'marketing',
        '🎯',
        '[
          {"name": "productService", "type": "text", "label": "Product/Service Name", "placeholder": "e.g., Email Marketing Course", "required": true},
          {"name": "mainBenefit", "type": "text", "label": "Main Benefit", "placeholder": "e.g., Increase email open rates by 50%", "required": true},
          {"name": "targetPain", "type": "textarea", "label": "Target Pain Point", "placeholder": "What problem does your audience have?", "required": true},
          {"name": "socialProof", "type": "text", "label": "Social Proof", "placeholder": "e.g., Trusted by 10,000+ marketers", "required": false},
          {"name": "offer", "type": "text", "label": "Special Offer", "placeholder": "e.g., 50% off for limited time", "required": false},
          {"name": "urgency", "type": "text", "label": "Urgency Element", "placeholder": "e.g., Only 100 spots available", "required": false}
        ]'::jsonb,
        'Create a high-converting landing page for {productService}. Main benefit: {mainBenefit}. Target pain: {targetPain}. Social proof: {socialProof}. Offer: {offer}. Urgency: {urgency}. Write in a {tone} tone that drives conversions.',
        '[
          {"id": "headline", "name": "Main Headline", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "subheadline", "name": "Sub-headline", "type": "heading", "content": "", "editable": true, "order": 2},
          {"id": "problem", "name": "Problem Statement", "type": "paragraph", "content": "", "editable": true, "order": 3},
          {"id": "solution", "name": "Solution Overview", "type": "paragraph", "content": "", "editable": true, "order": 4},
          {"id": "benefits", "name": "Key Benefits", "type": "list", "content": "", "editable": true, "order": 5},
          {"id": "social-proof", "name": "Social Proof", "type": "paragraph", "content": "", "editable": true, "order": 6},
          {"id": "cta-primary", "name": "Primary CTA", "type": "cta", "content": "", "editable": true, "order": 7}
        ]'::jsonb,
        '{"temperature": 0.9, "tone": "persuasive", "style": "compelling", "audience": "prospect"}'::jsonb,
        800,
        'advanced',
        5
      ) ON CONFLICT (template_id) DO NOTHING;
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
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runMigrations().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export { runMigrations } 