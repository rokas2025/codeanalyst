#!/usr/bin/env node

// Custom build script for Vercel to avoid core-js issues
import { build } from 'vite'
import react from '@vitejs/plugin-react'

async function buildForVercel() {
  try {
    console.log('Starting Vercel build...')
    
    await build({
      plugins: [react()],
      resolve: {
        alias: {
          '@': '/src',
        },
      },
      build: {
        outDir: 'dist',
        target: 'es2020',
        minify: 'esbuild',
        rollupOptions: {
          treeshake: {
            moduleSideEffects: false
          }
        }
      },
      logLevel: 'info'
    })
    
    console.log('Vercel build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildForVercel() 