// Test script for the new URL analysis system
// Run this to see what the enhanced URL analyzer can detect

import { urlFetcher } from './services/urlFetcher.js'
import { realUrlConverter } from './utils/realUrlToFileConverter.js'

async function testUrlAnalysis() {
  console.log('🧪 Testing Enhanced URL Analysis System')
  console.log('=====================================\n')
  
  const testUrls = [
    'https://www.ai69x.lol/',
    'https://github.com/',
    'https://tailwindcss.com/',
    'https://react.dev/'
  ]
  
  for (const url of testUrls) {
    try {
      console.log(`\n🌐 Analyzing: ${url}`)
      console.log('─'.repeat(50))
      
      // Step 1: Fetch real content
      const scanResult = await urlFetcher.fetchURL(url, {
        includeResources: true,
        timeout: 15000,
        proxyService: 'corsproxy'
      })
      
      console.log(`📄 Title: ${scanResult.title}`)
      console.log(`🔧 Technologies: ${scanResult.technologies.join(', ')}`)
      console.log(`📊 DOM Elements: ${scanResult.performance.domElements}`)
      console.log(`📜 Scripts: ${scanResult.scripts.length}`)
      console.log(`🎨 Stylesheets: ${scanResult.stylesheets.length}`)
      console.log(`🔗 Links: ${scanResult.links.length}`)
      console.log(`🖼️  Images: ${scanResult.images.length}`)
      console.log(`🔒 Security Score: ${scanResult.security.isHttps ? 'HTTPS ✅' : 'HTTP ❌'}`)
      
      // Step 2: Convert to analyzable files
      const files = realUrlConverter.convertToFileStructure(scanResult)
      console.log(`📁 Generated Files: ${files.length}`)
      
      files.forEach(file => {
        console.log(`   - ${file.path} (${Math.round(file.size / 1024)}KB)`)
      })
      
      // Step 3: Show SEO insights
      console.log(`🎯 SEO Score: ${calculateSEOScore(scanResult.seo)}/100`)
      console.log(`♿ Accessibility: ${scanResult.accessibility.altTexts}/${scanResult.accessibility.altTexts + scanResult.accessibility.missingAltTexts} images have alt text`)
      
    } catch (error) {
      console.error(`❌ Failed to analyze ${url}:`, error.message)
    }
  }
  
  console.log('\n✅ URL Analysis Test Complete!')
}

function calculateSEOScore(seo) {
  let score = 0
  if (seo.title) score += 25
  if (seo.description) score += 25
  if (seo.h1Tags.length === 1) score += 25
  if (seo.hasOpenGraph) score += 25
  return score
}

// Export for use in other modules
export { testUrlAnalysis }

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testUrlAnalysis().catch(console.error)
} 