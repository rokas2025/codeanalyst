import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'esbuild'
  },
  esbuild: {
    // Disable type checking during build
    target: 'es2020'
  },
  define: {
    // Ensure process.env is available
    'process.env': {}
  }
}) 