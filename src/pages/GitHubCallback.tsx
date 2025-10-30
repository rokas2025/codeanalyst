import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function GitHubCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token')
        const oauthError = searchParams.get('error')

        if (oauthError) {
          throw new Error(`GitHub OAuth error: ${oauthError}`)
        }

        if (!token) {
          throw new Error('Missing token in callback URL')
        }

        // Store the token and decode user info
        localStorage.setItem('auth_token', token)
        
        // Decode the JWT to get user info (basic decode, server validates)
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(window.atob(base64))
        
        // Create user object from JWT payload
        const user = {
          id: payload.userId,
          githubId: payload.githubId,
          githubUsername: payload.githubUsername,
          name: payload.name || payload.githubUsername, // Use real name or fallback to username
          email: payload.email || `${payload.githubUsername}@github.local`, // Use real email or fallback
          avatarUrl: payload.avatarUrl, // GitHub avatar URL
          role: payload.role || 'user' // User role from JWT
        }
        
        localStorage.setItem('user', JSON.stringify(user))
        updateUser(user as any)
        setStatus('success')

        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/')
        }, 2000)

      } catch (err) {
        console.error('GitHub OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'OAuth authentication failed')
        setStatus('error')

        // Redirect to login after error
        setTimeout(() => {
          navigate('/login')
        }, 5000)
      }
    }

    processCallback()
  }, [searchParams, updateUser, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900">Connecting your GitHub account...</h2>
              <p className="text-gray-600 mt-2">Please wait while we complete the authentication.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Successfully connected!</h2>
              <p className="text-gray-600 mt-2">Your GitHub account has been linked. Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Authentication Failed</h2>
              <p className="text-red-600 mt-2">{error}</p>
              <p className="text-gray-600 mt-4">Redirecting back to login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
