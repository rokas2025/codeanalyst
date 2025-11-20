// Create Supabase storage bucket for code analysis uploads
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

// Get Supabase credentials from Railway
const getEnvVar = (name) => {
  const result = execSync(`railway variables --service codeanalyst | Select-String -Pattern "${name}"`, { encoding: 'utf-8' })
  const match = result.match(/│\s+(.+?)\s+║/)
  return match ? match[1].trim() : null
}

const SUPABASE_URL = getEnvVar('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

console.log('🔧 Creating Supabase storage bucket...')
console.log('📍 Supabase URL:', SUPABASE_URL)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }
    
    console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', '))
    
    const bucketExists = buckets.some(b => b.id === 'code-analysis-uploads')
    
    if (bucketExists) {
      console.log('✅ Bucket already exists: code-analysis-uploads')
      return
    }
    
    // Create bucket
    console.log('🔨 Creating bucket: code-analysis-uploads')
    const { data, error } = await supabase.storage.createBucket('code-analysis-uploads', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
    })
    
    if (error) {
      console.error('❌ Error creating bucket:', error)
      throw error
    }
    
    console.log('✅ Bucket created successfully:', data)
    
    // Set up policies using SQL
    console.log('🔐 Setting up storage policies...')
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow service role to do everything
        CREATE POLICY IF NOT EXISTS "Service role full access"
        ON storage.objects FOR ALL
        TO service_role
        USING (bucket_id = 'code-analysis-uploads')
        WITH CHECK (bucket_id = 'code-analysis-uploads');
        
        -- Allow authenticated users to upload
        CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'code-analysis-uploads');
        
        -- Allow authenticated users to read
        CREATE POLICY IF NOT EXISTS "Authenticated users can read"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'code-analysis-uploads');
      `
    })
    
    if (policyError) {
      console.log('⚠️  Note: Policies need to be set manually in Supabase dashboard')
      console.log('   This is normal - RPC might not be available')
    } else {
      console.log('✅ Policies created successfully')
    }
    
    console.log('')
    console.log('🎉 Setup complete!')
    console.log('📦 Bucket: code-analysis-uploads')
    console.log('🔒 Public: false')
    console.log('📏 Size limit: 50MB')
    console.log('📄 Allowed types: ZIP files')
    
  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message)
    console.log('')
    console.log('📋 Manual steps:')
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Storage')
    console.log('4. Click "Create bucket"')
    console.log('5. Name: code-analysis-uploads')
    console.log('6. Public: OFF')
    console.log('7. File size limit: 50MB')
    console.log('8. Allowed MIME types: application/zip')
    process.exit(1)
  }
}

createBucket()

