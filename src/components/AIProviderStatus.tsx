import React from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { getProviderStatus, getAvailableProviders } from '../services/aiService'

export function AIProviderStatus() {
  const providerStatus = getProviderStatus()
  const availableProviders = getAvailableProviders()
  
  const activeProvider = availableProviders.find(p => p.provider !== 'local') || availableProviders[0]

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-900">AI Analysis Provider</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">
              Currently using: {activeProvider.name}
            </div>
            <div className="text-sm text-gray-600">
              {activeProvider.description}
            </div>
            {activeProvider.provider === 'google' && (
              <div className="text-xs text-green-600 mt-1">
                Using latest Gemini 2.5 Flash model
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeProvider.provider === 'local' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                {activeProvider.provider === 'google' ? 'Gemini 2.5' : 'Real AI'}
              </span>
            )}
          </div>
        </div>

        {activeProvider.provider === 'local' && (
          <div className="text-sm text-yellow-800 bg-yellow-100 rounded p-3">
            <p className="font-medium mb-1">🔧 Enable Real AI Analysis:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Get an API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI</a>, <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic</a>, or <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google</a></li>
              <li>Add it to your .env file (e.g., VITE_OPENAI_API_KEY=your_key_here)</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(providerStatus).map(([key, status]) => (
            <div key={key} className="flex items-center space-x-1">
              {status.configured ? (
                <CheckCircleIcon className="h-3 w-3 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="h-3 w-3 text-gray-400" />
              )}
              <span className={status.configured ? 'text-green-700' : 'text-gray-500'}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}