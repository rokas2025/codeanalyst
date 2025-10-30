# 🔍 Why Login Isn't Working

## ❌ **The Problem:**

Your user exists in the **PostgreSQL `users` table** ✅  
BUT your password is NOT in **Supabase Auth** ❌

## 🧠 **How Authentication Works:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. User enters email/password in frontend                  │
│  2. Frontend calls backend /auth/login-supabase             │
│  3. Backend calls Supabase Auth API to verify password      │ ❌ FAILS HERE
│  4. If valid, backend queries PostgreSQL users table        │
│  5. Backend generates JWT token                             │
└─────────────────────────────────────────────────────────────┘
```

**Your issue:** Step 3 fails because `rokas@zubas.lt` doesn't exist in **Supabase Auth** (only in PostgreSQL).

---

## ✅ **Solution: Register Your Account Properly**

### **Option 1: Register via Frontend (Recommended)**

1. Go to https://codeanalyst.vercel.app/register
2. Register with:
   - Email: `rokas@zubas.lt`
   - Password: (choose a password)
   - Name: `Rokas`

3. This will create the account in **both**:
   - ✅ Supabase Auth (for password verification)
   - ✅ PostgreSQL `users` table (for app data)

4. The account will be `pending_approval = true` initially

5. Then run this SQL in Supabase SQL Editor to activate it:

```sql
-- Activate and make superadmin
UPDATE users
SET is_active = true,
    pending_approval = false,
    approved_at = NOW()
WHERE email = 'rokas@zubas.lt';

-- Assign superadmin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'superadmin'
FROM users
WHERE email = 'rokas@zubas.lt'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### **Option 2: Create User in Supabase Auth Manually**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: `rokas@zubas.lt`
   - Password: (choose a password)
   - Auto Confirm User: ✅ YES

4. Copy the **User ID** from Supabase Auth

5. Update your PostgreSQL user to match:

```sql
-- Update the user ID to match Supabase Auth ID
UPDATE users
SET id = 'PASTE_SUPABASE_AUTH_USER_ID_HERE',
    is_active = true,
    pending_approval = false,
    approved_at = NOW()
WHERE email = 'rokas@zubas.lt';

-- Update user_roles to use the new ID
UPDATE user_roles
SET user_id = 'PASTE_SUPABASE_AUTH_USER_ID_HERE'
WHERE user_id = (SELECT id FROM users WHERE email = 'rokas@zubas.lt' LIMIT 1);
```

---

## 🚀 **Recommended: Use Option 1**

**Why?** It's cleaner and follows the proper registration flow.

**After registering:**
1. ✅ Account exists in Supabase Auth (password works)
2. ✅ Account exists in PostgreSQL (app data)
3. ✅ Run the activation SQL above
4. ✅ Login works! 🎉

---

## 🔐 **For GitHub Login:**

GitHub login (`rokas2025`) should work immediately because:
- ✅ Backend auto-creates user on first GitHub login
- ✅ Backend auto-assigns superadmin role to `rokas2025`
- ✅ No password needed (uses GitHub OAuth)

**Try this now:**
1. Go to https://codeanalyst.vercel.app/login
2. Click "Continue with GitHub"
3. Login as `rokas2025`
4. You should be logged in as superadmin! 🎊

---

## 📊 **Current Database State:**

```
PostgreSQL users table:
- ✅ rokas@zubas.lt exists
- ✅ is_active = true
- ✅ pending_approval = false
- ✅ role = superadmin

Supabase Auth:
- ❌ rokas@zubas.lt does NOT exist
- ❌ No password stored

Result: Login fails at Supabase Auth verification step
```

---

## 🎯 **Next Steps:**

1. **Try GitHub login first** (easiest, should work now)
2. **OR** register `rokas@zubas.lt` via frontend + run activation SQL
3. **Then** test email/password login

Let me know which option you want to use! 🚀

