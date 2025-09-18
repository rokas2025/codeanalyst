// Test Migration Script - Verify content creator tables
import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'codeanalyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production'
})

async function testMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Testing Content Creator Migration...')
    
    // Test 1: Check if content_templates table exists
    console.log('\n1. Checking content_templates table...')
    const templatesResult = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'content_templates' 
      ORDER BY ordinal_position;
    `)
    
    if (templatesResult.rows.length > 0) {
      console.log('✅ content_templates table exists with columns:')
      templatesResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`)
      })
    } else {
      console.log('❌ content_templates table not found')
    }
    
    // Test 2: Check if generated_content table exists
    console.log('\n2. Checking generated_content table...')
    const contentResult = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'generated_content' 
      ORDER BY ordinal_position;
    `)
    
    if (contentResult.rows.length > 0) {
      console.log('✅ generated_content table exists with columns:')
      contentResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`)
      })
    } else {
      console.log('❌ generated_content table not found')
    }
    
    // Test 3: Check if user_content_settings table exists
    console.log('\n3. Checking user_content_settings table...')
    const settingsResult = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_content_settings' 
      ORDER BY ordinal_position;
    `)
    
    if (settingsResult.rows.length > 0) {
      console.log('✅ user_content_settings table exists with columns:')
      settingsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`)
      })
    } else {
      console.log('❌ user_content_settings table not found')
    }
    
    // Test 4: Check template seeding
    console.log('\n4. Checking template data...')
    const templateDataResult = await client.query(`
      SELECT template_id, name, category, difficulty, estimated_words 
      FROM content_templates 
      ORDER BY sort_order;
    `)
    
    if (templateDataResult.rows.length > 0) {
      console.log('✅ Template data seeded successfully:')
      templateDataResult.rows.forEach(row => {
        console.log(`   - ${row.template_id}: ${row.name} (${row.category}, ${row.difficulty}, ~${row.estimated_words} words)`)
      })
    } else {
      console.log('❌ No template data found')
    }
    
    // Test 5: Check indexes
    console.log('\n5. Checking indexes...')
    const indexResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('content_templates', 'generated_content', 'user_content_settings')
      ORDER BY tablename, indexname;
    `)
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Indexes created:')
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}: ${row.indexname}`)
      })
    } else {
      console.log('❌ No indexes found')
    }
    
    // Test 6: Check foreign key relationships
    console.log('\n6. Checking foreign key relationships...')
    const fkResult = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('content_templates', 'generated_content', 'user_content_settings');
    `)
    
    if (fkResult.rows.length > 0) {
      console.log('✅ Foreign key relationships:')
      fkResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`)
      })
    } else {
      console.log('⚠️  No foreign key relationships found (may be expected)')
    }
    
    console.log('\n🎉 Migration test completed!')
    
  } catch (error) {
    console.error('❌ Migration test failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigration().catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}
