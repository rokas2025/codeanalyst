import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      external: (id: string) => {
        // Exclude all commonjs-external modules that cause issues on Vercel
        if (id.indexOf('?commonjs-external') !== -1) return true
        if (id.indexOf('core-js/internals') !== -1) return true
        if (id.indexOf('define-globalThis') !== -1) return true
        return false
      },
      output: {
        manualChunks: undefined
      }
    }
  },
  esbuild: {
    target: 'esnext'
  },
})
