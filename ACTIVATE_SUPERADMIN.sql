-- ============================================
-- ACTIVATE SUPERADMIN - Run in Supabase SQL Editor
-- ============================================

-- Step 1: Find your user ID
SELECT id, email, name, is_active, pending_approval 
FROM users 
WHERE email = 'rokas@zubas.lt';

-- Step 2: Activate the user and assign superadmin role
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE email = 'rokas@zubas.lt';
  
  IF v_user_id IS NOT NULL THEN
    -- Activate user
    UPDATE users 
    SET is_active = true, 
        pending_approval = false,
        approved_at = NOW()
    WHERE id = v_user_id;
    
    -- Assign superadmin role (create user_roles table if needed)
    CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
      assigned_at TIMESTAMP DEFAULT NOW(),
      assigned_by UUID REFERENCES users(id),
      UNIQUE(user_id, role)
    );
    
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'User activated and superadmin role assigned!';
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;

-- Step 3: Verify it worked
SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'rokas@zubas.lt';

-- You should see:
-- is_active: true
-- pending_approval: false
-- role: superadmin

