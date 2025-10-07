import { create } from 'zustand'
import { AuthState, User } from '../types'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  loginWithGitHub: () => Promise<void>
  handleGitHubCallback: (code: string, state: string) => Promise<User>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  checkAuth: () => Promise<void>
  set_token: (token: string) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  set_token: (token: string) => {
    localStorage.setItem('auth_token', token)
    set({ isAuthenticated: true, loading: false })
  },

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: '1',
        email,
        name: 'Demo User',
        githubUsername: 'demo-user',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set({
        user: mockUser,
        isAuthenticated: true,
        loading: false
      })

      localStorage.setItem('auth_token', 'mock_token')
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  loginWithGitHub: async () => {
    set({ loading: true })
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      console.log('GitHub login: calling', `${baseUrl}/auth/github`)
      
      const response = await fetch(`${baseUrl}/auth/github`, {
        method: 'GET',
        credentials: 'include', // Required for CORS with credentials
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      console.log('GitHub login response:', data)

      if (!data.success) throw new Error(data.error || 'Failed to initiate GitHub OAuth')

      localStorage.setItem('github_oauth_state', data.state)
      console.log('GitHub login: redirecting to', data.authUrl)
      
      window.location.href = data.authUrl
    } catch (error) {
      console.error('GitHub login error in auth store:', error)
      set({ loading: false })
      throw error
    }
  },

  handleGitHubCallback: async (code: string, state: string) => {
    set({ loading: true })
    try {
      const storedState = localStorage.getItem('github_oauth_state')
      if (state !== storedState) throw new Error('Invalid OAuth state parameter')

      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      const response = await fetch(`${baseUrl}/auth/github/callback`, {
        method: 'POST',
        credentials: 'include', // Required for CORS with credentials
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ code, state })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'GitHub OAuth failed')

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.removeItem('github_oauth_state')

      set({ user: data.user, isAuthenticated: true, loading: false })

      return data.user
    } catch (error) {
      set({ loading: false })
      localStorage.removeItem('github_oauth_state')
      throw error
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, loading: false })
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  },

  updateUser: (updatedUser: Partial<User>) => {
    const { user } = get()
    if (user) {
      const newUser = { ...user, ...updatedUser }
      set({ user: newUser })
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  },

  checkAuth: async () => {
    set({ loading: true })
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        const user = JSON.parse(userData)
        set({ user, isAuthenticated: true, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },
}))

// Run auth check immediately
useAuthStore.getState().checkAuth()
