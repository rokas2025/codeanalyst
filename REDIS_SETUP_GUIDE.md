# Redis Setup Guide for CodeAnalyst

## Option 1: Upstash Redis via Vercel (Recommended)

### Step 1: Add Upstash Integration
1. Go to Vercel Dashboard → Your Project
2. Navigate to "Integrations" tab
3. Search for "Upstash Redis" 
4. Click "Add Integration"
5. Create new Redis database or connect existing

### Step 2: Environment Variables (Auto-configured)
```bash
# These will be automatically added to Vercel:
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Step 3: Add Redis to Railway Backend
```bash
# Add to Railway environment variables:
REDIS_URL=redis://...  # Copy from Vercel
REDIS_ENABLED=true
```

### Step 4: Update Backend Code
```bash
npm install ioredis bull
```

### Step 5: Enable Redis in Backend
1. Uncomment Redis imports in `src/index.js`
2. Set `REDIS_ENABLED=true` in Railway
3. Redeploy backend

## Option 2: Railway Pro + Redis Addon

### Requirements
- Railway Pro Plan ($5/month)
- Redis Plugin (~$10/month)
- Total: ~$15/month

### Setup Steps
1. Upgrade Railway to Pro plan
2. Add Redis plugin to your Railway project
3. Environment variable automatically configured
4. Enable Redis in backend code

## Option 3: PostgreSQL-Based Queue (No additional cost)

### Create Queue Table
```sql
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  run_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status_priority ON job_queue(status, priority DESC, run_at);
```

### Benefits
- ✅ Uses existing Supabase database
- ✅ No additional cost
- ✅ ACID transactions
- ❌ Slower than Redis
- ❌ More complex implementation

## Recommendation

**For your current scale**: Stick with synchronous processing
**For future growth**: Use Upstash Redis via Vercel integration

The current synchronous system works perfectly for:
- < 100 concurrent analyses
- Analysis times < 30 seconds
- Current user base

Consider Redis when you reach:
- > 100 concurrent analyses
- Analysis times > 1 minute
- Need background processing
