/**
 * Database Migration Runner
 * 
 * This script runs the user management migration on your Supabase database.
 * 
 * Usage:
 *   node run-migration.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   OR
 *   - DATABASE_URL in .env (direct PostgreSQL connection)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Starting User Management Migration...\n')

// Check if we have Supabase credentials
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please add to your .env file:')
  console.error('  SUPABASE_URL=your_supabase_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\nYou can find these in your Supabase Dashboard → Settings → API')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('📖 Reading migration file...')
    const migrationPath = path.join(__dirname, 'src/database/user-management-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Executing migration...')
    console.log('   This will:')
    console.log('   - Create new tables (user_roles, projects, project_users, module_permissions)')
    console.log('   - Add columns to users table')
    console.log('   - Create superadmin: rokas@zubas.lt')
    console.log('   - Set up RLS policies\n')
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // Try alternative method - split and execute statements
      console.log('⚠️  RPC method failed, trying direct execution...')
      await executeSQLStatements(migrationSQL)
    } else {
      console.log('✅ Migration executed successfully!')
    }
    
    // Verify superadmin was created
    console.log('\n🔍 Verifying superadmin account...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('email', 'rokas@zubas.lt')
      .single()
    
    if (userError) {
      console.error('❌ Could not verify superadmin:', userError.message)
    } else {
      console.log('✅ Superadmin verified:')
      console.log(`   Email: ${users.email}`)
      console.log(`   Name: ${users.name}`)
      console.log(`   Active: ${users.is_active}`)
    }
    
    // Check role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', users.id)
    
    if (!roleError && roles.length > 0) {
      console.log(`   Role: ${roles[0].role}`)
    }
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test login: rokas@zubas.lt / Beenex2025!')
    console.log('   2. Run: node run-clear-history.js (to clear analysis history)')
    console.log('   3. Restart your backend server')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Dashboard')
    console.error('   1. Go to Supabase Dashboard → SQL Editor')
    console.error('   2. Copy contents of: backend/src/database/user-management-migration.sql')
    console.error('   3. Paste and click "Run"')
    process.exit(1)
  }
}

async function executeSQLStatements(sql) {
  // Split SQL into individual statements (basic split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`   Executing ${statements.length} SQL statements...`)
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement.length < 10) continue // Skip very short statements
    
    try {
      await supabase.rpc('exec_sql', { sql: statement + ';' })
      process.stdout.write(`\r   Progress: ${i + 1}/${statements.length}`)
    } catch (error) {
      // Some statements might fail if they already exist, that's OK
      if (!error.message.includes('already exists')) {
        console.error(`\n⚠️  Statement ${i + 1} failed:`, error.message)
      }
    }
  }
  console.log('\n')
}

// Run migration
runMigration()

