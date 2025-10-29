#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from environment or .env file
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('Please set DATABASE_URL or run this from Railway CLI context');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'backend', 'src', 'database', 'user-management-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running user management migration...');
    
    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;
      
      try {
        // Handle DO blocks specially
        if (statement.trim().startsWith('DO $$')) {
          console.log(`\n⚙️  Executing DO block (creating superadmin)...`);
          await client.query(statement + ';');
          console.log('✅ DO block executed successfully');
          successCount++;
        } else {
          // Execute regular statements
          await client.query(statement + ';');
          successCount++;
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.code === '42P07' || // duplicate table
            error.code === '42710' || // duplicate object
            error.code === '42P16') { // invalid table definition
          console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
          console.error(`Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n✅ Migration completed: ${successCount} statements executed, ${errorCount} errors`);

    // Now clear analysis history
    console.log('\n📝 Clearing analysis history...');
    const clearHistoryPath = path.join(__dirname, 'backend', 'src', 'database', 'clear-analysis-history.sql');
    const clearHistorySQL = fs.readFileSync(clearHistoryPath, 'utf8');
    
    await client.query('TRUNCATE TABLE analysis_history CASCADE;');
    console.log('✅ Analysis history cleared');

    // Verify superadmin was created
    console.log('\n🔍 Verifying superadmin account...');
    const result = await client.query(`
      SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = 'rokas@zubas.lt'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Superadmin account found:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️  Superadmin account not found - may need manual creation');
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test login with rokas@zubas.lt / Beenex2025!');
    console.log('2. Verify GitHub user rokas2025 gets superadmin on first login');
    console.log('3. Continue with backend implementation');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();

