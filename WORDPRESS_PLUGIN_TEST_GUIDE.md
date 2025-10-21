# 🔌 WordPress Plugin Testing Guide

## 📦 **Plugin Created!**

✅ **File:** `codeanalyst-connector.zip` (11.73 KB)
✅ **Location:** Root directory of your project

---

## ⚠️ **IMPORTANT: Database Migration Required First!**

Before testing the plugin, you need to create the `wordpress_connections` table in your database.

### **Option 1: Run Migration on Railway (Recommended)**

Since your local environment doesn't have database access, run the migration directly on Railway:

#### **Method A: Use Railway Dashboard Console**

1. Go to: https://railway.app/dashboard
2. Click on your **production** service (the main backend)
3. Go to **Variables** tab and copy your `DATABASE_URL`
4. Go to a PostgreSQL client (like TablePlus, DBeaver, or psql) and connect
5. Run this SQL:

```sql
-- Create the wordpress_connections table
CREATE TABLE IF NOT EXISTS wordpress_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    site_url TEXT NOT NULL,
    site_name VARCHAR(255),
    wordpress_version VARCHAR(50),
    active_theme VARCHAR(255),
    active_plugins JSONB,
    site_health JSONB,
    php_version VARCHAR(50),
    is_connected BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_user ON wordpress_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_api_key ON wordpress_connections(api_key);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_wordpress_connections_updated_at 
BEFORE UPDATE ON wordpress_connections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'WordPress connections table created successfully!' AS status;
```

#### **Method B: Use Supabase Dashboard (If using Supabase)**

1. Go to your Supabase dashboard
2. Click on **SQL Editor**
3. Paste the SQL above
4. Click **Run**

---

## 🧪 **Testing the WordPress Plugin**

Once the database migration is complete:

### **Step 1: Install Plugin on WordPress Site**

1. **Get the ZIP file:**
   - It's in your project root: `codeanalyst-connector.zip`

2. **Upload to WordPress:**
   - Go to your WordPress admin: `https://your-site.com/wp-admin`
   - Go to **Plugins** → **Add New** → **Upload Plugin**
   - Choose `codeanalyst-connector.zip`
   - Click **Install Now**
   - Click **Activate Plugin**

### **Step 2: Configure Plugin**

1. **Go to plugin settings:**
   - In WordPress admin, go to **Settings** → **CodeAnalyst Connector**

2. **Get your CodeAnalyst settings:**
   - Login to your CodeAnalyst app
   - Go to **Settings** → **WordPress Integration**
   - Click **"Generate New API Key"**
   - Copy the API key

3. **Enter settings in WordPress:**
   - **API Key:** Paste the key you just generated
   - **CodeAnalyst API URL:** 
     - Production: `https://[your-railway-url].up.railway.app`
     - Or use the URL from your Railway service
   - Click **Save Settings**

### **Step 3: Test Connection**

1. Click **"Test Connection"** button in WordPress
2. Should show: ✅ **"Connection successful!"**

### **Step 4: View Connected Sites**

1. Go to CodeAnalyst app
2. Go to **Connected Sites** page
3. You should see your WordPress site listed!

---

## 📋 **Quick SQL to Run on Database**

If you have direct database access, copy this entire SQL file:
- File: `backend/scripts/migrate-wordpress-connections.sql`

Or use this command if you have `psql` access:

```bash
psql $DATABASE_URL -f backend/scripts/migrate-wordpress-connections.sql
```

---

## 🔍 **Troubleshooting**

### **"relation wordpress_connections does not exist"**
- ✅ **Solution:** Run the database migration (see above)

### **"Failed to connect to CodeAnalyst"**
- Check API URL is correct
- Check API key is valid
- Check your Railway/backend is running

### **"Unauthorized"**
- Regenerate API key in CodeAnalyst settings
- Update the key in WordPress plugin settings

---

## 📁 **Plugin Files Location**

All plugin files are in:
```
wordpress-plugin/
├── codeanalyst-connector.php    (Main plugin file)
├── includes/
│   ├── api-client.php            (API communication)
│   └── file-reader.php           (Read WordPress files)
├── admin/
│   ├── settings-page.php         (Settings UI)
│   └── css/
│       └── admin-styles.css      (Styling)
└── README.md                     (Plugin documentation)
```

**ZIP file:** `codeanalyst-connector.zip` (ready for distribution)

---

## 🚀 **Next Steps After Testing:**

1. ✅ Test the plugin on a local WordPress installation
2. ✅ Test the plugin on a live WordPress site
3. ✅ Test file reading and analysis
4. ✅ Add more features (optional)
5. ✅ Publish to WordPress.org (future)

---

**Let me know once you've run the database migration and I'll help you test!** 🎉


