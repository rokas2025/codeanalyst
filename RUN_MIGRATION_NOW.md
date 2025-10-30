# 🚀 Run Migration NOW - Step by Step

## ⚠️ Important
The migration script cannot run locally because you're using **Supabase** (cloud database), not local PostgreSQL.

## ✅ Solution: Run in Supabase SQL Editor

### **Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project: **CodeAnalyst**
3. Click **SQL Editor** in the left sidebar

### **Step 2: Run Migration SQL**
1. Click **"New Query"**
2. Copy the ENTIRE contents of this file:
   ```
   backend/src/database/user-management-migration.sql
   ```
3. Paste into the SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

### **Step 3: Verify Success**
You should see:
```
✅ Tables created
✅ Indexes created
✅ RLS policies created
✅ Superadmin role assigned (if user exists)
```

### **Step 4: Clear Existing Analysis History (Optional)**
If you want to clear old analysis data:
1. Click **"New Query"** again
2. Copy contents of:
   ```
   backend/src/database/clear-analysis-history.sql
   ```
3. Paste and run

## 🎯 What This Does

### Creates Tables:
- ✅ `user_roles` - User role assignments
- ✅ `projects` - Project information
- ✅ `project_users` - User-project relationships
- ✅ `module_permissions` - Module access control
- ✅ `user_activation_log` - Activation history

### Updates Existing Tables:
- ✅ `users` - Adds `is_active`, `pending_approval` columns
- ✅ `wordpress_connections` - Adds `project_id` column
- ✅ `analysis_history` - Adds `project_id` column

### Sets Up Superadmin:
- ✅ Activates `rokas@zubas.lt` (if exists)
- ✅ Assigns superadmin role to `rokas2025` (GitHub user, if exists)

## 🔐 After Migration

### If You Haven't Registered Yet:
1. Go to your app
2. **Option A**: Login with GitHub as `rokas2025` → Auto-superadmin
3. **Option B**: Register with `rokas@zubas.lt` → Already superadmin

### If You Already Have an Account:
1. The migration will activate you
2. You're now superadmin
3. Login and check "User Management" in sidebar

## 📝 Quick Test Checklist

After migration:
- [ ] Login to your app
- [ ] Check if "User Management" appears in sidebar (superadmin only)
- [ ] Go to "My Projects" and create a test project
- [ ] Register a second account (different email)
- [ ] Approve the second account in User Management
- [ ] Invite second user to your project
- [ ] Set module permissions

## ❓ Troubleshooting

### "Table already exists" error
✅ **This is OK!** It means tables were created before. The migration will skip them.

### "Column already exists" error
✅ **This is OK!** It means columns were added before. The migration will skip them.

### "User not found" notice
✅ **This is OK!** It means you haven't registered yet. Superadmin will be assigned on first login.

### No "User Management" in sidebar after login
❌ **Problem**: Migration didn't assign superadmin role
**Solution**: 
1. Check Supabase → Table Editor → `user_roles`
2. Manually add a row:
   - `user_id`: Your user ID from `users` table
   - `role`: `superadmin`

## 🎉 You're Ready!

Once migration runs successfully:
1. ✅ Database schema is complete
2. ✅ Superadmin is configured
3. ✅ All features are active
4. ✅ Ready to test!

---

**Need Help?** Check:
- Supabase logs for errors
- Browser console for frontend issues
- Railway logs for backend issues

