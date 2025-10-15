import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { wordpressService } from '../services/wordpressService'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export function Settings() {
  const {
    preferredAiModel,
    userApiKeys,
    beenexApiUrl,
    beenexApiKey,
    updateSetting,
    saveSettings,
    setApiKey,
    validateApiKey,
    getAvailableProviders
  } = useSettingsStore()

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    beenex: false
  })

  const [tempApiKeys, setTempApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  })

  const [wordpressApiKey, setWordpressApiKey] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)

  const handleSave = () => {
    const success = saveSettings()
    if (success) {
      toast.success('Settings saved successfully!')
    } else {
      toast.error('Failed to save settings')
    }
  }

  const handleApiKeySave = async (provider: 'openai' | 'anthropic' | 'google') => {
    const key = tempApiKeys[provider]
    
    if (!key) {
      toast.error('Please enter an API key')
      return
    }

    if (!validateApiKey(provider, key)) {
      toast.error(`Invalid ${provider} API key format`)
      return
    }

    const success = await setApiKey(provider, key)
    if (success) {
      toast.success(`${provider.toUpperCase()} API key saved successfully!`)
      setTempApiKeys(prev => ({ ...prev, [provider]: '' }))
    } else {
      toast.error(`Failed to save ${provider} API key`)
    }
  }

  const handleGenerateWordPressKey = async () => {
    setGeneratingKey(true)
    try {
      const response = await wordpressService.generateApiKey()
      if (response.success && response.apiKey) {
        setWordpressApiKey(response.apiKey)
        toast.success('WordPress API key generated successfully!')
      } else {
        toast.error(response.message || 'Failed to generate API key')
      }
    } catch (error) {
      toast.error('Failed to generate API key')
    } finally {
      setGeneratingKey(false)
    }
  }

  const handleCopyWordPressKey = () => {
    if (wordpressApiKey) {
      navigator.clipboard.writeText(wordpressApiKey)
      toast.success('API key copied to clipboard!')
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
            
                {/* OpenAI API Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      OpenAI API Key
                      {userApiKeys.openai && <span className="ml-2 text-xs text-green-600">✓ Configured</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showKeys.openai ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-1 flex space-x-2">
                    <input 
                      type={showKeys.openai ? "text" : "password"} 
                      className="input flex-1" 
                      placeholder={userApiKeys.openai ? userApiKeys.openai : "sk-..."}
                      value={tempApiKeys.openai}
                      onChange={(e) => setTempApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                    />
                    <button 
                      onClick={() => handleApiKeySave('openai')}
                      className="btn-primary px-3 py-2 text-sm"
                      disabled={!tempApiKeys.openai}
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Get your key from: https://platform.openai.com/api-keys</p>
                </div>

                {/* Anthropic API Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Anthropic (Claude) API Key
                      {userApiKeys.anthropic && <span className="ml-2 text-xs text-green-600">✓ Configured</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, anthropic: !prev.anthropic }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showKeys.anthropic ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-1 flex space-x-2">
                    <input 
                      type={showKeys.anthropic ? "text" : "password"} 
                      className="input flex-1" 
                      placeholder={userApiKeys.anthropic ? userApiKeys.anthropic : "sk-ant-..."}
                      value={tempApiKeys.anthropic}
                      onChange={(e) => setTempApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                    />
                    <button 
                      onClick={() => handleApiKeySave('anthropic')}
                      className="btn-primary px-3 py-2 text-sm"
                      disabled={!tempApiKeys.anthropic}
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Get your key from: https://console.anthropic.com/</p>
                </div>

                {/* Google Gemini API Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Google Gemini API Key
                      {userApiKeys.google && <span className="ml-2 text-xs text-green-600">✓ Configured</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, google: !prev.google }))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showKeys.google ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-1 flex space-x-2">
                    <input 
                      type={showKeys.google ? "text" : "password"} 
                      className="input flex-1" 
                      placeholder={userApiKeys.google ? userApiKeys.google : "AI..."}
                      value={tempApiKeys.google}
                      onChange={(e) => setTempApiKeys(prev => ({ ...prev, google: e.target.value }))}
                    />
                    <button 
                      onClick={() => handleApiKeySave('google')}
                      className="btn-primary px-3 py-2 text-sm"
                      disabled={!tempApiKeys.google}
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Get your key from: https://aistudio.google.com/app/apikey</p>
                </div>

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-900">🔒 Secure Storage</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your API keys are encrypted and stored securely in our database. They are never exposed in your browser or logs.
                        Keys have priority: Your Keys → Railway Environment → Demo Mode.
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

        {/* WordPress Integration */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">WordPress Integration</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your WordPress websites to CodeAnalyst for theme analysis and content management.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key for WordPress Plugin
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={wordpressApiKey}
                  readOnly
                  className="input flex-1 font-mono text-sm"
                  placeholder="Generate an API key to connect WordPress sites"
                />
                <button 
                  onClick={handleGenerateWordPressKey}
                  disabled={generatingKey}
                  className="btn-primary px-4 whitespace-nowrap"
                >
                  {generatingKey ? 'Generating...' : 'Generate Key'}
                </button>
                <button 
                  onClick={handleCopyWordPressKey}
                  disabled={!wordpressApiKey}
                  className="btn-outline px-4"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use this key in the CodeAnalyst WordPress plugin to connect your site
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to connect WordPress:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Download and install the CodeAnalyst Connector plugin on your WordPress site</li>
                <li>Generate an API key above</li>
                <li>Enter the API key in the WordPress plugin settings</li>
                <li>Click "Connect to CodeAnalyst" in the plugin</li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-600">
                View and manage your connected WordPress sites
              </p>
              <Link to="/connected-sites" className="btn-outline">
                View Connected Sites →
              </Link>
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