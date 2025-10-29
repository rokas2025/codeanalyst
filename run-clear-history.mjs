#!/usr/bin/env node

/**
 * Clear Analysis History (Privacy Fix)
 * This script deletes all existing analysis history to ensure privacy
 */

import pg from 'pg'

const { Client } = pg

// Use the same DATABASE_URL as run-translations.mjs
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.ecwpwmsqanlatfntzoul:j7PLA9pc0FOvi20U@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

console.log('🗑️  Clear Analysis History Script\n')

async function clearHistory() {
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

    // Check current count
    console.log('📊 Checking current analysis history...')
    const countResult = await client.query('SELECT COUNT(*) as count FROM analysis_history')
    const currentCount = countResult.rows[0].count
    console.log(`   Current records: ${currentCount}\n`)

    if (currentCount === '0') {
      console.log('✅ Analysis history is already empty!')
      return
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will delete ALL analysis history!')
    console.log('   This is necessary for privacy - each user will only see their own scans going forward.\n')

    // Delete all records
    console.log('🗑️  Deleting all analysis history...')
    await client.query('TRUNCATE TABLE analysis_history CASCADE')
    console.log('✅ Analysis history cleared!\n')

    // Verify
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM analysis_history')
    const finalCount = verifyResult.rows[0].count
    console.log(`📊 Final count: ${finalCount} records`)

    console.log('\n🎉 History cleared successfully!')
    console.log('\n📋 Privacy fix applied:')
    console.log('   - All old analysis history deleted')
    console.log('   - Going forward, users will only see their own scans')
    console.log('   - Backend API will filter by user_id')

  } catch (error) {
    console.error('\n❌ Failed to clear history:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run script
clearHistory()

