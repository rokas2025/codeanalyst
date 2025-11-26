// Check Analysis Script - Query database for analysis debugging
// Usage: cd backend; node scripts/check-analysis.js [analysis-id]
// If no ID provided, shows latest 5 analyses

import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkAnalysis(analysisId) {
  try {
    console.log('\n🔍 CodeAnalyst Database Query Tool')
    console.log('='.repeat(50))
    
    const client = await pool.connect()
    
    if (analysisId) {
      // Get specific analysis
      console.log(`\n📋 Fetching analysis: ${analysisId}`)
      
      const result = await client.query(`
        SELECT id, status, created_at, total_files, total_lines, 
               code_quality_score, risk_assessment,
               source_type, metadata
        FROM code_analyses 
        WHERE id = $1
      `, [analysisId])
      
      if (result.rows.length === 0) {
        console.log('❌ Analysis not found')
        client.release()
        await pool.end()
        return
      }
      
      const row = result.rows[0]
      console.log('\n📊 Analysis Details:')
      console.log('  ID:', row.id)
      console.log('  Status:', row.status)
      console.log('  Source:', row.source_type)
      console.log('  Created:', row.created_at)
      console.log('  Files:', row.total_files)
      console.log('  Lines:', row.total_lines)
      console.log('  Quality Score:', row.code_quality_score)
      
      // Parse risk assessment
      const riskAssessment = row.risk_assessment || {}
      const securityRisks = riskAssessment.securityRisks || {}
      
      console.log('\n🔒 Security Analysis:')
      console.log('  Total Issues:', securityRisks.totalIssues || 0)
      console.log('  Score:', securityRisks.score || 'N/A')
      console.log('  Critical:', securityRisks.critical?.length || 0)
      console.log('  High:', securityRisks.high?.length || 0)
      console.log('  Medium:', securityRisks.medium?.length || 0)
      console.log('  Low:', securityRisks.low?.length || 0)
      console.log('  Vulnerabilities Array:', securityRisks.vulnerabilities?.length || 0)
      
      // Show sample vulnerability
      if (securityRisks.vulnerabilities?.length > 0) {
        console.log('\n📝 Sample Vulnerability:')
        console.log(JSON.stringify(securityRisks.vulnerabilities[0], null, 2))
      }
      
      // Show full risk_assessment structure
      console.log('\n📦 Full risk_assessment structure (keys):')
      console.log('  Top level:', Object.keys(riskAssessment))
      console.log('  securityRisks keys:', Object.keys(securityRisks))
      
    } else {
      // List recent analyses
      console.log('\n📋 Recent Analyses (last 5):')
      
      const result = await client.query(`
        SELECT id, status, source_type, created_at, total_files,
               code_quality_score,
               (risk_assessment->'securityRisks'->>'totalIssues')::int as security_issues
        FROM code_analyses 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      if (result.rows.length === 0) {
        console.log('  No analyses found')
      } else {
        result.rows.forEach((row, i) => {
          console.log(`\n  ${i + 1}. ${row.id}`)
          console.log(`     Status: ${row.status} | Source: ${row.source_type}`)
          console.log(`     Files: ${row.total_files} | Quality: ${row.code_quality_score}`)
          console.log(`     Security Issues: ${row.security_issues || 0}`)
          console.log(`     Created: ${row.created_at}`)
        })
        
        console.log('\n💡 Tip: Run with analysis ID to see details:')
        console.log(`   node scripts/check-analysis.js ${result.rows[0].id}`)
      }
    }
    
    client.release()
    await pool.end()
    console.log('\n✅ Done')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
    await pool.end()
  }
}

// Get analysis ID from command line
const analysisId = process.argv[2]
checkAnalysis(analysisId)

