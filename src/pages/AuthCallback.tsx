import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function AuthCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state: any) => state.setAuth)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured')
      }

      // Get session from URL hash
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (session) {
        // Sync with backend to get our JWT
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/sync-supabase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUserId: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          localStorage.setItem('token', data.token)
          if (setAuth) {
            setAuth(true, data.user)
          }
          toast.success('Login successful!')
          navigate('/')
        } else {
          throw new Error(data.error || 'Authentication failed')
        }
      } else {
        throw new Error('No session found')
      }
    } catch (error: any) {
      console.error('Auth callback error:', error)
      toast.error(error.message || 'Authentication failed')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

