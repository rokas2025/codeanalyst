// Auto-seeding script for Railway deployment
import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function autoSeed() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking content templates...')
    
    // Check if templates exist
    const templatesCheck = await client.query('SELECT COUNT(*) FROM content_templates WHERE is_active = true')
    const templateCount = parseInt(templatesCheck.rows[0].count)
    
    console.log(`📊 Found ${templateCount} active templates`)
    
    if (templateCount === 0) {
      console.log('🌱 Seeding initial templates...')
      
      // Insert About Us template
      await client.query(`
        INSERT INTO content_templates (
          template_id, name, description, category, icon,
          input_fields, prompt_template, output_structure,
          default_settings, estimated_words, difficulty, sort_order, is_active
        ) VALUES (
          'about-us',
          'About Us Page',
          'Professional company introduction and story',
          'website',
          '🏢',
          $1,
          'Create a professional about us page for {companyName}, a {industry} company. Include their mission: {mission}. Write in a {tone} tone for {audience} audience.',
          $2,
          $3,
          800,
          'beginner',
          1,
          true
        ) ON CONFLICT (template_id) DO NOTHING
      `, [
        JSON.stringify([
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
        ]),
        JSON.stringify([
          {"id": "hero", "name": "Hero Section", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "story", "name": "Company Story", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "mission", "name": "Mission Statement", "type": "paragraph", "content": "", "editable": true, "order": 3}
        ]),
        JSON.stringify({"temperature": 0.7, "tone": "professional", "style": "detailed", "audience": "general"})
      ])
      
      // Insert Product Description template
      await client.query(`
        INSERT INTO content_templates (
          template_id, name, description, category, icon,
          input_fields, prompt_template, output_structure,
          default_settings, estimated_words, difficulty, sort_order, is_active
        ) VALUES (
          'product-description',
          'Product Description',
          'Compelling product descriptions that convert',
          'ecommerce',
          '📦',
          $1,
          'Create a compelling product description for {productName}. Key features: {features}. Target audience: {targetAudience}. Make it persuasive and highlight benefits. Write in a {tone} tone.',
          $2,
          $3,
          300,
          'beginner',
          2,
          true
        ) ON CONFLICT (template_id) DO NOTHING
      `, [
        JSON.stringify([
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
        ]),
        JSON.stringify([
          {"id": "title", "name": "Product Title", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "description", "name": "Main Description", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "features", "name": "Features List", "type": "list", "content": "", "editable": true, "order": 3}
        ]),
        JSON.stringify({"temperature": 0.8, "tone": "persuasive", "style": "engaging", "audience": "consumers"})
      ])
      
      // Insert Blog Post template
      await client.query(`
        INSERT INTO content_templates (
          template_id, name, description, category, icon,
          input_fields, prompt_template, output_structure,
          default_settings, estimated_words, difficulty, sort_order, is_active
        ) VALUES (
          'blog-post',
          'Blog Post',
          'Engaging blog posts for your audience',
          'content',
          '📝',
          $1,
          'Write an engaging blog post about {topic} for {audience}. Cover these key points: {keyPoints}. Make it informative and actionable. Write in a {tone} tone.',
          $2,
          $3,
          1200,
          'intermediate',
          3,
          true
        ) ON CONFLICT (template_id) DO NOTHING
      `, [
        JSON.stringify([
          {
            "name": "topic",
            "type": "text",
            "label": "Blog Topic",
            "placeholder": "e.g., 10 Tips for Better Productivity",
            "required": true
          },
          {
            "name": "audience",
            "type": "text",
            "label": "Target Audience",
            "placeholder": "e.g., Small business owners",
            "required": true
          },
          {
            "name": "keyPoints",
            "type": "textarea",
            "label": "Key Points to Cover",
            "placeholder": "List main points (comma-separated)",
            "required": true
          }
        ]),
        JSON.stringify([
          {"id": "title", "name": "Blog Title", "type": "heading", "content": "", "editable": true, "order": 1},
          {"id": "intro", "name": "Introduction", "type": "paragraph", "content": "", "editable": true, "order": 2},
          {"id": "body", "name": "Main Content", "type": "paragraph", "content": "", "editable": true, "order": 3},
          {"id": "conclusion", "name": "Conclusion", "type": "paragraph", "content": "", "editable": true, "order": 4}
        ]),
        JSON.stringify({"temperature": 0.7, "tone": "friendly", "style": "engaging", "audience": "general"})
      ])
      
      console.log('✅ Templates seeded successfully!')
      
      // Verify seeding
      const finalCount = await client.query('SELECT COUNT(*) FROM content_templates WHERE is_active = true')
      console.log(`📊 Final active templates count: ${finalCount.rows[0].count}`)
      
    } else {
      console.log('✅ Templates already exist, skipping seeding')
    }
    
  } catch (error) {
    console.error('❌ Auto-seeding error:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoSeed()
    .then(() => {
      console.log('🎉 Auto-seeding completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Auto-seeding failed:', error)
      process.exit(1)
    })
}

export { autoSeed }
