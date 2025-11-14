import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { getApiUrl } from '../lib/api'
import toast from 'react-hot-toast'

export function AuthCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state: any) => state.setAuth)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase is not configured')
        }

        let session = null
        let sessionError: Error | null = null
        const urlContainsAuthParams = window.location.href.includes('code=') || window.location.hash.includes('access_token=')

        if (urlContainsAuthParams) {
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
          if (error) {
            sessionError = error
          } else {
            session = data.session
          }
        }

        if (!session) {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            sessionError = error
          } else {
            session = data.session
          }
        }

        if (!session) {
          throw sessionError || new Error('No session found. Please try signing in again.')
        }

        const response = await fetch(getApiUrl('/auth/sync-supabase'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUserId: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          const message = data.error || data.message || 'Authentication failed'
          await supabase.auth.signOut()
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          throw new Error(message)
        }

        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        if (setAuth) {
          setAuth(true, data.user)
        }

        toast.success('Login successful!')
        navigate('/', { replace: true })
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast.error(error.message || 'Authentication failed')
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

