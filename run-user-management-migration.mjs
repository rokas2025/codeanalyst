#!/usr/bin/env node

/**
 * User Management & Project System Migration Runner
 * This script runs the database migration using the existing DATABASE_URL
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use the same DATABASE_URL as run-translations.mjs
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.ecwpwmsqanlatfntzoul:j7PLA9pc0FOvi20U@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

console.log('🚀 Starting User Management Migration...\n')

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Connect to database
    console.log('📡 Connecting to Supabase...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Read migration file
    console.log('📄 Reading migration SQL...')
    const migrationPath = path.join(__dirname, 'backend', 'src', 'database', 'user-management-migration.sql')
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('✅ Migration file loaded\n')

    // Execute migration
    console.log('⚡ Executing migration...')
    console.log('   This will:')
    console.log('   - Create user_roles, projects, project_users, module_permissions tables')
    console.log('   - Add columns to users table (is_active, pending_approval, etc.)')
    console.log('   - Add project_id to wordpress_connections and analysis_history')
    console.log('   - Create superadmin: rokas@zubas.lt / Beenex2025!')
    console.log('   - Set up RLS policies\n')

    // Remove SQL comments
    migrationSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')

    // Execute the entire migration as one transaction
    try {
      await client.query(migrationSQL)
      console.log('✅ Migration executed successfully!\n')
    } catch (error) {
      // If batch execution fails, try to give more context
      console.error('❌ Batch execution failed:', error.message)
      console.error('\n💡 This might be due to:')
      console.error('   - Tables already exist (run DROP TABLE first if needed)')
      console.error('   - Syntax errors in SQL')
      console.error('   - Permission issues')
      throw error
    }

    // Verify superadmin was created
    console.log('🔍 Verifying superadmin account...')
    const result = await client.query(`
      SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = 'rokas@zubas.lt'
    `)

    if (result.rows.length > 0) {
      const user = result.rows[0]
      console.log('✅ Superadmin verified:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   Pending Approval: ${user.pending_approval}`)
    } else {
      console.log('⚠️  Superadmin not found - check migration logs')
    }

    console.log('\n🎉 Migration complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test login: rokas@zubas.lt / Beenex2025!')
    console.log('   2. Run: node run-clear-history.mjs (to delete old analysis data)')
    console.log('   3. Continue with backend/frontend implementation')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    if (error.message.includes('already exists')) {
      console.error('\n💡 Some objects already exist. This is usually OK.')
      console.error('   The migration uses IF NOT EXISTS where possible.')
    }
    console.error('\n📄 Full error details:')
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run migration
runMigration()
