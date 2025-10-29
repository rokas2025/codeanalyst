# 🚀 Run User Management Migration - SIMPLE INSTRUCTIONS

## The Issue
The migration SQL contains complex procedural blocks (DO $$) that cannot be executed via Node.js pg client. It must be run in Supabase SQL Editor.

## ✅ EASIEST WAY - Copy & Paste in Supabase (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/ecwpwmsqanlatfntzoul/sql
2. Or: Supabase Dashboard → Your Project → SQL Editor (left sidebar)

### Step 2: Run Migration
1. Click "New Query" button
2. Copy the ENTIRE contents of: `backend/src/database/user-management-migration.sql`
3. Paste into the SQL editor
4. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
5. Wait ~10 seconds for completion

### Step 3: Verify Superadmin
Run this query to verify:
```sql
SELECT u.id, u.email, u.name, u.is_active, u.pending_approval, ur.role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'rokas@zubas.lt';
```

You should see:
- Email: rokas@zubas.lt
- Role: superadmin
- Active: true
- Pending Approval: false

### Step 4: Clear Analysis History (Privacy Fix)
1. In same SQL Editor, click "New Query"
2. Copy contents of: `backend/src/database/clear-analysis-history.sql`
3. Paste and click "Run"
4. This deletes all old analysis history

### Step 5: Tell Me "Done"
Once both migrations are run, just say "migration done" or "ready" and I'll continue with the backend/frontend implementation!

---

## Alternative: Use Supabase CLI (If Installed)

If you have Supabase CLI installed locally:

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref ecwpwmsqanlatfntzoul

# Run migration
supabase db push
```

---

## What The Migration Does

✅ Creates Tables:
- `user_roles` - Stores user roles (superadmin, admin, user)
- `projects` - Admin's projects
- `project_users` - Users invited to projects
- `module_permissions` - Per-user module access
- `user_activation_log` - Audit trail

✅ Modifies Existing Tables:
- `users` - Adds is_active, pending_approval, etc.
- `wordpress_connections` - Adds project_id
- `analysis_history` - Adds project_id

✅ Creates Superadmin:
- Email: rokas@zubas.lt
- Password: Beenex2025!
- Role: superadmin
- Status: Active

✅ Sets Up Security:
- Row Level Security (RLS) policies
- Helper functions for role checking

---

## Troubleshooting

### "relation already exists"
This is OK! The migration uses `IF NOT EXISTS` where possible. It means some tables were already created.

### "syntax error"
Make sure you copied the ENTIRE SQL file, including the first and last lines.

### "permission denied"
Make sure you're logged into the correct Supabase project.

---

## After Migration

Once you confirm it's done, I'll implement:
1. ✅ Backend role middleware & routes
2. ✅ Frontend ProjectContext & UI components
3. ✅ Superadmin dashboard
4. ✅ Admin project management
5. ✅ Module access guards
6. ✅ Analysis history privacy fix

**Total time: ~2 hours of implementation**

---

Ready when you are! Just run the SQL in Supabase and let me know! 🚀

