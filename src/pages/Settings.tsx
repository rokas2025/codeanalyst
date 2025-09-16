import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import toast from 'react-hot-toast'

export function Settings() {
  const {
    preferredAiModel,
    beenexApiUrl,
    beenexApiKey,
    updateSetting,
    saveSettings,
    getAvailableProviders
  } = useSettingsStore()

  const [showKeys, setShowKeys] = useState({
    beenex: false
  })

  const handleSave = () => {
    const success = saveSettings()
    if (success) {
      toast.success('Settings saved successfully!')
    } else {
      toast.error('Failed to save settings')
    }
  }

  const availableProviders = getAvailableProviders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Configure your AI tools and integrations</p>
      </div>

      <div className="grid gap-6">
        {/* AI Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred AI Model</label>
              <select 
                className="mt-1 input" 
                value={preferredAiModel}
                onChange={(e) => updateSetting('preferredAiModel', e.target.value)}
              >
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
            
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">🔒 Secure API Key Management</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    For security reasons, AI API keys are now managed server-side and not stored in your browser. 
                    Contact your administrator to configure OpenAI, Anthropic, and Google API keys on the backend.
                  </p>
                </div>
              </div>
            </div>

            {/* Available Providers Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available AI Providers</h4>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map(provider => (
                  <span
                    key={provider}
                    className={`px-2 py-1 text-xs rounded-full ${
                      provider === 'local' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {provider === 'local' ? 'Demo Mode' : provider.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">GitHub Integration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Connected Account</p>
                <p className="text-sm text-gray-500">Not implemented yet</p>
              </div>
              <button className="btn-outline" disabled>Coming Soon</button>
            </div>
          </div>
        </div>

        {/* Beenex CRM Integration */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Beenex CRM Integration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">API URL</label>
              <input 
                type="url" 
                className="mt-1 input" 
                placeholder="https://api.beenex.com"
                value={beenexApiUrl}
                onChange={(e) => updateSetting('beenexApiUrl', e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <button
                  type="button"
                  onClick={() => setShowKeys(prev => ({ ...prev, beenex: !prev.beenex }))}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showKeys.beenex ? 'Hide' : 'Show'}
                </button>
              </div>
              <input 
                type={showKeys.beenex ? "text" : "password"} 
                className="mt-1 input" 
                placeholder="..."
                value={beenexApiKey}
                onChange={(e) => updateSetting('beenexApiKey', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button 
            className="btn-outline"
            onClick={() => {
              useSettingsStore.getState().resetSettings()
              toast.success('Settings reset to defaults')
            }}
          >
            Reset to Defaults
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}