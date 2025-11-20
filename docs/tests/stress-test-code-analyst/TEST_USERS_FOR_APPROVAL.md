# Test Users Requiring Admin Approval

## System URL
**Frontend**: https://app.beenex.dev/

## Test Users Created

The following test users were created for stress testing the Code Analysis module and require admin approval:

### User List

1. **Email**: `stress_test_user_001@codeanalyst.test`
   - **Password**: `StressTest2024!`
   - **Name**: Stress Test User 001
   - **Purpose**: Automated stress testing

2. **Email**: `stress_test_user_002@codeanalyst.test`
   - **Password**: `StressTest2024!`
   - **Name**: Stress Test User 002
   - **Purpose**: Automated stress testing

3. **Email**: `stress_test_user_003@codeanalyst.test`
   - **Password**: `StressTest2024!`
   - **Name**: Stress Test User 003
   - **Purpose**: Automated stress testing

4. **Email**: `stress_test_user_004@codeanalyst.test`
   - **Password**: `StressTest2024!`
   - **Name**: Stress Test User 004
   - **Purpose**: Automated stress testing

5. **Email**: `stress_test_user_005@codeanalyst.test`
   - **Password**: `StressTest2024!`
   - **Name**: Stress Test User 005
   - **Purpose**: Automated stress testing

## Current Workaround

For immediate testing, the stress test script is currently configured to use the existing demo account:
- **Email**: `test@demo.com`
- **Password**: `test123`

This allows the stress test to run with 5 concurrent "virtual workers" all using the same authenticated token.

## Next Steps

### Option 1: Approve Test Users (Recommended for realistic testing)
1. Login to https://app.beenex.dev/ as admin
2. Navigate to user management
3. Approve the 5 test users listed above
4. Run the stress test with: `.\run-stress-test-simple.ps1 -ConcurrentUsers 5 -TestDurationSeconds 180`

### Option 2: Continue with Demo Account (Quick testing)
The current configuration works but all requests come from the same user account, which is less realistic for stress testing.

### Option 3: Create Test Users with Different Email Domain
If `@codeanalyst.test` emails are blocked, we can use:
- `stress_test_user_001@gmail.com` (or another valid domain)
- These would still need admin approval

## Cleaning Up After Testing

Once testing is complete, these test users can be deleted from the database:

```sql
-- View test users
SELECT id, email, name, created_at, status
FROM users 
WHERE email LIKE 'stress_test_user_%@codeanalyst.test';

-- Delete test users (after testing is complete)
DELETE FROM users 
WHERE email LIKE 'stress_test_user_%@codeanalyst.test';

-- Clean up their analysis results
DELETE FROM code_analyses 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email LIKE 'stress_test_user_%@codeanalyst.test'
);
```

## Current Test Status

The stress test is currently running with the demo account workaround. This tests:
- ✅ Upload functionality
- ✅ Analysis processing
- ✅ Concurrent request handling
- ✅ System performance under load
- ⚠️ All requests from single user (not ideal but functional)

---

**Date**: November 14, 2024  
**Test Suite**: Code Analysis Module Stress Testing  
**Location**: `docs/tests/stress-test-code-analyst/`

