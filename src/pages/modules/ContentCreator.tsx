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
// import { InputForm } from './components/InputForm' // TODO: Implement InputForm component
// import { SettingsPanel } from './components/SettingsPanel' // TODO: Implement SettingsPanel component  
// import { ContentPreview } from './components/ContentPreview' // TODO: Implement ContentPreview component
// import { ExportOptions } from './components/ExportOptions' // TODO: Implement ExportOptions component

export function ContentCreator() {
  const {
    currentStep,
    selectedTemplate,
    isGenerating,
    generatedContent,
    loadTemplates,
    setCurrentStep,
    clearGeneration
  } = useContentCreatorStore()

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
                Content Creator
              </h1>
              <p className="mt-2 text-gray-600">
                Generate professional content with AI-powered templates and customizable settings
              </p>
            </div>
            
            {selectedTemplate && (
              <button
                onClick={clearGeneration}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex
                const isAvailable = index <= currentStepIndex || (selectedTemplate && index <= 2)
                
                return (
                  <li key={step.id} className="relative">
                    <button
                      onClick={() => isAvailable ? setCurrentStep(step.id as any) : null}
                      disabled={!isAvailable}
                      className={`group flex flex-col items-center p-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-purple-50 text-purple-600'
                          : isCompleted
                          ? 'text-green-600 hover:bg-green-50'
                          : isAvailable
                          ? 'text-gray-600 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : isCompleted
                          ? 'border-green-600 bg-green-600 text-white'
                          : isAvailable
                          ? 'border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-100'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-sm font-medium">{step.name}</p>
                        <p className="text-xs">{step.description}</p>
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Choose a Content Template</h2>
              <p className="mt-2 text-gray-600">
                Select the type of content you want to create. Each template is optimized for specific use cases.
              </p>
            </div>
            <TemplateSelector />
          </div>
        )}

        {currentStep === 'inputs' && selectedTemplate && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Provide Content Details</h2>
              <p className="mt-2 text-gray-600">
                Fill in the information below to customize your {selectedTemplate.name.toLowerCase()}.
              </p>
            </div>
            {/* TODO: Replace with InputForm component */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Input Form - Coming Soon</h3>
                <p className="text-yellow-700">
                  The dynamic input form for template customization is being developed. 
                  This will allow you to enter specific details for your {selectedTemplate.name.toLowerCase()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'settings' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <AdjustmentsHorizontalIcon className="h-6 w-6" />
                Generation Settings
              </h2>
              <p className="mt-2 text-gray-600">
                Fine-tune how AI generates your content. Adjust creativity, tone, and style to match your needs.
              </p>
            </div>
            {/* TODO: Replace with SettingsPanel component */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Settings Panel - Coming Soon</h3>
                <p className="text-yellow-700">
                  The AI generation settings panel is being developed. This will allow you to control
                  temperature, tone, style, and other AI parameters.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <SparklesIcon className="h-6 w-6 animate-pulse text-purple-600" />
                    Generating Content...
                  </>
                ) : generatedContent ? (
                  <>
                    <EyeIcon className="h-6 w-6" />
                    Preview & Edit
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-6 w-6" />
                    Ready to Generate
                  </>
                )}
              </h2>
              <p className="mt-2 text-gray-600">
                {isGenerating
                  ? 'AI is creating your content. This may take a few moments...'
                  : generatedContent
                  ? 'Review your generated content and make any necessary edits.'
                  : 'Click generate to create your content using AI.'
                }
              </p>
            </div>
            {/* TODO: Replace with ContentPreview component */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Content Preview - Coming Soon</h3>
                <p className="text-yellow-700">
                  The content preview and editing interface is being developed. This will show
                  your generated content with live editing capabilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'export' && generatedContent && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <ArrowDownTrayIcon className="h-6 w-6" />
                Export & Use
              </h2>
              <p className="mt-2 text-gray-600">
                Your content is ready! Choose how you want to export and use it.
              </p>
            </div>
            {/* TODO: Replace with ExportOptions component */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Export Options - Coming Soon</h3>
                <p className="text-yellow-700">
                  The export and download functionality is being developed. This will allow you to
                  save your content in various formats (HTML, Markdown, PDF, etc.).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <SparklesIcon className="h-16 w-16 text-purple-600 mx-auto animate-pulse mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Creating Your Content
              </h3>
              <p className="text-gray-600 mb-4">
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