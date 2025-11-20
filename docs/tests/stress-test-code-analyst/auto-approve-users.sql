-- Auto-approve test users for stress testing
-- Run this SQL script to approve test users automatically

-- Approve all stress test users
UPDATE users 
SET status = 'active',
    email_confirmed = true,
    confirmed_at = NOW()
WHERE email LIKE 'stress_test_user_%@codeanalyst.test'
  AND (status IS NULL OR status != 'active');

-- Verify the update
SELECT 
    id,
    email,
    name,
    status,
    email_confirmed,
    created_at,
    confirmed_at
FROM users 
WHERE email LIKE 'stress_test_user_%@codeanalyst.test'
ORDER BY email;

-- Expected result: All 5 users should have status='active' and email_confirmed=true

