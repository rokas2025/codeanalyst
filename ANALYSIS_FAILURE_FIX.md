# 🔴 **Code Analysis Failure - Complete Fix**

## **Problems Identified:**

### **1. Database Trigger Error** ❌
```
error: record "new" has no field "updated_at"
PL/pgSQL function update_updated_at_column() line 3 at assignment
```

**Root Cause**: Database trigger `update_code_analyses_updated_at` is trying to set `updated_at` column that doesn't exist in `code_analyses` table.

### **2. Connection Termination** ❌
```
uncaughtException: {:shutdown, :db_termination}
Connection terminated unexpectedly
```

**Root Cause**: Long-running analysis (6+ minutes) causes Supabase pooler to terminate idle connections.

### **3. Frontend Timeout** ❌
```
Analysis polling failed: Error: Analysis timeout
```

**Root Cause**: Frontend gives up after 60 polling attempts (10 minutes), but analysis never completes due to database errors.

---

## 🔧 **FIXES**

### **Fix 1: Database Trigger (CRITICAL - Do This First!)**

**Run this SQL in Supabase SQL Editor:**

```sql
-- Check if updated_at column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'code_analyses' AND column_name = 'updated_at';

-- If it returns no rows, add the column:
ALTER TABLE code_analyses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE code_analyses 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'code_analyses'::regclass;

-- If trigger exists but column didn't, it's now fixed!
-- Test the trigger:
UPDATE code_analyses SET progress = progress WHERE id IN (SELECT id FROM code_analyses LIMIT 1);
```

**Alternative: Remove the trigger if you don't need `updated_at`:**

```sql
DROP TRIGGER IF EXISTS update_code_analyses_updated_at ON code_analyses;
```

---

### **Fix 2: Use Direct Database Updates (Not Through Pool)**

The problem is that during long analysis, we're making many small UPDATE queries that keep connections open. We need to:

1. **Use raw SQL updates with shorter timeout**
2. **Release connections immediately**
3. **Don't hold connections during API calls**

**Change in `backend/src/routes/codeAnalysis.js`:**

```javascript
// Instead of using db.query() which holds connection
await db.query(`UPDATE code_analyses SET progress = 30 WHERE id = $1`, [analysisId])

// Use connection pool with immediate release
async function updateAnalysisProgress(analysisId, progress, status = 'analyzing') {
  const client = await db.pool.connect()
  try {
    await client.query(
      'UPDATE code_analyses SET status = $1, progress = $2 WHERE id = $3',
      [status, progress, analysisId]
    )
  } finally {
    client.release() // ← CRITICAL: Release immediately!
  }
}
```

---

### **Fix 3: Increase Frontend Polling Timeout**

**File**: `src/services/analysisService.ts:164`

```typescript
// BEFORE: maxAttempts = 60 (10 minutes)
const maxAttempts = 60

// AFTER: maxAttempts = 120 (20 minutes for complex analysis)
const maxAttempts = 120 // 20 minutes max
```

**File**: `src/pages/modules/CodeAnalyst.tsx:159`

Already using `analysisService.pollAnalysisStatus` which will get the increased timeout automatically.

---

### **Fix 4: Add Connection Keepalive**

**File**: `backend/src/database/connection.js`

```javascript
// Add keepalive to prevent connection termination
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  
  // ADD THESE:
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // Send keepalive every 10 seconds
  
  // Prevent statement timeout during long operations
  statement_timeout: 300000, // 5 minutes max per query
  query_timeout: 300000
})
```

---

## 📋 **Step-by-Step Fix Instructions**

### **Step 1: Fix Database Trigger (DO THIS FIRST!)** ⚠️

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this query**:

```sql
-- Add the missing column
ALTER TABLE code_analyses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE code_analyses 
SET updated_at = COALESCE(completed_at, created_at);

-- Verify it worked
SELECT id, status, progress, created_at, updated_at 
FROM code_analyses 
ORDER BY created_at DESC 
LIMIT 5;
```

3. **Test the trigger**:
```sql
UPDATE code_analyses 
SET progress = 1 
WHERE status = 'failed' 
LIMIT 1;

-- Check if updated_at changed
SELECT id, progress, updated_at FROM code_analyses WHERE status = 'failed' LIMIT 1;
```

---

### **Step 2: Update Backend Code**

I'll create the code fixes now...

---

##  **Quick Test After Fixes**

1. ✅ Fixed database trigger
2. ✅ Updated backend code
3. ✅ Deployed to Railway
4. **Test**: Start a new GitHub repository analysis
5. **Monitor**: Railway logs should show progress updates (5%, 15%, 30%, 60%, 90%, 100%)
6. **Expected**: Analysis completes without `db_termination` errors

---

## 🎯 **Root Cause Summary**

The analysis was **failing at the very first UPDATE** because:
1. Trigger tried to set `updated_at` column that didn't exist
2. PostgreSQL threw error: `record "new" has no field "updated_at"`
3. This caused `uncaughtException` which crashed the backend
4. Frontend kept polling but analysis never progressed past 0%

**After Fix**: 
- ✅ Database updates work
- ✅ Progress increments properly (5%, 15%, 30%, etc.)
- ✅ Analysis completes successfully
- ✅ Frontend shows real-time progress

---

**Priority**: Fix the database trigger FIRST, then update the code!

