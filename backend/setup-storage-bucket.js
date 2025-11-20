// Setup Supabase Storage Bucket for Code Analysis
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase storage bucket...')
  console.log('Supabase URL:', process.env.SUPABASE_URL)
  
  try {
    // Check if bucket exists
    console.log('\n📋 Checking existing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }
    
    console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name))
    
    const bucketName = 'code-analysis-zips'
    const bucketExists = buckets.some(b => b.name === bucketName)
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`)
    } else {
      console.log(`\n📦 Creating bucket '${bucketName}'...`)
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['application/zip', 'application/x-zip-compressed']
      })
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        throw createError
      }
      
      console.log('✅ Bucket created successfully:', data)
    }
    
    // Test upload
    console.log('\n🧪 Testing bucket access...')
    const testFile = Buffer.from('test')
    const testPath = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile, {
        contentType: 'text/plain'
      })
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
    } else {
      console.log('✅ Test upload successful:', uploadData.path)
      
      // Clean up test file
      await supabase.storage.from(bucketName).remove([testPath])
      console.log('✅ Test file cleaned up')
    }
    
    console.log('\n✅ Storage bucket setup complete!')
    console.log(`Bucket name: ${bucketName}`)
    console.log('Max file size: 100MB')
    console.log('Public: false')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

setupStorageBucket()

