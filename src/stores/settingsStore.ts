import { create } from 'zustand'
import { storage } from '../utils/helpers'

export interface SettingsState {
  // AI Configuration
  preferredAiModel: string
  // User API Keys (stored securely on backend, displayed here for management)
  userApiKeys: {
    openai: string
    anthropic: string
    google: string
  }
  
  // GitHub Integration  
  githubToken: string
  githubConnected: boolean
  
  // Beenex CRM Integration
  beenexApiUrl: string
  beenexApiKey: string
  
  // General settings
  debugMode: boolean
}

interface SettingsStore extends SettingsState {
  // Actions
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  saveSettings: () => boolean
  loadSettings: () => void
  resetSettings: () => void
  
  // AI Provider actions
  setApiKey: (provider: 'openai' | 'anthropic' | 'google', key: string) => Promise<boolean>
  getAvailableProviders: () => string[]
  validateApiKey: (provider: string, key: string) => boolean
}

const DEFAULT_SETTINGS: SettingsState = {
  preferredAiModel: 'gpt-4-turbo',
  userApiKeys: {
    openai: '',
    anthropic: '',
    google: ''
  },
  githubToken: '',
  githubConnected: false,
  beenexApiUrl: 'https://api.beenex.com',
  beenexApiKey: '',
  debugMode: false,
}

const STORAGE_KEY = 'adoreino_settings'

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  updateSetting: (key, value) => {
    set({ [key]: value })
  },

  saveSettings: () => {
    try {
      const state = get()
      const settingsToSave: SettingsState = {
        preferredAiModel: state.preferredAiModel,
        githubToken: state.githubToken,
        githubConnected: state.githubConnected,
        beenexApiUrl: state.beenexApiUrl,
        beenexApiKey: state.beenexApiKey,
        debugMode: state.debugMode,
      }
      
      const success = storage.set(STORAGE_KEY, settingsToSave)
      if (success) {
        console.log('✅ Settings saved successfully')
      }
      return success
    } catch (error) {
      console.error('❌ Failed to save settings:', error)
      return false
    }
  },

  loadSettings: () => {
    try {
      const savedSettings = storage.get(STORAGE_KEY)
      if (savedSettings) {
        set({ ...DEFAULT_SETTINGS, ...savedSettings })
        console.log('✅ Settings loaded successfully')
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error)
    }
  },

  resetSettings: () => {
    set(DEFAULT_SETTINGS)
    storage.remove(STORAGE_KEY)
    console.log('✅ Settings reset to defaults')
  },

  getAvailableProviders: () => {
    // Check which providers have API keys configured
    const state = get()
    const providers = []
    
    if (state.userApiKeys.openai) providers.push('openai')
    if (state.userApiKeys.anthropic) providers.push('anthropic') 
    if (state.userApiKeys.google) providers.push('google')
    
    // Always include backend providers
    providers.push('backend') // For Railway environment keys
    
    return providers.length > 1 ? providers : ['backend', 'local']
  },

  setApiKey: async (provider, key) => {
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      
      const response = await fetch(`${baseUrl}/settings/api-keys`, {
        method: 'PUT', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, key })
      })
      
      if (response.ok) {
        set(state => ({
          userApiKeys: {
            ...state.userApiKeys,
            [provider]: key.substring(0, 8) + '...' // Store masked version for display
          }
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save API key:', error)
      return false
    }
  },

  validateApiKey: (provider, key) => {
    if (!key || key.length < 10) return false
    
    switch (provider) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 40
      case 'anthropic':
        return key.startsWith('sk-ant-') && key.length > 40
      case 'google':
        return key.startsWith('AI') && key.length > 30
      default:
        return false
    }
  },
}))

// Load settings on store initialization
useSettingsStore.getState().loadSettings()