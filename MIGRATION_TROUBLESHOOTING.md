# 🔧 Migration Troubleshooting Guide

## ❌ Current Issues

### Issue 1: `admin_id` column does not exist
**Problem**: The `projects` table exists but doesn't have the `admin_id` column.

**Root Cause**: The migration is trying to create the table with `CREATE TABLE IF NOT EXISTS`, which skips creation if the table already exists. But the existing table doesn't have all the required columns.

### Issue 2: Cannot login
**Problem**: No superadmin user exists yet because the migration hasn't completed successfully.

## ✅ Solution: Run Migration in Supabase SQL Editor

### **Step 1: Clear Existing Tables (Optional but Recommended)**

If you want a clean start, run this first in Supabase SQL Editor:

```sql
-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS module_permissions CASCADE;
DROP TABLE IF EXISTS project_users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_activation_log CASCADE;

-- Drop projects table to recreate it with correct schema
DROP TABLE IF EXISTS projects CASCADE;

-- Note: We're NOT dropping users, wordpress_connections, or analysis_history
-- to preserve existing data
```

### **Step 2: Run the Full Migration**

Now copy and paste the ENTIRE contents of:
```
backend/src/database/user-management-migration.sql
```

Into Supabase SQL Editor and click **Run**.

### **Step 3: Verify Tables Created**

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'projects', 'project_users', 'module_permissions')
ORDER BY table_name;
```

You should see all 4 tables.

### **Step 4: Check Projects Table Columns**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

You should see `admin_id` column.

## 🔐 Creating Your First Superadmin

### Option A: GitHub Login (Easiest)

1. Go to your app: https://codeanalyst.vercel.app (or localhost)
2. Click "Login with GitHub"
3. Login as GitHub user `rokas2025`
4. The backend will automatically assign superadmin role

### Option B: Email Registration

1. Go to your app
2. Click "Register"
3. Register with email: `rokas@zubas.lt`
4. Choose any password (it's NOT hardcoded!)
5. The migration already marked this email as superadmin
6. Login with your chosen password

### Option C: Manual Database Insert

If neither works, manually create a superadmin in Supabase SQL Editor:

```sql
-- First, check if you have any users
SELECT id, email, name, github_username FROM users;

-- If you have a user, assign superadmin role
-- Replace 'YOUR_USER_ID' with actual user ID from above query
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also activate the user
UPDATE users 
SET is_active = true, 
    pending_approval = false,
    approved_at = NOW()
WHERE id = 'YOUR_USER_ID';
```

## 🧪 Testing After Migration

### 1. Check Tables Exist
```sql
SELECT COUNT(*) FROM user_roles;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM project_users;
SELECT COUNT(*) FROM module_permissions;
```

### 2. Check Your User
```sql
SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'rokas@zubas.lt' OR u.github_username = 'rokas2025';
```

You should see:
- `is_active`: true
- `pending_approval`: false
- `role`: superadmin

### 3. Try Login
1. Go to your app
2. Login with GitHub or email
3. Check if "User Management" appears in sidebar
4. If yes: ✅ You're superadmin!

## 🚨 Common Errors & Fixes

### Error: "relation already exists"
✅ **This is OK!** It means the table was created before. The migration will skip it.

### Error: "column already exists"
✅ **This is OK!** It means the column was added before. The migration will skip it.

### Error: "syntax error at or near NOT"
❌ **Fixed!** The migration file has been updated to use `DROP POLICY IF EXISTS` instead of `CREATE POLICY IF NOT EXISTS`.

### Error: "column admin_id does not exist"
❌ **Solution**: Drop the `projects` table and recreate it (see Step 1 above).

### Login says "Login failed"
❌ **Causes**:
1. User doesn't exist yet → Register first
2. User exists but not activated → Run migration
3. User exists but no superadmin role → Manually assign role (see Option C above)

## 📋 Quick Checklist

- [ ] Run Step 1 (drop existing tables)
- [ ] Run Step 2 (full migration)
- [ ] Run Step 3 (verify tables)
- [ ] Run Step 4 (check admin_id column)
- [ ] Register/login to create first user
- [ ] Verify superadmin role assigned
- [ ] Check "User Management" in sidebar
- [ ] Create a test project
- [ ] Register a second user
- [ ] Approve second user
- [ ] Invite second user to project

## 🆘 Still Having Issues?

### Check Backend Logs
```powershell
# If running locally
cd backend
npm run dev
```

Look for errors related to:
- Database connection
- Authentication
- User role assignment

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for errors during migration

### Check Frontend Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for API errors

## 📞 Need Help?

If you're still stuck, provide:
1. Screenshot of Supabase SQL Editor error
2. Result of Step 3 query (table names)
3. Result of Step 4 query (projects columns)
4. Result of "Check Your User" query
5. Browser console errors (if any)

---

**Remember**: The migration is safe to run multiple times. It checks for existing tables/columns and skips them.

