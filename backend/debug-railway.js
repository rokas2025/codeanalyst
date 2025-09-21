// Simple debug script for Railway environment
console.log('🔍 Railway Environment Debug:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY)
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL)

if (process.env.OPENAI_API_KEY) {
  console.log('OpenAI key starts with sk-proj:', process.env.OPENAI_API_KEY.startsWith('sk-proj'))
  console.log('OpenAI key length:', process.env.OPENAI_API_KEY.length)
} else {
  console.log('❌ No OpenAI API key found in Railway environment!')
}

// Test OpenAI import
try {
  const OpenAI = require('openai')
  console.log('✅ OpenAI module imported successfully')
  
  if (process.env.OPENAI_API_KEY) {
    console.log('🧪 Testing OpenAI API connection...')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    }).then(response => {
      console.log('✅ OpenAI API works! Response:', response.choices[0].message.content)
    }).catch(error => {
      console.log('❌ OpenAI API error:', error.message)
    })
  }
} catch (error) {
  console.log('❌ OpenAI module error:', error.message)
}
