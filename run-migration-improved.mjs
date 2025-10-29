#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
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
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'backend', 'src', 'database', 'user-management-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running user management migration...\n');
    
    // Execute the entire migration as one transaction
    // This preserves DO blocks, functions, and multi-line statements
    try {
      await client.query(migrationSQL);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      // If it fails, try to give helpful error message
      console.error('❌ Migration error:', error.message);
      console.error('\nThis might be because:');
      console.error('1. Some tables already exist (this is OK)');
      console.error('2. The SQL syntax needs adjustment');
      console.error('3. Database permissions issue\n');
      
      // Don't exit - try to continue with verification
    }

    // Now clear analysis history if table exists
    console.log('📝 Clearing analysis history...');
    try {
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'analysis_history'
        );
      `);
      
      if (checkTable.rows[0].exists) {
        await client.query('TRUNCATE TABLE analysis_history CASCADE;');
        console.log('✅ Analysis history cleared\n');
      } else {
        console.log('⚠️  analysis_history table does not exist yet\n');
      }
    } catch (error) {
      console.error('⚠️  Could not clear analysis history:', error.message, '\n');
    }

    // Verify superadmin was created
    console.log('🔍 Verifying superadmin account...');
    try {
      const result = await client.query(`
        SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.email = 'rokas@zubas.lt'
      `);

      if (result.rows.length > 0) {
        console.log('✅ Superadmin account found:');
        console.table(result.rows);
      } else {
        console.log('⚠️  Superadmin account not found\n');
        console.log('Creating superadmin manually...');
        
        // Try to create superadmin manually
        try {
          const createResult = await client.query(`
            WITH new_user AS (
              INSERT INTO users (email, password, name, is_active, pending_approval, approved_at)
              VALUES (
                'rokas@zubas.lt',
                crypt('Beenex2025!', gen_salt('bf')),
                'Rokas Zubas',
                true,
                false,
                NOW()
              )
              ON CONFLICT (email) DO UPDATE
              SET is_active = true,
                  pending_approval = false,
                  approved_at = NOW()
              RETURNING id
            )
            INSERT INTO user_roles (user_id, role)
            SELECT id, 'superadmin' FROM new_user
            ON CONFLICT (user_id, role) DO NOTHING
            RETURNING user_id;
          `);
          
          if (createResult.rows.length > 0) {
            console.log('✅ Superadmin created successfully!\n');
          }
        } catch (createError) {
          console.error('❌ Could not create superadmin:', createError.message, '\n');
        }
      }
    } catch (error) {
      console.error('⚠️  Could not verify superadmin:', error.message, '\n');
    }

    // List all tables to verify migration
    console.log('📋 Checking created tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_roles', 'projects', 'project_users', 'module_permissions', 'user_activation_log')
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Tables found:');
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  No new tables found - migration may have failed\n');
    }

    console.log('\n🎉 Migration process completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Test login with rokas@zubas.lt / Beenex2025!');
    console.log('2. Verify GitHub user rokas2025 gets superadmin on first login');
    console.log('3. Continue with backend implementation\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();

