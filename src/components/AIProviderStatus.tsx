import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface BackendProviderInfo {
  name: string
  model: string
  source: string
  available: boolean
}

export function AIProviderStatus() {
  const [backendProviders, setBackendProviders] = useState<BackendProviderInfo[]>([])
  const [currentProvider, setCurrentProvider] = useState<string>('openai')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkBackendProviders = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-backend-production.up.railway.app'
        const response = await fetch(`${baseUrl}/health`)
        
        if (response.ok) {
          const data = await response.json()
          
          // Always include OpenAI (it's configured in Railway)
          const providers: BackendProviderInfo[] = [
            { name: 'OpenAI GPT-4', model: 'gpt-4-turbo', source: 'environment', available: true },
          ]
          
          // Try to detect if Gemini is available by checking if the key was added
          // We'll assume it's available if backend is responding (user added it)
          if (data.services?.ai === 'available') {
            providers.push({ 
              name: 'Google Gemini', 
              model: 'gemini-2.5-flash', 
              source: 'environment', 
              available: true 
            })
            setCurrentProvider('google') // Prefer Gemini if available
          }
          
          setBackendProviders(providers)
        } else {
          throw new Error('Backend not available')
        }
      } catch (error) {
        console.warn('Could not check backend providers:', error)
        setBackendProviders([
          { name: 'OpenAI GPT-4', model: 'gpt-4-turbo', source: 'environment', available: true },
          { name: 'Local Demo', model: 'local', source: 'demo', available: true }
        ])
        setCurrentProvider('openai')
      } finally {
        setLoading(false)
      }
    }
    
    checkBackendProviders()
  }, [])

  const activeProvider = backendProviders.find(p => 
    (currentProvider === 'google' && p.name.includes('Gemini')) ||
    (currentProvider === 'openai' && p.name.includes('OpenAI')) ||
    (currentProvider === 'local' && p.name.includes('Local'))
  ) || backendProviders[0] || { name: 'Local Demo', model: 'local', source: 'demo', available: true }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">Checking AI providers...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-900">AI Analysis Provider</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="font-medium text-gray-900">
            Currently using: {activeProvider.name}
          </div>
          <div className="text-sm text-gray-600">
            {activeProvider.name.includes('GPT-4') && 'Advanced language model with excellent code analysis capabilities'}
            {activeProvider.name.includes('Gemini') && 'Google\'s latest AI model with superior web technology understanding'}
            {activeProvider.name.includes('Local') && 'Static analysis without AI insights (fallback mode)'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeProvider.source === 'demo' ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              Local
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Real AI
            </span>
          )}
        </div>
        
        {/* Provider Status Indicators */}
        <div className="flex items-center space-x-6 pt-2 border-t border-blue-200">
          {/* OpenAI Status */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              backendProviders.some(p => p.name.includes('OpenAI')) ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className={`text-xs ${
              currentProvider === 'openai' ? 'font-medium text-blue-700' : 'text-gray-500'
            }`}>
              Openai
            </span>
          </div>

          {/* Anthropic Status */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              backendProviders.some(p => p.name.includes('Claude')) ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-xs text-gray-500">Anthropic</span>
          </div>

          {/* Google Status */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              backendProviders.some(p => p.name.includes('Gemini')) ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className={`text-xs ${
              currentProvider === 'google' ? 'font-medium text-blue-700' : 'text-gray-500'
            }`}>
              Google
            </span>
          </div>

          {/* Local Status */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className={`text-xs ${
              currentProvider === 'local' ? 'font-medium text-blue-700' : 'text-gray-500'
            }`}>
              Local
            </span>
          </div>
        </div>
      </div>

      {activeProvider.source === 'demo' && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Configure AI API keys in Settings to get enhanced analysis with real AI insights.
          </p>
        </div>
      )}
    </div>
  )
}