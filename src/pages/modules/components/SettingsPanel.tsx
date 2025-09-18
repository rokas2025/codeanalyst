import React, { useState, useEffect } from 'react'
import { 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useContentCreatorStore } from '../../../stores/contentCreatorStore'
import type { GenerationSettings } from '../../../types/contentCreator'

interface SettingsPanelProps {
  onComplete?: () => void
}

export function SettingsPanel({ onComplete }: SettingsPanelProps) {
  const { 
    selectedTemplate, 
    settings, 
    updateSettings, 
    setCurrentStep, 
    showAdvancedSettings,
    toggleAdvancedSettings,
    defaultSettings
  } = useContentCreatorStore()

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'presets'>('basic')

  // Preset configurations
  const presets = [
    {
      id: 'creative',
      name: 'Creative & Engaging',
      description: 'High creativity, friendly tone, engaging style',
      icon: '🎨',
      settings: {
        temperature: 0.9,
        tone: 'creative' as const,
        style: 'conversational' as const,
        audience: 'general' as const,
        ctaStrength: 'moderate' as const
      }
    },
    {
      id: 'professional',
      name: 'Professional & Formal',
      description: 'Balanced creativity, professional tone, detailed style',
      icon: '💼',
      settings: {
        temperature: 0.7,
        tone: 'professional' as const,
        style: 'detailed' as const,
        audience: 'executive' as const,
        ctaStrength: 'subtle' as const
      }
    },
    {
      id: 'persuasive',
      name: 'Sales & Marketing',
      description: 'High energy, persuasive tone, strong CTAs',
      icon: '🎯',
      settings: {
        temperature: 0.8,
        tone: 'persuasive' as const,
        style: 'concise' as const,
        audience: 'consumer' as const,
        ctaStrength: 'strong' as const
      }
    },
    {
      id: 'technical',
      name: 'Technical & Detailed',
      description: 'Lower creativity, formal tone, comprehensive style',
      icon: '🔧',
      settings: {
        temperature: 0.5,
        tone: 'formal' as const,
        style: 'detailed' as const,
        audience: 'technical' as const,
        ctaStrength: 'subtle' as const
      }
    }
  ]

  const handleSettingChange = (key: keyof GenerationSettings, value: any) => {
    updateSettings({ [key]: value })
  }

  const applyPreset = (preset: typeof presets[0]) => {
    updateSettings(preset.settings)
  }

  const resetToDefaults = () => {
    const templateDefaults = selectedTemplate?.defaultSettings || {}
    updateSettings({
      ...defaultSettings,
      ...templateDefaults
    })
  }

  const handleContinue = () => {
    setCurrentStep('preview')
    onComplete?.()
  }

  if (!selectedTemplate) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">No template selected</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <AdjustmentsHorizontalIcon className="h-6 w-6" />
          AI Generation Settings
        </h2>
        <p className="mt-2 text-gray-600">
          Fine-tune how AI generates your content. Adjust creativity, tone, and style to match your needs.
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'basic' as const, name: 'Basic Settings', icon: Cog6ToothIcon },
              { id: 'advanced' as const, name: 'Advanced', icon: AdjustmentsHorizontalIcon },
              { id: 'presets' as const, name: 'Quick Presets', icon: SparklesIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Creativity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creativity Level
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Conservative ({settings.temperature})</span>
                    <span>Creative</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Lower values produce more consistent, predictable content. Higher values are more creative and varied.
                </p>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone of Voice
                </label>
                <select
                  value={settings.tone}
                  onChange={(e) => handleSettingChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="creative">Creative</option>
                  <option value="formal">Formal</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>

              {/* Writing Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Style
                </label>
                <select
                  value={settings.style}
                  onChange={(e) => handleSettingChange('style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="conversational">Conversational</option>
                  <option value="formal">Formal</option>
                  <option value="narrative">Narrative</option>
                  <option value="list-based">List-based</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={settings.audience}
                  onChange={(e) => handleSettingChange('audience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General Public</option>
                  <option value="technical">Technical Audience</option>
                  <option value="executive">Business Executives</option>
                  <option value="consumer">Consumers</option>
                  <option value="academic">Academic</option>
                  <option value="marketing">Marketing Professionals</option>
                </select>
              </div>
            </div>
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Length (tokens)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={settings.maxTokens}
                    onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Short (500)</span>
                    <span className="font-medium">{settings.maxTokens} tokens</span>
                    <span>Long (4000)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Approximately {Math.round(settings.maxTokens * 0.75)} words. Higher values may increase generation time and cost.
                </p>
              </div>

              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
                  <option value="gpt-4">GPT-4 (Higher Quality)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  GPT-4 Turbo offers the best balance of quality and speed.
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="lt">Lithuanian</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              {/* CTA Strength */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call-to-Action Strength
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'subtle', label: 'Subtle', desc: 'Gentle suggestion' },
                    { value: 'moderate', label: 'Moderate', desc: 'Clear invitation' },
                    { value: 'strong', label: 'Strong', desc: 'Direct request' },
                    { value: 'aggressive', label: 'Aggressive', desc: 'Urgent action' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSettingChange('ctaStrength', option.value)}
                      className={`
                        p-3 text-center border rounded-lg transition-colors
                        ${settings.ctaStrength === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }
                      `}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Configuration Presets</h3>
                <p className="text-gray-600">Choose a preset that matches your content goals, then customize as needed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{preset.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{preset.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div>Creativity: {preset.settings.temperature}</div>
                          <div>Tone: {preset.settings.tone}</div>
                          <div>Style: {preset.settings.style}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Current Settings Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Current Settings</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Creativity:</span>
                    <span className="ml-1 font-medium">{settings.temperature}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tone:</span>
                    <span className="ml-1 font-medium capitalize">{settings.tone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Style:</span>
                    <span className="ml-1 font-medium capitalize">{settings.style}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Audience:</span>
                    <span className="ml-1 font-medium capitalize">{settings.audience}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={resetToDefaults}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Reset to Template Defaults
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentStep('inputs')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Details
            </button>

            <button
              onClick={handleContinue}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate Content →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
