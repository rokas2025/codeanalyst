import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function seedTemplates() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Seeding content templates...')
    
    // Insert About Us template
    await client.query(`
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
    `)
    console.log('✅ About Us template seeded')

    // Insert other templates...
    await client.query(`
      INSERT INTO content_templates (template_id, name, description, category, icon, input_fields, prompt_template, output_structure, default_settings, estimated_words, difficulty, sort_order)
      VALUES 
      ('product-description', 'Product Description', 'Compelling product descriptions that convert', 'ecommerce', '📦', 
       '[{"name": "productName", "type": "text", "label": "Product Name", "placeholder": "e.g., Wireless Bluetooth Headphones", "required": true}]'::jsonb,
       'Create a compelling product description for {productName}',
       '[{"id": "headline", "name": "Product Headline", "type": "heading", "content": "", "editable": true, "order": 1}]'::jsonb,
       '{"temperature": 0.8, "tone": "persuasive", "style": "engaging", "audience": "consumer"}'::jsonb, 400, 'beginner', 2),
      ('service-description', 'Service Description', 'Professional service descriptions that build trust', 'website', '🔧',
       '[{"name": "serviceName", "type": "text", "label": "Service Name", "placeholder": "e.g., Web Design", "required": true}]'::jsonb,
       'Create a professional service description for {serviceName}',
       '[{"id": "headline", "name": "Service Headline", "type": "heading", "content": "", "editable": true, "order": 1}]'::jsonb,
       '{"temperature": 0.7, "tone": "professional", "style": "authoritative", "audience": "business"}'::jsonb, 600, 'intermediate', 3),
      ('blog-post', 'Blog Post', 'Engaging blog posts that inform and engage', 'content', '📝',
       '[{"name": "title", "type": "text", "label": "Blog Post Title", "placeholder": "e.g., 10 Tips for Better Productivity", "required": true}]'::jsonb,
       'Write an engaging blog post titled "{title}"',
       '[{"id": "introduction", "name": "Introduction", "type": "paragraph", "content": "", "editable": true, "order": 1}]'::jsonb,
       '{"temperature": 0.8, "tone": "conversational", "style": "engaging", "audience": "general"}'::jsonb, 1200, 'intermediate', 4),
      ('landing-page', 'Landing Page', 'High-converting landing pages for campaigns', 'marketing', '🎯',
       '[{"name": "productService", "type": "text", "label": "Product/Service Name", "placeholder": "e.g., Email Marketing Course", "required": true}]'::jsonb,
       'Create a high-converting landing page for {productService}',
       '[{"id": "headline", "name": "Main Headline", "type": "heading", "content": "", "editable": true, "order": 1}]'::jsonb,
       '{"temperature": 0.9, "tone": "persuasive", "style": "compelling", "audience": "prospect"}'::jsonb, 800, 'advanced', 5)
      ON CONFLICT (template_id) DO NOTHING;
    `)
    console.log('✅ All templates seeded')
    
    const result = await client.query('SELECT template_id, name FROM content_templates ORDER BY sort_order')
    console.log('📋 Templates in database:')
    result.rows.forEach(row => console.log(`  - ${row.template_id}: ${row.name}`))
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

seedTemplates()
