/**
 * Build WordPress Plugin ZIP
 * Dynamically creates codeanalyst-connector.zip from wordpress-plugin/ directory
 * Run on Railway deployment or on-demand
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths
const pluginSourceDir = path.join(__dirname, '../../wordpress-plugin')
const outputZipPath = path.join(__dirname, '../../codeanalyst-connector.zip')

console.log('🔨 Building WordPress plugin ZIP...')
console.log('📁 Source:', pluginSourceDir)
console.log('📦 Output:', outputZipPath)

// Check if source directory exists
if (!fs.existsSync(pluginSourceDir)) {
  console.error('❌ Plugin source directory not found:', pluginSourceDir)
  process.exit(1)
}

// Remove old ZIP if exists
if (fs.existsSync(outputZipPath)) {
  console.log('🗑️  Removing old ZIP file...')
  fs.unlinkSync(outputZipPath)
}

// Create write stream
const output = fs.createWriteStream(outputZipPath)
const archive = archiver('zip', { zlib: { level: 9 } })

// Listen for events
output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2)
  console.log(`✅ Plugin ZIP created successfully!`)
  console.log(`📦 Size: ${sizeMB} MB`)
  console.log(`📍 Location: ${outputZipPath}`)
})

archive.on('error', (err) => {
  console.error('❌ Archive error:', err)
  throw err
})

// Pipe archive to output
archive.pipe(output)

// Add wordpress-plugin directory contents to ZIP
// Using directory() with prefix to create codeanalyst-connector/ folder inside ZIP
archive.directory(pluginSourceDir, 'codeanalyst-connector')

// Finalize the archive
archive.finalize()

