# 🔧 Run WordPress Migration on Railway

## 📁 **WordPress Plugin Location:**
```
C:\Users\rokas\OneDrive\Dokumentai\Analyst\wordpress-plugin\
```

**ZIP file for installation:**
```
C:\Users\rokas\OneDrive\Dokumentai\Analyst\codeanalyst-connector.zip
```

---

## 🚀 **Run Migration on Railway (Since No Local DB)**

### **Option 1: Add Migration to Backend Startup (Automatic)**

Let me modify the backend to automatically run the migration on startup:

#### **Create Auto-Migration Script:**

Create `backend/src/database/migrations.js`:

```javascript
import { db } from './connection.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function runMigrations() {
  try {
    console.log('🔄 Checking for pending migrations...')
    
    // Check if wordpress_connections table exists
    const checkTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wordpress_connections'
      )
    `)
    
    if (!checkTable.rows[0].exists) {
      console.log('📦 Creating wordpress_connections table...')
      
      const sqlPath = join(__dirname, '../../scripts/migrate-wordpress-connections.sql')
      const sql = readFileSync(sqlPath, 'utf-8')
      
      await db.query(sql)
      console.log('✅ WordPress connections table created!')
    } else {
      console.log('✅ WordPress connections table already exists')
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    // Don't stop the server if migration fails
  }
}
```

#### **Add to Backend Startup:**

Modify `backend/src/index.js` to run migrations on startup.

---

### **Option 2: Use Railway CLI (Quick)**

Since you don't connect from local, use Railway CLI to run the migration:

```bash
# 1. Link to your Railway project
railway link

# 2. Run the migration script
railway run node scripts/run-migration.js
```

---

### **Option 3: Manual SQL via Railway Database URL**

1. Get your `DATABASE_URL` from Railway dashboard
2. Copy the SQL from `backend/scripts/migrate-wordpress-connections.sql`
3. Run it via any PostgreSQL client or Railway's console

---

## 📦 **WordPress Plugin Files:**

**All files are in:**
```
C:\Users\rokas\OneDrive\Dokumentai\Analyst\wordpress-plugin\
├── codeanalyst-connector.php       (Main plugin file)
├── includes\
│   ├── api-client.php              (Communicates with your API)
│   └── file-reader.php             (Reads WordPress files)
├── admin\
│   ├── settings-page.php           (Settings page)
│   └── css\
│       └── admin-styles.css        (Styling)
└── README.md
```

**ZIP for installation:**
```
C:\Users\rokas\OneDrive\Dokumentai\Analyst\codeanalyst-connector.zip
```

---

## ✅ **Easiest Solution:**

Let me create an auto-migration script that runs on Railway deployment. The table will be created automatically next time Railway deploys!

**Want me to do that?** 🚀


