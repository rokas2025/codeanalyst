import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkAndSeed() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking database connection...')
    
    // Check if templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_templates'
      );
    `)
    
    console.log('📋 Templates table exists:', tableCheck.rows[0].exists)
    
    if (tableCheck.rows[0].exists) {
      // Check existing templates
      const templatesCheck = await client.query('SELECT COUNT(*) FROM content_templates')
      console.log('📊 Existing templates count:', templatesCheck.rows[0].count)
      
      if (parseInt(templatesCheck.rows[0].count) === 0) {
        console.log('🌱 Seeding templates...')
        
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
              {
                "name": "companyName",
                "type": "text",
                "label": "Company Name",
                "placeholder": "e.g., TechCorp Solutions",
                "required": true
              },
              {
                "name": "industry",
                "type": "text",
                "label": "Industry",
                "placeholder": "e.g., Software Development",
                "required": true
              },
              {
                "name": "mission",
                "type": "textarea",
                "label": "Mission Statement",
                "placeholder": "What does your company do and why?",
                "required": true
              }
            ]',
            'Create a professional about us page for {companyName}, a {industry} company. Include their mission: {mission}. Write in a professional tone.',
            '[
              {"id": "hero", "name": "Hero Section", "type": "heading", "content": "", "editable": true, "order": 1},
              {"id": "story", "name": "Company Story", "type": "paragraph", "content": "", "editable": true, "order": 2},
              {"id": "mission", "name": "Mission Statement", "type": "paragraph", "content": "", "editable": true, "order": 3}
            ]',
            '{"temperature": 0.7, "tone": "professional", "style": "detailed", "audience": "general"}',
            800,
            'beginner',
            1
          )
          ON CONFLICT (template_id) DO NOTHING
        `)
        
        // Insert Product Description template
        await client.query(`
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
              {
                "name": "productName",
                "type": "text",
                "label": "Product Name",
                "placeholder": "e.g., Wireless Headphones Pro",
                "required": true
              },
              {
                "name": "features",
                "type": "textarea",
                "label": "Key Features",
                "placeholder": "List main features (comma-separated)",
                "required": true
              },
              {
                "name": "targetAudience",
                "type": "text",
                "label": "Target Audience",
                "placeholder": "e.g., Music professionals, Gamers",
                "required": true
              }
            ]',
            'Create a compelling product description for {productName}. Key features: {features}. Target audience: {targetAudience}. Make it persuasive and highlight benefits.',
            '[
              {"id": "title", "name": "Product Title", "type": "heading", "content": "", "editable": true, "order": 1},
              {"id": "description", "name": "Main Description", "type": "paragraph", "content": "", "editable": true, "order": 2},
              {"id": "features", "name": "Features List", "type": "list", "content": "", "editable": true, "order": 3}
            ]',
            '{"temperature": 0.8, "tone": "persuasive", "style": "engaging", "audience": "consumers"}',
            300,
            'beginner',
            2
          )
          ON CONFLICT (template_id) DO NOTHING
        `)
        
        console.log('✅ Templates seeded successfully!')
        
        // Verify seeding
        const finalCount = await client.query('SELECT COUNT(*) FROM content_templates')
        console.log('📊 Final templates count:', finalCount.rows[0].count)
      } else {
        console.log('✅ Templates already exist')
      }
    } else {
      console.log('❌ Templates table does not exist - run migration first')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    pool.end()
  }
}

checkAndSeed()
