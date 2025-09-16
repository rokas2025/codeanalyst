// AI Provider configuration and validation utilities

export interface AIProviderInfo {
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  models: string[]
  description: string
  requiresApiKey: boolean
  website: string
}

export const AI_PROVIDERS: Record<string, AIProviderInfo> = {
  openai: {
    name: 'OpenAI GPT-4',
    provider: 'openai',
    models: ['gpt-4', 'gpt-4-turbo'],
    description: 'Advanced language model with excellent code analysis capabilities',
    requiresApiKey: true,
    website: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic Claude',
    provider: 'anthropic',
    models: ['claude-3-sonnet', 'claude-3-haiku'],
    description: 'Highly capable AI assistant with strong reasoning abilities',
    requiresApiKey: true,
    website: 'https://console.anthropic.com/account/keys'
  },
  google: {
    name: 'Google Gemini 2.5',
    provider: 'google',
    models: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    description: 'Google\'s latest multimodal AI models for text and code analysis',
    requiresApiKey: true,
    website: 'https://makersuite.google.com/app/apikey'
  },
  local: {
    name: 'Local Demo Mode',
    provider: 'local',
    models: ['local'],
    description: 'Mock AI responses for testing and demonstration purposes',
    requiresApiKey: false,
    website: ''
  }
}

function getStoredApiKey(provider: string): string | null {
  try {
    const settings = localStorage.getItem('adoreino_settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      switch (provider) {
        case 'openai':
          return parsed.openaiApiKey || null
        case 'anthropic':
          return parsed.anthropicApiKey || null
        case 'google':
          return parsed.googleApiKey || null
        default:
          return null
      }
    }
  } catch (error) {
    console.warn('Failed to read stored API keys:', error)
  }
  return null
}

export function getAvailableProviders(): AIProviderInfo[] {
  const providers: AIProviderInfo[] = []
  
  // Check both environment variables and localStorage for API keys
  const openaiKey = getStoredApiKey('openai') || import.meta.env.VITE_OPENAI_API_KEY
  const anthropicKey = getStoredApiKey('anthropic') || import.meta.env.VITE_ANTHROPIC_API_KEY
  const googleKey = getStoredApiKey('google') || import.meta.env.VITE_GOOGLE_API_KEY
  
  if (openaiKey && openaiKey !== 'demo-key' && openaiKey !== 'your_openai_api_key_here' && validateApiKey('openai', openaiKey)) {
    providers.push(AI_PROVIDERS.openai)
  }
  
  if (anthropicKey && anthropicKey !== 'demo-key' && anthropicKey !== 'your_anthropic_api_key_here' && validateApiKey('anthropic', anthropicKey)) {
    providers.push(AI_PROVIDERS.anthropic)
  }
  
  if (googleKey && googleKey !== 'demo-key' && googleKey !== 'your_google_api_key_here' && validateApiKey('google', googleKey)) {
    providers.push(AI_PROVIDERS.google)
  }
  
  // Always include local demo mode
  providers.push(AI_PROVIDERS.local)
  
  return providers
}

export function validateApiKey(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey === 'demo-key') return false
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 30
    case 'google':
      return apiKey.length > 20 && !apiKey.includes('your_')
    case 'local':
      return true
    default:
      return false
  }
}

export function getProviderStatus(): Record<string, { available: boolean; configured: boolean; reason?: string }> {
  const status: Record<string, { available: boolean; configured: boolean; reason?: string }> = {}
  
  Object.keys(AI_PROVIDERS).forEach(key => {
    const provider = AI_PROVIDERS[key]
    
    if (provider.provider === 'local') {
      status[key] = { available: true, configured: true }
      return
    }
    
    const envKey = `VITE_${provider.provider.toUpperCase()}_API_KEY`
    const apiKey = import.meta.env[envKey]
    
    const isConfigured = validateApiKey(provider.provider, apiKey)
    
    status[key] = {
      available: true,
      configured: isConfigured,
      reason: isConfigured ? undefined : `API key not configured. Set ${envKey} in your .env file.`
    }
  })
  
  return status
}

export function getBestAvailableProvider(): { provider: string; model: string } {
  const providers = getAvailableProviders()
  
  // Priority: Google > OpenAI > Anthropic > Local
  const googleProvider = providers.find(p => p.provider === 'google')
  if (googleProvider) {
    return {
      provider: googleProvider.provider,
      model: 'gemini-2.5-flash' // Use the latest stable model
    }
  }
  
  const openaiProvider = providers.find(p => p.provider === 'openai')
  if (openaiProvider) {
    return {
      provider: openaiProvider.provider,
      model: openaiProvider.models[0]
    }
  }
  
  const anthropicProvider = providers.find(p => p.provider === 'anthropic')
  if (anthropicProvider) {
    return {
      provider: anthropicProvider.provider,
      model: anthropicProvider.models[0]
    }
  }
  
  return {
    provider: 'local',
    model: 'local'
  }
}