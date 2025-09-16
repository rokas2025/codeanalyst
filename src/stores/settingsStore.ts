import { create } from 'zustand'
import { storage } from '../utils/helpers'

export interface SettingsState {
  // AI Configuration - SECURITY: API keys are now server-side only
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
  
  // AI Provider availability (backend-based)
  getAvailableProviders: () => string[]
}

const DEFAULT_SETTINGS: SettingsState = {
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
    // SECURITY: AI providers are determined by backend, not frontend API keys
    // The backend will check environment variables and database for API keys
    return ['openai', 'anthropic', 'google', 'local']
  },
}))

// Load settings on store initialization
useSettingsStore.getState().loadSettings()