import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import toast from 'react-hot-toast'

export function Settings() {
  const {
    openaiApiKey,
    anthropicApiKey,
    googleApiKey,
    preferredAiModel,
    beenexApiUrl,
    beenexApiKey,
    updateSetting,
    saveSettings,
    isValidApiKey,
    getAvailableProviders
  } = useSettingsStore()

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    beenex: false
  })

  const handleSave = () => {
    const success = saveSettings()
    if (success) {
      toast.success('Settings saved successfully!')
      // Trigger a reload of the page to reinitialize AI service with new keys
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      toast.error('Failed to save settings')
    }
  }

  const getKeyStatus = (provider: string, key: string) => {
    if (!key) return { status: 'empty', color: 'text-gray-400', text: 'Not configured' }
    if (isValidApiKey(provider, key)) return { status: 'valid', color: 'text-green-600', text: 'Valid' }
    return { status: 'invalid', color: 'text-red-600', text: 'Invalid format' }
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
            
            {/* OpenAI API Key */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">OpenAI API Key</label>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${getKeyStatus('openai', openaiApiKey).color}`}>
                    {getKeyStatus('openai', openaiApiKey).text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.openai ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <input 
                type={showKeys.openai ? "text" : "password"} 
                className="mt-1 input" 
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
              />
            </div>
            
            {/* Anthropic API Key */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Anthropic API Key</label>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${getKeyStatus('anthropic', anthropicApiKey).color}`}>
                    {getKeyStatus('anthropic', anthropicApiKey).text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, anthropic: !prev.anthropic }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.anthropic ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <input 
                type={showKeys.anthropic ? "text" : "password"} 
                className="mt-1 input" 
                placeholder="sk-ant-..."
                value={anthropicApiKey}
                onChange={(e) => updateSetting('anthropicApiKey', e.target.value)}
              />
            </div>
            
            {/* Google API Key */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Google Gemini API Key</label>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${getKeyStatus('google', googleApiKey).color}`}>
                    {getKeyStatus('google', googleApiKey).text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, google: !prev.google }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.google ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <input 
                type={showKeys.google ? "text" : "password"} 
                className="mt-1 input" 
                placeholder="AI..."
                value={googleApiKey}
                onChange={(e) => updateSetting('googleApiKey', e.target.value)}
              />
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