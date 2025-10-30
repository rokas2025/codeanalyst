import React, { useEffect } from 'react'
import { 
  PlusCircleIcon, 
  CogIcon, 
  DocumentTextIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useContentCreatorStore } from '../../stores/contentCreatorStore'
import { TemplateSelector } from './components/TemplateSelector'
import { InputForm } from './components/InputForm'
import { SettingsPanel } from './components/SettingsPanel'
import { ContentPreview } from './components/ContentPreview'
import { ExportOptions } from './components/ExportOptions'
import { ModuleAccessGuard } from '../../components/ModuleAccessGuard'

function ContentCreatorContent() {
  const {
    currentStep,
    selectedTemplate,
    isGenerating,
    generatedContent,
    settings,
    loadTemplates,
    setCurrentStep,
    clearGeneration,
    updateSettings
  } = useContentCreatorStore()

  useEffect(() => {
    loadTemplates()
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('contentCreator_language')
    if (savedLanguage && ['en', 'lt', 'es', 'fr', 'de'].includes(savedLanguage)) {
      updateSettings({ language: savedLanguage as 'en' | 'lt' | 'es' | 'fr' | 'de' })
    }
  }, [loadTemplates, updateSettings])

  const steps = [
    { id: 'template', name: 'Template', icon: DocumentTextIcon, description: 'Choose content type' },
    { id: 'inputs', name: 'Details', icon: PlusCircleIcon, description: 'Provide information' },
    { id: 'settings', name: 'Settings', icon: CogIcon, description: 'Customize generation' },
    { id: 'preview', name: 'Generate', icon: SparklesIcon, description: 'Create content' },
    { id: 'export', name: 'Export', icon: ArrowDownTrayIcon, description: 'Save & use' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                  <span className="truncate">Content Creator</span>
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                  Generate professional content with AI-powered templates and customizable settings
                </p>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="language-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Language:
                  </label>
                  <select
                    id="language-select"
                    value={settings.language}
                    onChange={async (e) => {
                      const newLanguage = e.target.value as 'en' | 'lt' | 'es' | 'fr' | 'de'
                      updateSettings({ language: newLanguage })
                      localStorage.setItem('contentCreator_language', newLanguage)
                      await loadTemplates() // Reload templates with new language
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="lt">🇱🇹 Lietuvių</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="de">🇩🇪 Deutsch</option>
                  </select>
              </div>
              
              {selectedTemplate && (
                  <button
                    onClick={clearGeneration}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Start Over
                  </button>
                )}
                </div>
            </div>
          </div>
        </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex
                const isAvailable = index <= currentStepIndex || (selectedTemplate && index <= 2)
                
                return (
                  <li key={step.id} className="relative flex-shrink-0">
                    <button
                      onClick={() => isAvailable ? setCurrentStep(step.id as any) : null}
                      disabled={!isAvailable}
                      className={`group flex flex-col items-center p-2 rounded-lg transition-all min-w-[80px] ${
                        isActive
                          ? 'bg-purple-50 text-purple-600'
                          : isCompleted
                          ? 'text-green-600 hover:bg-green-50'
                          : isAvailable
                          ? 'text-gray-600 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : isCompleted
                          ? 'border-green-600 bg-green-600 text-white'
                          : isAvailable
                          ? 'border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-100'
                      }`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="text-center mt-1 sm:mt-2">
                        <p className="text-xs sm:text-sm font-medium">{step.name}</p>
                        <p className="text-xs hidden sm:block">{step.description}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {currentStep === 'template' && (
                <div>
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Choose a Content Template</h2>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 px-4 sm:px-0">
                      Select the type of content you want to create. Each template is optimized for specific use cases.
                    </p>
                  </div>
                  <TemplateSelector />
                </div>
              )}

              {currentStep === 'inputs' && selectedTemplate && (
                <div>
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Provide Content Details</h2>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 px-4 sm:px-0">
                      Fill in the information below to customize your {selectedTemplate.name.toLowerCase()}.
                    </p>
                  </div>
                  <InputForm />
                </div>
              )}

        {currentStep === 'settings' && (
          <SettingsPanel />
        )}

        {currentStep === 'preview' && (
          <ContentPreview />
        )}

        {currentStep === 'export' && (
          <ExportOptions />
        )}
      </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm sm:max-w-md w-full">
              <div className="text-center">
                <SparklesIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 mx-auto animate-pulse mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Creating Your Content
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  AI is analyzing your inputs and generating high-quality content. This usually takes 15-30 seconds.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export function ContentCreator() {
  return (
    <ModuleAccessGuard module="content_creator">
      <ContentCreatorContent />
    </ModuleAccessGuard>
  )
}