/**
 * API Configuration Helper
 * Normalizes the API base URL from environment variables
 */

/**
 * Get the normalized API base URL
 * Handles various formats of VITE_API_URL:
 * - "https://example.com/api" -> "https://example.com/api"
 * - "https://example.com" -> "https://example.com/api"
 * - "https://example.com/" -> "https://example.com/api"
 * - undefined -> fallback to default
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'https://codeanalyst-production.up.railway.app/api'
  
  if (!envUrl) {
    return fallbackUrl
  }
  
  // Remove trailing slashes
  let normalized = envUrl.trim().replace(/\/+$/, '')
  
  // If URL doesn't end with /api, append it
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`
  }
  
  return normalized
}

/**
 * Get the full API endpoint URL
 * @param endpoint - The endpoint path (e.g., "/auth/login" or "auth/login")
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${cleanEndpoint}`
}

