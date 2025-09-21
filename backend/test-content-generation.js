// Test content generation components
import dotenv from 'dotenv'
import { ContentGenerationService } from './src/services/ContentGenerationService.js'
import { db } from './src/database/connection.js'

dotenv.config()

async function testContentGeneration() {
  console.log('🧪 Testing Content Generation Components...\n')
  
  try {
    // Test 1: Environment Variables
    console.log('1️⃣ Testing Environment Variables:')
    console.log('   OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY)
    console.log('   NODE_ENV:', process.env.NODE_ENV)
    console.log('   DATABASE_URL present:', !!process.env.DATABASE_URL)
    console.log('')
    
    // Test 2: Database Connection
    console.log('2️⃣ Testing Database Connection:')
    try {
      const result = await db.query('SELECT COUNT(*) FROM content_templates WHERE is_active = true')
      console.log('   Templates in DB:', result.rows[0].count)
      console.log('   ✅ Database connection working')
    } catch (dbError) {
      console.log('   ❌ Database error:', dbError.message)
      return
    }
    console.log('')
    
    // Test 3: ContentGenerationService Initialization
    console.log('3️⃣ Testing ContentGenerationService:')
    try {
      const service = new ContentGenerationService()
      const hasProviders = service.hasAnyProvider()
      console.log('   Has AI providers:', hasProviders)
      
      if (hasProviders) {
        console.log('   ✅ ContentGenerationService initialized')
      } else {
        console.log('   ❌ No AI providers available')
        return
      }
    } catch (serviceError) {
      console.log('   ❌ Service initialization error:', serviceError.message)
      return
    }
    console.log('')
    
    // Test 4: Template Retrieval
    console.log('4️⃣ Testing Template Retrieval:')
    try {
      const templateResult = await db.query(
        'SELECT * FROM content_templates WHERE template_id = $1 AND is_active = true',
        ['about-us']
      )
      
      if (templateResult.rows.length > 0) {
        console.log('   ✅ Template "about-us" found')
        console.log('   Template name:', templateResult.rows[0].name)
      } else {
        console.log('   ❌ Template "about-us" not found')
        return
      }
    } catch (templateError) {
      console.log('   ❌ Template retrieval error:', templateError.message)
      return
    }
    console.log('')
    
    console.log('✅ All basic components are working!')
    console.log('💡 If still getting 500 errors, check Railway logs for detailed error messages')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    process.exit(0)
  }
}

testContentGeneration()
