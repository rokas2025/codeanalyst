import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global diagnostics
if (typeof window !== 'undefined') {
  // Avoid duplicating listeners on HMR
  const ANY_KEY = '__CA_DIAGNOSTICS_INSTALLED__'
  // @ts-expect-error - attach flag on window
  if (!window[ANY_KEY]) {
    console.info('[Boot] environment', {
      mode: import.meta.env.MODE,
      base: import.meta.env.BASE_URL,
      prod: import.meta.env.PROD,
      dev: import.meta.env.DEV,
    })
    window.addEventListener('error', (e) => {
      console.error('[Global Error]', e?.error || e?.message || e)
    })
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[Unhandled Rejection]', e.reason)
    })
    // @ts-expect-error - attach flag on window
    window[ANY_KEY] = true
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

console.log('[Boot] Mounting React root...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
) 