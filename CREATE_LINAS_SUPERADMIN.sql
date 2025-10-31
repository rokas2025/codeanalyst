-- ============================================
-- Create Superadmin User: Linas Pagirys
-- ============================================
-- Email: linas.pagirys@gmail.com
-- GitHub: linaslp
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if user exists
SELECT id, email, github_username, name, is_active, pending_approval 
FROM users 
WHERE email = 'linas.pagirys@gmail.com' OR github_username = 'linaslp';

-- Step 2: If user exists, activate and promote to superadmin
DO $$
DECLARE
  user_uuid UUID;
  rokas_uuid UUID;
BEGIN
  -- Get Rokas's ID (the approver)
  SELECT id INTO rokas_uuid 
  FROM users 
  WHERE email = 'rokas@zubas.lt' 
  LIMIT 1;
  
  -- Get Linas's ID
  SELECT id INTO user_uuid 
  FROM users 
  WHERE email = 'linas.pagirys@gmail.com' OR github_username = 'linaslp'
  LIMIT 1;
  
  IF user_uuid IS NOT NULL THEN
    RAISE NOTICE 'Found user: %', user_uuid;
    
    -- Activate user
    UPDATE users
    SET 
      is_active = true,
      pending_approval = false,
      approved_at = NOW(),
      approved_by = rokas_uuid,
      deactivated_at = NULL,
      deactivated_by = NULL,
      updated_at = NOW()
    WHERE id = user_uuid;
    
    RAISE NOTICE 'User activated';
    
    -- Assign superadmin role
    INSERT INTO user_roles (user_id, role)
    VALUES (user_uuid, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin role assigned';
    
    -- Log the action
    INSERT INTO user_activation_log (user_id, action, performed_by, reason)
    VALUES (user_uuid, 'activated_and_promoted', rokas_uuid, 'Promoted to superadmin by system admin')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ SUCCESS: User % (Linas Pagirys) activated and promoted to superadmin', user_uuid;
  ELSE
    RAISE NOTICE '❌ ERROR: User not found. Linas needs to register first at the app.';
    RAISE NOTICE 'Please have Linas:';
    RAISE NOTICE '1. Go to the app login page';
    RAISE NOTICE '2. Register with email: linas.pagirys@gmail.com OR login with GitHub: linaslp';
    RAISE NOTICE '3. Then run this script again';
  END IF;
END $$;

-- Step 3: Verify the result
SELECT 
  u.id,
  u.email,
  u.github_username,
  u.name,
  u.is_active,
  u.pending_approval,
  u.approved_at,
  u.approved_by,
  ur.role,
  CASE 
    WHEN ur.role = 'superadmin' THEN '✅ SUPERADMIN'
    WHEN ur.role = 'admin' THEN 'Admin'
    ELSE 'User'
  END as role_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'linas.pagirys@gmail.com' OR u.github_username = 'linaslp';

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Linas must register first (email or GitHub login)
-- 2. Copy and paste this entire script into Supabase SQL Editor
-- 3. Click "Run" or press Ctrl+Enter
-- 4. Check the results - should see "SUCCESS" message
-- 5. Verify table shows role_status = '✅ SUPERADMIN'
-- 6. Linas can now login and access User Management
-- ============================================

