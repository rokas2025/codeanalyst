/**
 * Database Migration Script
 * Run WordPress Connections Table Migration
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import { db, initDatabase } from '../src/database/connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

async function runMigration() {
  try {
    console.log('🔄 Starting WordPress connections table migration...')
    
    // Initialize database connection
    await initDatabase()
    console.log('✅ Database connected')
    
    // Read the migration SQL file
    const sqlFilePath = join(__dirname, 'migrate-wordpress-connections.sql')
    const sql = readFileSync(sqlFilePath, 'utf-8')
    
    // Execute the migration
    console.log('⚙️  Executing migration SQL...')
    const result = await db.query(sql)
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the table exists
    const verifyQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wordpress_connections'
      ORDER BY ordinal_position
    `
    
    const verification = await db.query(verifyQuery)
    
    console.log('\n📊 Table Structure:')
    console.log('-------------------')
    verification.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type}`)
    })
    
    // Check indexes
    const indexQuery = `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'wordpress_connections'
    `
    
    const indexes = await db.query(indexQuery)
    
    console.log('\n🔍 Indexes:')
    console.log('-----------')
    indexes.rows.forEach(row => {
      console.log(`  ${row.indexname}`)
    })
    
    console.log('\n✨ WordPress connections table is ready to use!')
    
    // Close database connection
    await db.close()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

runMigration()

