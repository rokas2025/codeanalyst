#!/usr/bin/env node

import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function fixSuperadmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Update existing user to be active and approved
    console.log('1️⃣  Activating rokas@zubas.lt...');
    await client.query(`
      UPDATE users 
      SET is_active = true,
          pending_approval = false,
          approved_at = NOW(),
          password = crypt('Beenex2025!', gen_salt('bf'))
      WHERE email = 'rokas@zubas.lt';
    `);
    console.log('✅ User activated\n');

    // 2. Assign superadmin role
    console.log('2️⃣  Assigning superadmin role...');
    await client.query(`
      INSERT INTO user_roles (user_id, role)
      SELECT id, 'superadmin' FROM users WHERE email = 'rokas@zubas.lt'
      ON CONFLICT (user_id, role) DO NOTHING;
    `);
    console.log('✅ Superadmin role assigned\n');

    // 3. Create remaining tables
    console.log('3️⃣  Creating missing tables...\n');

    // project_users table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          invited_by UUID REFERENCES users(id),
          invited_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          UNIQUE(project_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON project_users(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id);
      `);
      console.log('   ✅ project_users table created');
    } catch (e) {
      console.log('   ⚠️  project_users:', e.message);
    }

    // module_permissions table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS module_permissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          module_name VARCHAR(50) NOT NULL CHECK (module_name IN (
            'website_analyst',
            'code_analyst', 
            'content_analyst',
            'content_creator',
            'auto_programmer'
          )),
          has_access BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(project_id, user_id, module_name)
        );
        CREATE INDEX IF NOT EXISTS idx_module_permissions_project_user ON module_permissions(project_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_module_permissions_module ON module_permissions(module_name);
      `);
      console.log('   ✅ module_permissions table created');
    } catch (e) {
      console.log('   ⚠️  module_permissions:', e.message);
    }

    // user_activation_log table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_activation_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(20) CHECK (action IN ('activated', 'deactivated')),
          performed_by UUID REFERENCES users(id),
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_activation_log_user_id ON user_activation_log(user_id);
      `);
      console.log('   ✅ user_activation_log table created');
    } catch (e) {
      console.log('   ⚠️  user_activation_log:', e.message);
    }

    // analysis_history table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS analysis_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
          analysis_type VARCHAR(50) NOT NULL,
          url TEXT,
          status VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_analysis_history_project_id ON analysis_history(project_id);
      `);
      console.log('   ✅ analysis_history table created');
    } catch (e) {
      console.log('   ⚠️  analysis_history:', e.message);
    }

    // Add project_id to wordpress_connections
    try {
      await client.query(`
        ALTER TABLE wordpress_connections 
        ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_wp_connections_project_id ON wordpress_connections(project_id);
      `);
      console.log('   ✅ wordpress_connections updated with project_id');
    } catch (e) {
      console.log('   ⚠️  wordpress_connections:', e.message);
    }

    console.log('\n4️⃣  Creating helper functions...\n');

    // is_superadmin function
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = check_user_id AND role = 'superadmin'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('   ✅ is_superadmin() function created');
    } catch (e) {
      console.log('   ⚠️  is_superadmin():', e.message);
    }

    // is_admin function
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = check_user_id AND role IN ('admin', 'superadmin')
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('   ✅ is_admin() function created');
    } catch (e) {
      console.log('   ⚠️  is_admin():', e.message);
    }

    // get_user_role function
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION get_user_role(check_user_id UUID)
        RETURNS VARCHAR AS $$
        DECLARE
          user_role VARCHAR;
        BEGIN
          SELECT role INTO user_role
          FROM user_roles
          WHERE user_id = check_user_id
          ORDER BY CASE role 
            WHEN 'superadmin' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'user' THEN 3 
          END
          LIMIT 1;
          
          RETURN COALESCE(user_role, 'user');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('   ✅ get_user_role() function created');
    } catch (e) {
      console.log('   ⚠️  get_user_role():', e.message);
    }

    // Verify final state
    console.log('\n5️⃣  Verifying superadmin...');
    const result = await client.query(`
      SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = 'rokas@zubas.lt';
    `);

    console.table(result.rows);

    console.log('\n🎉 Superadmin setup complete!');
    console.log('\n✅ You can now login with:');
    console.log('   Email: rokas@zubas.lt');
    console.log('   Password: Beenex2025!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixSuperadmin();

