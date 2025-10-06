/**
 * Token Helper Utility
 * Centralized JWT token validation and management
 */

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return true
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(base64))
    
    // Check if token has expiration and if it's expired
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000)
      // Add 60 second buffer to account for clock skew
      return payload.exp < (now + 60)
    }
    
    return false
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true // If we can't decode, treat as expired
  }
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenTimeRemaining(token: string | null): number {
  if (!token) return 0
  
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return 0
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(base64))
    
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000)
      return Math.max(0, payload.exp - now)
    }
    
    return 0
  } catch {
    return 0
  }
}

/**
 * Check token and redirect to login if expired
 */
export function checkTokenAndRedirect(): boolean {
  const token = localStorage.getItem('auth_token')
  
  if (isTokenExpired(token)) {
    console.warn('⚠️ Auth token expired, redirecting to login')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    window.location.href = '/login?expired=true'
    return false
  }
  
  return true
}

/**
 * Get authentication headers with automatic token check
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token')
  
  if (!checkTokenAndRedirect()) {
    throw new Error('Authentication token expired. Please log in again.')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
}

/**
 * Decode JWT payload without verification (client-side only)
 */
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch {
    return null
  }
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
  
  return 'Less than 1 minute'
}

