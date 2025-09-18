// Simple database connection test
import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

console.log('🔍 Database Connection Test')
console.log('DB_HOST:', process.env.DB_HOST || 'not set')
console.log('DB_NAME:', process.env.DB_NAME || 'not set')
console.log('DB_USER:', process.env.DB_USER || 'not set')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function testConnection() {
  try {
    console.log('\n🚀 Attempting database connection...')
    const client = await pool.connect()
    console.log('✅ Connected to database successfully!')
    
    const result = await client.query('SELECT NOW() as current_time')
    console.log('✅ Query test successful:', result.rows[0].current_time)
    
    // Check if users table exists (from existing migration)
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `)
    console.log('✅ Users table exists:', tableCheck.rows[0].exists)
    
    client.release()
    await pool.end()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
  }
}

testConnection()
