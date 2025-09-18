import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function quickTest() {
  const client = await pool.connect()
  
  try {
    console.log('Testing content creator tables...')
    
    // Check content_templates table
    const result = await client.query(`
      SELECT COUNT(*) as count FROM content_templates
    `)
    console.log('content_templates count:', result.rows[0].count)
    
    if (result.rows[0].count > 0) {
      const templates = await client.query('SELECT template_id, name FROM content_templates ORDER BY sort_order')
      console.log('Templates found:')
      templates.rows.forEach(row => console.log(`- ${row.template_id}: ${row.name}`))
    }
    
  } catch (error) {
    console.log('Error:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('Tables not created yet - need to run migration')
    }
  } finally {
    client.release()
    await pool.end()
  }
}

quickTest()
