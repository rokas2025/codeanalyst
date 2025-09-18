import React, { useState } from 'react'
import { 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  DocumentIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  BookmarkIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'
import { useContentCreatorStore } from '../../../stores/contentCreatorStore'

interface ExportOptionsProps {
  onComplete?: () => void
}

export function ExportOptions({ onComplete }: ExportOptionsProps) {
  const { generatedContent, selectedTemplate, saveContent } = useContentCreatorStore()
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['html'])
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [exportingFormats, setExportingFormats] = useState<string[]>([])
  const [copiedFormats, setCopiedFormats] = useState<string[]>([])

  const exportFormats = [
    {
      id: 'html',
      name: 'HTML',
      description: 'Clean HTML with inline styles for websites',
      icon: CodeBracketIcon,
      extension: '.html',
      mimeType: 'text/html'
    },
    {
      id: 'text',
      name: 'Plain Text',
      description: 'Simple text format for easy copying',
      icon: DocumentTextIcon,
      extension: '.txt',
      mimeType: 'text/plain'
    },
    {
      id: 'markdown',
      name: 'Markdown',
      description: 'Markdown format for documentation',
      icon: DocumentIcon,
      extension: '.md',
      mimeType: 'text/markdown'
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'WordPress-ready HTML with proper formatting',
      icon: GlobeAltIcon,
      extension: '.html',
      mimeType: 'text/html'
    }
  ]

  const generateContent = (format: string) => {
    if (!generatedContent?.content) return ''

    const sections = generatedContent.content

    switch (format) {
      case 'html':
        return sections.map(section => {
          switch (section.type) {
            case 'heading':
              return `<h2 style="font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em 0; color: #1f2937;">${section.content}</h2>`
            case 'paragraph':
              return `<p style="margin: 1em 0; line-height: 1.6; color: #374151;">${section.content}</p>`
            case 'list':
              const items = section.content.split('\n').filter(item => item.trim())
              return `<ul style="margin: 1em 0; padding-left: 1.5em;">${items.map(item => 
                `<li style="margin: 0.5em 0; color: #374151;">${item.replace(/^[•\-\*]\s*/, '')}</li>`
              ).join('')}</ul>`
            case 'cta':
              return `<div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 1em; margin: 1.5em 0; text-align: center;"><strong style="color: #1e40af;">${section.content}</strong></div>`
            case 'quote':
              return `<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1em; margin: 1.5em 0; font-style: italic; color: #6b7280;">${section.content}</blockquote>`
            default:
              return `<div style="margin: 1em 0; color: #374151;">${section.content}</div>`
          }
        }).join('\n')

      case 'text':
        return sections.map(section => {
          switch (section.type) {
            case 'heading':
              return `${section.content}\n${'='.repeat(section.content.length)}`
            case 'list':
              return section.content.split('\n').filter(item => item.trim())
                .map(item => `• ${item.replace(/^[•\-\*]\s*/, '')}`).join('\n')
            default:
              return section.content
          }
        }).join('\n\n')

      case 'markdown':
        return sections.map(section => {
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

      case 'wordpress':
        return `<!-- wp:group -->\n<div class="wp-block-group">\n\n${sections.map(section => {
          switch (section.type) {
            case 'heading':
              return `<!-- wp:heading -->\n<h2>${section.content}</h2>\n<!-- /wp:heading -->`
            case 'paragraph':
              return `<!-- wp:paragraph -->\n<p>${section.content}</p>\n<!-- /wp:paragraph -->`
            case 'list':
              const items = section.content.split('\n').filter(item => item.trim())
              return `<!-- wp:list -->\n<ul>${items.map(item => 
                `<li>${item.replace(/^[•\-\*]\s*/, '')}</li>`
              ).join('')}</ul>\n<!-- /wp:list -->`
            case 'cta':
              return `<!-- wp:buttons -->\n<div class="wp-block-buttons">\n<!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link">${section.content}</a></div>\n<!-- /wp:button -->\n</div>\n<!-- /wp:buttons -->`
            default:
              return `<!-- wp:paragraph -->\n<p>${section.content}</p>\n<!-- /wp:paragraph -->`
          }
        }).join('\n\n')}\n\n</div>\n<!-- /wp:group -->`

      default:
        return ''
    }
  }

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId)
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    )
  }

  const handleCopyToClipboard = async (format: string) => {
    const content = generateContent(format)
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFormats(prev => [...prev, format])
      setTimeout(() => {
        setCopiedFormats(prev => prev.filter(f => f !== format))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = (format: string) => {
    const content = generateContent(format)
    const formatConfig = exportFormats.find(f => f.id === format)
    
    if (!formatConfig) return

    const blob = new Blob([content], { type: formatConfig.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'content'}${formatConfig.extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportingFormats(prev => [...prev, format])
    setTimeout(() => {
      setExportingFormats(prev => prev.filter(f => f !== format))
    }, 1000)
  }

  const handleDownloadAll = () => {
    selectedFormats.forEach(format => {
      setTimeout(() => handleDownload(format), 100)
    })
  }

  const handleSaveToHistory = async () => {
    try {
      const contentId = await saveContent()
      if (contentId) {
        setSavedToHistory(true)
      }
    } catch (error) {
      console.error('Failed to save content:', error)
    }
  }

  if (!generatedContent) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <ArrowDownTrayIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-yellow-800">No content to export</span>
          </div>
          <p className="text-yellow-700 mt-2">
            Generate content first to access export options.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <ArrowDownTrayIcon className="h-6 w-6" />
          Export & Use Your Content
        </h2>
        <p className="mt-2 text-gray-600">
          Your content is ready! Choose how you want to export and use it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Formats */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Export Formats</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select the formats you need and download or copy your content.
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map((format) => {
                  const Icon = format.icon
                  const isSelected = selectedFormats.includes(format.id)
                  const isCopied = copiedFormats.includes(format.id)
                  const isExporting = exportingFormats.includes(format.id)

                  return (
                    <div
                      key={format.id}
                      className={`
                        border rounded-lg p-4 transition-all cursor-pointer
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleFormatToggle(format.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`
                            p-2 rounded-lg
                            ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                          `}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {format.name}
                            </h4>
                            <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                              {format.description}
                            </p>
                          </div>
                        </div>
                        
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFormatToggle(format.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Action Buttons */}
                      {isSelected && (
                        <div className="mt-4 flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyToClipboard(format.id)
                            }}
                            className={`
                              flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                              ${isCopied 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                              }
                            `}
                          >
                            {isCopied ? (
                              <>
                                <CheckIcon className="h-3 w-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(format.id)
                            }}
                            disabled={isExporting}
                            className={`
                              flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                              ${isExporting
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                              }
                            `}
                          >
                            {isExporting ? (
                              <>
                                <CloudArrowDownIcon className="h-3 w-3 mr-1 animate-pulse" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bulk Actions */}
              {selectedFormats.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download All Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Content Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Template:</span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Word Count:</span>
                  <span className="font-medium">{generatedContent.metadata?.wordCount || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Reading Time:</span>
                  <span className="font-medium">{generatedContent.metadata?.readingTime || 0} min</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Sections:</span>
                  <span className="font-medium">{generatedContent.content?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Save to History */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Save Content</h3>
              
              {savedToHistory ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-800 font-medium">Saved to History</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your content has been saved and can be accessed from your content history.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Save this content to your history for future reference and editing.
                  </p>
                  <button
                    onClick={handleSaveToHistory}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Save to History
                  </button>
                </div>
              )}
            </div>

            {/* Share Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Share & Collaborate</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCopyToClipboard('html')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Copy Share Link
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Share links are coming soon in a future update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => useContentCreatorStore.getState().setCurrentStep('preview')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          ← Back to Preview
        </button>

        <button
          onClick={() => {
            useContentCreatorStore.getState().clearGeneration()
            onComplete?.()
          }}
          className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Create New Content
        </button>
      </div>
    </div>
  )
}
