-- User Management & Project System Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_pending_approval ON users(pending_approval);

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 3. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_admin_id ON projects(admin_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- 4. Create project_users table (invited users)
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

-- 5. Create module_permissions table
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

-- 6. Create user_activation_log table
CREATE TABLE IF NOT EXISTS user_activation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) CHECK (action IN ('activated', 'deactivated')),
  performed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_log_user_id ON user_activation_log(user_id);

-- 7. Add project_id to wordpress_connections
ALTER TABLE wordpress_connections 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wp_connections_project_id ON wordpress_connections(project_id);

-- 8. Add project_id to analysis_history
ALTER TABLE analysis_history 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analysis_history_project_id ON analysis_history(project_id);

-- 9. Assign superadmin role to existing user
-- Note: User must already exist in the database (via GitHub login or email registration)
-- No hardcoded credentials - superadmin is assigned by email or GitHub username
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user by email (rokas@zubas.lt)
  SELECT id INTO v_user_id FROM users WHERE email = 'rokas@zubas.lt';
  
  IF v_user_id IS NOT NULL THEN
    -- Update existing user to superadmin
    UPDATE users 
    SET is_active = true, 
        pending_approval = false,
        approved_at = NOW()
    WHERE id = v_user_id;
    
    -- Assign superadmin role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin role assigned to: rokas@zubas.lt';
  ELSE
    RAISE NOTICE 'User rokas@zubas.lt not found - will be assigned superadmin on first login';
  END IF;
  
  -- Also assign superadmin to GitHub user rokas2025 if exists
  SELECT id INTO v_user_id FROM users WHERE github_username = 'rokas2025';
  
  IF v_user_id IS NOT NULL THEN
    UPDATE users 
    SET is_active = true, 
        pending_approval = false,
        approved_at = NOW()
    WHERE id = v_user_id;
    
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin role assigned to GitHub user: rokas2025';
  END IF;
END $$;

-- 10. Clear existing analysis history (privacy fix)
-- TRUNCATE analysis_history CASCADE;
-- Note: Uncomment above line to clear all history, or run separately

-- 11. Enable Row Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies

-- Superadmin can see everything
CREATE POLICY IF NOT EXISTS superadmin_all_user_roles ON user_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  ));

-- Admins can see their own projects
CREATE POLICY IF NOT EXISTS admin_own_projects ON projects FOR ALL
  USING (
    admin_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- Users can see projects they're invited to
CREATE POLICY IF NOT EXISTS user_assigned_projects ON projects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_id = projects.id AND user_id = auth.uid() AND is_active = true
  ));

-- Project users visibility
CREATE POLICY IF NOT EXISTS project_users_visibility ON project_users FOR ALL
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_users.project_id AND admin_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- Module permissions visibility
CREATE POLICY IF NOT EXISTS module_permissions_visibility ON module_permissions FOR ALL
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects WHERE id = module_permissions.project_id AND admin_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- 13. Create helper functions

-- Function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = check_user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = check_user_id AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role
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

-- Migration complete!
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify superadmin was created: SELECT * FROM users WHERE email = 'rokas@zubas.lt';
-- 3. Test login with rokas@zubas.lt / Beenex2025!

