import { create } from 'zustand'
import { storage } from '../utils/helpers'

export interface SettingsState {
  // AI Configuration
  openaiApiKey: string
  anthropicApiKey: string
  googleApiKey: string
  preferredAiModel: string
  
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
  
  // API Key management
  setOpenAIKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  setGoogleKey: (key: string) => void
  
  // Validation
  isValidApiKey: (provider: string, key: string) => boolean
  getAvailableProviders: () => string[]
}

const DEFAULT_SETTINGS: SettingsState = {
  openaiApiKey: '',
  anthropicApiKey: '',
  googleApiKey: '',
  preferredAiModel: 'gpt-4-turbo',
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
        openaiApiKey: state.openaiApiKey,
        anthropicApiKey: state.anthropicApiKey,
        googleApiKey: state.googleApiKey,
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

  setOpenAIKey: (key: string) => {
    set({ openaiApiKey: key })
  },

  setAnthropicKey: (key: string) => {
    set({ anthropicApiKey: key })
  },

  setGoogleKey: (key: string) => {
    set({ googleApiKey: key })
  },

  isValidApiKey: (provider: string, key: string) => {
    if (!key || key.trim() === '') return false
    
    switch (provider.toLowerCase()) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20
      case 'anthropic':
        return key.startsWith('sk-ant-') && key.length > 20
      case 'google':
        return key.length > 20 // Google API keys vary in format
      default:
        return false
    }
  },

  getAvailableProviders: () => {
    const state = get()
    const providers: string[] = []
    
    if (state.isValidApiKey('openai', state.openaiApiKey)) {
      providers.push('openai')
    }
    if (state.isValidApiKey('anthropic', state.anthropicApiKey)) {
      providers.push('anthropic')
    }
    if (state.isValidApiKey('google', state.googleApiKey)) {
      providers.push('google')
    }
    
    // Always include local demo mode
    providers.push('local')
    
    return providers
  },
}))

// Load settings on store initialization
useSettingsStore.getState().loadSettings()