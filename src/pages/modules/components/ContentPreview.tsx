import React, { useState, useRef, useEffect } from 'react'
import { 
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useContentCreatorStore } from '../../../stores/contentCreatorStore'
import type { ContentSection } from '../../../types/contentCreator'
import EnhancedPreview from '../ContentCreator/components/EnhancedPreview'

interface ContentPreviewProps {
  onComplete?: () => void
}

export function ContentPreview({ onComplete }: ContentPreviewProps) {
  const { 
    selectedTemplate,
    inputs,
    settings,
    generatedContent,
    isGenerating,
    generateContent,
    regenerateSection,
    setCurrentStep,
    previewMode,
    setPreviewMode,
    generationError,
    lastGenerationMetadata,
    clearErrors,
    previewTheme,
    previewViewport,
    setPreviewTheme,
    setPreviewViewport
  } = useContentCreatorStore()

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string>('')
  const [localContent, setLocalContent] = useState<ContentSection[]>([])
  const [showGenerationOptions, setShowGenerationOptions] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync local content with store
  useEffect(() => {
    if (generatedContent?.content) {
      setLocalContent(generatedContent.content)
    }
  }, [generatedContent])

  // Auto-resize textarea
  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto'
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px'
    }
  }, [editedContent])

  const handleGenerate = () => {
    generateContent()
  }

  const handleRegenerateSection = (sectionId: string) => {
    regenerateSection(sectionId)
  }

  const startEditing = (section: ContentSection) => {
    setEditingSection(section.id)
    setEditedContent(section.content)
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditedContent('')
  }

  const saveEdit = () => {
    if (editingSection) {
      const updatedContent = localContent.map(section =>
        section.id === editingSection
          ? { ...section, content: editedContent }
          : section
      )
      setLocalContent(updatedContent)
      setEditingSection(null)
      setEditedContent('')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getFormattedContent = () => {
    if (previewMode === 'html') {
      return localContent.map(section => {
        switch (section.type) {
          case 'heading':
            return `<h2>${section.content}</h2>`
          case 'paragraph':
            return `<p>${section.content}</p>`
          case 'list':
            const items = section.content.split('\n').filter(item => item.trim())
            return `<ul>${items.map(item => `<li>${item.replace(/^[•\-\*]\s*/, '')}</li>`).join('')}</ul>`
          case 'cta':
            return `<div class="cta"><strong>${section.content}</strong></div>`
          case 'quote':
            return `<blockquote>${section.content}</blockquote>`
          default:
            return `<div>${section.content}</div>`
        }
      }).join('\n\n')
    } else if (previewMode === 'markdown') {
      return localContent.map(section => {
        switch (section.type) {
          case 'heading':
            return `## ${section.content}`
          case 'paragraph':
            return section.content
          case 'list':
            return section.content.split('\n').filter(item => item.trim())
              .map(item => `- ${item.replace(/^[•\-\*]\s*/, '')}`).join('\n')
          case 'cta':
            return `**${section.content}**`
          case 'quote':
            return `> ${section.content}`
          default:
            return section.content
        }
      }).join('\n\n')
    }
    return null
  }

  if (!selectedTemplate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">No template selected</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generation</h3>
            
            {/* Generate Button */}
            {!generatedContent && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`
                  w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${isGenerating 
                    ? 'bg-purple-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </button>
            )}

            {/* Settings Summary */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Template:</span>
                  <span className="font-medium">{selectedTemplate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Creativity:</span>
                  <span className="font-medium">{settings.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tone:</span>
                  <span className="font-medium capitalize">{settings.tone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Style:</span>
                  <span className="font-medium capitalize">{settings.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Audience:</span>
                  <span className="font-medium capitalize">{settings.audience}</span>
                </div>
              </div>
            </div>

            {/* Regeneration Options */}
            {generatedContent && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Regeneration</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-4 w-4 inline mr-2" />
                    Regenerate All Content
                  </button>
                  <button
                    onClick={() => setShowGenerationOptions(!showGenerationOptions)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-2" />
                    Regenerate Individual Sections
                  </button>
                </div>
              </div>
            )}

            {/* Input Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Your Inputs</h4>
              <div className="space-y-2 text-sm">
                {selectedTemplate.inputFields.map(field => (
                  <div key={field.name}>
                    <span className="text-gray-500">{field.label}:</span>
                    <p className="text-gray-800 truncate">
                      {inputs[field.name] || 'Not provided'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Content Preview</h3>
                
                {generatedContent && (
                  <div className="flex items-center space-x-2">
                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-md">
                      {[
                        { mode: 'formatted' as const, label: 'Formatted', icon: EyeIcon },
                        { mode: 'html' as const, label: 'HTML', icon: CodeBracketIcon },
                        { mode: 'markdown' as const, label: 'Markdown', icon: DocumentTextIcon }
                      ].map(({ mode, label, icon: Icon }) => (
                        <button
                          key={mode}
                          onClick={() => setPreviewMode(mode)}
                          className={`
                            px-3 py-1.5 text-xs font-medium border-r border-gray-300 last:border-r-0
                            ${previewMode === mode
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <Icon className="h-3 w-3 inline mr-1" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => {
                        const content = previewMode === 'formatted' 
                          ? localContent.map(s => s.content).join('\n\n')
                          : getFormattedContent()
                        copyToClipboard(content || '')
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <ClipboardDocumentIcon className="h-3 w-3 inline mr-1" />
                      Copy All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
              {generationError ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-red-600 mb-6">
                    {generationError}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        clearErrors()
                        handleGenerate()
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <ArrowPathIcon className="h-4 w-4 inline mr-2" />
                      Retry Generation
                    </button>
                    <button
                      onClick={() => {
                        clearErrors()
                        setCurrentStep('settings')
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Adjust Settings
                    </button>
                  </div>
                  {lastGenerationMetadata && (
                    <div className="mt-4 text-xs text-gray-500">
                      <p>Attempts: {lastGenerationMetadata.totalAttempts || 1}</p>
                      <p>Last tried: {lastGenerationMetadata.failedAt ? new Date(lastGenerationMetadata.failedAt).toLocaleTimeString() : 'Unknown'}</p>
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="text-center py-12">
                  <SparklesIcon className="h-12 w-12 text-purple-500 mx-auto animate-pulse mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Creating Your Content
                  </h3>
                  <p className="text-gray-600 mb-4">
                    AI is analyzing your inputs and generating high-quality content. This usually takes 15-30 seconds.
                  </p>
                  <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  {lastGenerationMetadata && (
                    <div className="mt-4 text-xs text-gray-500">
                      <p>Using: {lastGenerationMetadata.provider} {lastGenerationMetadata.model}</p>
                      <p>Est. cost: ${lastGenerationMetadata.costEstimate?.toFixed(4) || '0.00'}</p>
                    </div>
                  )}
                </div>
              ) : !generatedContent ? (
                <div className="text-center py-12">
                  <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your content will appear here once generated. You'll be able to edit individual sections and preview different formats.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <SparklesIcon className="h-4 w-4 inline mr-2" />
                    Generate Content
                  </button>
                </div>
              ) : (
                <div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          viewMode === 'edit'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit Mode
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          viewMode === 'preview'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        Website Preview
                      </button>
                    </div>
                    
                    {viewMode === 'edit' && (
                      <button
                        onClick={() => setPreviewMode(previewMode === 'formatted' ? 'raw' : 'formatted')}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {previewMode === 'formatted' ? (
                          <>
                            <CodeBracketIcon className="h-4 w-4" />
                            Show Raw
                          </>
                        ) : (
                          <>
                            <DocumentTextIcon className="h-4 w-4" />
                            Show Formatted
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {viewMode === 'preview' ? (
                    // Enhanced Website Preview Mode - Interactive, responsive, themed
                    <div className="h-[calc(100vh-20rem)]">
                      <EnhancedPreview
                        content={localContent}
                        inputs={inputs}
                        theme={previewTheme}
                        viewport={previewViewport}
                        settings={settings}
                        onThemeChange={setPreviewTheme}
                        onViewportChange={setPreviewViewport}
                        onEdit={(sectionId, newContent) => {
                          setLocalContent(prev => 
                            prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
                          )
                        }}
                      />
                    </div>
                  ) : viewMode === 'edit' && previewMode === 'formatted' ? (
                    <div className="space-y-6">
                      {localContent.map((section) => (
                        <div key={section.id} className="group relative">
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">{section.name}</h4>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {showGenerationOptions && (
                            <button
                              onClick={() => handleRegenerateSection(section.id)}
                              disabled={isGenerating}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              title="Regenerate this section"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditing(section)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit this section"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(section.content)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy this section"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Section Content */}
                      {editingSection === section.id ? (
                        <div className="space-y-3">
                          <textarea
                            ref={editTextareaRef}
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              <XMarkIcon className="h-3 w-3 inline mr-1" />
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                              <CheckIcon className="h-3 w-3 inline mr-1" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="prose prose-sm max-w-none cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                          onClick={() => startEditing(section)}
                        >
                          {section.type === 'heading' ? (
                            <h2 className="text-xl font-bold text-gray-900 mb-0">{section.content}</h2>
                          ) : section.type === 'list' ? (
                            <ul className="list-disc list-inside space-y-1 text-gray-800">
                              {section.content.split('\n').filter(item => item.trim()).map((item, index) => (
                                <li key={index}>{item.replace(/^[•\-\*]\s*/, '')}</li>
                              ))}
                            </ul>
                          ) : section.type === 'cta' ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                              <p className="text-blue-800 font-medium">{section.content}</p>
                            </div>
                          ) : section.type === 'quote' ? (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
                              {section.content}
                            </blockquote>
                          ) : (
                            <p className="text-gray-800 leading-relaxed">{section.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {getFormattedContent()}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {generatedContent && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentStep('settings')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ← Back to Settings
                  </button>

                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-500">
                      {generatedContent.metadata?.wordCount} words • {generatedContent.metadata?.readingTime} min read
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep('export')
                        onComplete?.()
                      }}
                      className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Export Content →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
