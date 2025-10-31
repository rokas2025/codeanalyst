import React, { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, X, RefreshCw } from 'lucide-react'
import { EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import ViewportSelector from '../../../../components/ViewportSelector'
import { Viewport, getViewportDimensions } from '../../../../utils/htmlGenerator'
import { ProjectType } from '../../../../utils/projectDetector'

interface FileNode {
  name?: string
  path: string
  type?: 'file' | 'folder'
  content?: string
  children?: FileNode[]
}

interface CodeChange {
  id: string
  file: string
  type: 'create' | 'modify' | 'delete'
  content: string
  approved: boolean
}

interface CodePreviewProps {
  currentFiles: FileNode[]
  proposedChanges: CodeChange[]
  projectType: ProjectType
  onApplyChanges: (changes: CodeChange[]) => void
  onClose: () => void
}

const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5]

export default function CodePreview({
  currentFiles,
  proposedChanges,
  projectType,
  onApplyChanges,
  onClose
}: CodePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [viewMode, setViewMode] = useState<'current' | 'changes' | 'sidebyside'>('sidebyside')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const currentIframeRef = useRef<HTMLIFrameElement>(null)
  const changesIframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate preview HTML for current state
  const currentHTML = generatePreviewHTML(currentFiles, projectType)
  
  // Generate preview HTML with changes applied
  const changesHTML = generatePreviewHTML(
    applyChangesToFiles(currentFiles, proposedChanges),
    projectType
  )

  // Update iframes when HTML changes
  useEffect(() => {
    updateIframe(currentIframeRef, currentHTML)
    updateIframe(changesIframeRef, changesHTML)
    
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentHTML, changesHTML])

  const updateIframe = (iframeRef: React.RefObject<HTMLIFrameElement>, html: string) => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom)
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom)
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1])
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleApply = () => {
    onApplyChanges(proposedChanges)
    onClose()
  }

  const viewportDimensions = getViewportDimensions(viewport)

  // Check if project is previewable
  if (projectType === 'backend') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <CodeBracketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Preview Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              Website preview is not available for backend/API projects.
              You can review the code changes in the "Changes" tab.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('current')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'current'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setViewMode('changes')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-x border-gray-300 ${
                viewMode === 'changes'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              With Changes
            </button>
            <button
              onClick={() => setViewMode('sidebyside')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'sidebyside'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Side by Side
            </button>
          </div>

          {/* Viewport Selector */}
          <ViewportSelector
            viewport={viewport}
            onViewportChange={setViewport}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom === zoomLevels[0]}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom === zoomLevels[zoomLevels.length - 1]}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg"
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg"
            title="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {/* Current State Preview */}
            {(viewMode === 'current' || viewMode === 'sidebyside') && (
              <div className={`${viewMode === 'sidebyside' ? 'flex-1' : 'w-full'} flex flex-col`}>
                <div className="mb-2 px-2">
                  <span className="text-sm font-medium text-gray-700">Current State</span>
                </div>
                <div
                  className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden mx-auto"
                  style={{
                    width: viewportDimensions.width,
                    maxWidth: '100%',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <iframe
                    ref={currentIframeRef}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts"
                    title="Current State Preview"
                  />
                </div>
              </div>
            )}

            {/* With Changes Preview */}
            {(viewMode === 'changes' || viewMode === 'sidebyside') && (
              <div className={`${viewMode === 'sidebyside' ? 'flex-1' : 'w-full'} flex flex-col`}>
                <div className="mb-2 px-2">
                  <span className="text-sm font-medium text-green-700">With AI Changes</span>
                </div>
                <div
                  className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden mx-auto border-2 border-green-500"
                  style={{
                    width: viewportDimensions.width,
                    maxWidth: '100%',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <iframe
                    ref={changesIframeRef}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts"
                    title="With Changes Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          {proposedChanges.length} change{proposedChanges.length !== 1 ? 's' : ''} ready to apply
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <EyeIcon className="h-4 w-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Generates preview HTML from project files
 */
function generatePreviewHTML(files: FileNode[], projectType: ProjectType): string {
  // Find the main HTML file or entry point
  const htmlFile = findMainHTMLFile(files)
  
  if (!htmlFile) {
    return generatePlaceholderHTML('No HTML file found in project')
  }

  // Get all CSS files
  const cssFiles = findFilesByExtension(files, ['.css', '.scss', '.sass'])
  
  // Get all JS files
  const jsFiles = findFilesByExtension(files, ['.js', '.jsx', '.ts', '.tsx'])
  
  // Get all image files
  const flatFiles = flattenFiles(files)
  const imageFiles = flatFiles.filter(f => f.isImage)

  // Build complete HTML with inlined styles and scripts
  let html = htmlFile.content || ''
  
  // Ensure proper HTML structure if missing
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  ${html}
</body>
</html>`
  }
  
  // Inject CSS
  const cssContent = cssFiles.map(f => f.content || '').join('\n')
  if (cssContent) {
    html = html.replace('</head>', `<style>${cssContent}</style></head>`)
  }
  
  // Log HTML before image replacement
  console.log('📄 HTML before image replacement:', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 500),
    imageCount: imageFiles.length
  })
  
  // Inject image files as data URLs
  // Replace image src paths with data URLs
  for (const img of imageFiles) {
    if (img.content && img.isImage) {
      // Get just the filename
      const imgName = img.name
      // Get the full path (normalized)
      const imgPath = img.path.replace(/\\/g, '/')
      
      // Escape special regex characters in filename
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escapedName = escapeRegex(imgName)
      const escapedPath = escapeRegex(imgPath)
      
      console.log(`🖼️ Replacing image: ${imgName}`, {
        path: imgPath,
        hasContent: !!img.content,
        contentLength: img.content?.length,
        contentPreview: img.content?.substring(0, 50)
      })
      
      // Replace various possible image reference formats
      // 1. Exact filename match: src="sample1.jpg" or src="./sample1.jpg"
      html = html.replace(
        new RegExp(`src=["'](\\.?/)?${escapedName}["']`, 'gi'), 
        `src="${img.content}"`
      )
      
      // 2. Full path match: src="images/sample1.jpg"
      html = html.replace(
        new RegExp(`src=["']${escapedPath}["']`, 'gi'), 
        `src="${img.content}"`
      )
      
      // 3. Relative path variations: ./sample1.jpg or ../sample1.jpg
      html = html.replace(
        new RegExp(`src=["']\\.{1,2}/${escapedName}["']`, 'gi'), 
        `src="${img.content}"`
      )
      
      // 4. Path with any prefix: src="anything/sample1.jpg"
      html = html.replace(
        new RegExp(`src=["'][^"']*/${escapedName}["']`, 'gi'), 
        `src="${img.content}"`
      )
    }
  }
  
  console.log(`✅ Processed ${imageFiles.length} images for preview`)
  console.log('📄 HTML after image replacement:', {
    htmlLength: html.length,
    containsDataUrl: html.includes('data:image'),
    dataUrlCount: (html.match(/data:image/g) || []).length
  })

  // For React/JSX files, add a note
  if (projectType === 'web' && jsFiles.some(f => f.path.includes('.jsx') || f.path.includes('.tsx'))) {
    const note = `
      <div style="position: fixed; top: 10px; right: 10px; background: #3B82F6; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 9999;">
        React Preview (Simplified)
      </div>
    `
    html = html.replace('<body>', `<body>${note}`)
  }
  
  // Add a note if images were injected
  if (imageFiles.length > 0) {
    const imageNote = `
      <div style="position: fixed; bottom: 10px; right: 10px; background: #10B981; color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; z-index: 9999;">
        ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} loaded
      </div>
    `
    html = html.replace('</body>', `${imageNote}</body>`)
  }

  return html
}

/**
 * Applies code changes to files
 */
function applyChangesToFiles(files: FileNode[], changes: CodeChange[]): FileNode[] {
  const fileMap = new Map<string, FileNode>()
  
  // Flatten files into a map
  function flattenFiles(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        fileMap.set(node.path, node)
      }
      if (node.children) {
        flattenFiles(node.children)
      }
    }
  }
  
  flattenFiles(files)
  
  // Apply changes
  for (const change of changes) {
    if (change.type === 'create' || change.type === 'modify') {
      const existingFile = fileMap.get(change.file)
      if (existingFile) {
        existingFile.content = change.content
      } else {
        fileMap.set(change.file, {
          path: change.file,
          type: 'file',
          content: change.content
        })
      }
    } else if (change.type === 'delete') {
      fileMap.delete(change.file)
    }
  }
  
  // Convert map back to array
  return Array.from(fileMap.values())
}

/**
 * Finds the main HTML file
 */
function findMainHTMLFile(files: FileNode[]): FileNode | null {
  const flatFiles = flattenFiles(files)
  
  // Look for index.html first
  const indexFile = flatFiles.find(f => f.path.toLowerCase().endsWith('index.html'))
  if (indexFile) return indexFile
  
  // Look for any HTML file
  const htmlFile = flatFiles.find(f => f.path.toLowerCase().endsWith('.html'))
  if (htmlFile) return htmlFile
  
  return null
}

/**
 * Finds files by extension
 */
function findFilesByExtension(files: FileNode[], extensions: string[]): FileNode[] {
  const flatFiles = flattenFiles(files)
  return flatFiles.filter(f => 
    extensions.some(ext => f.path.toLowerCase().endsWith(ext))
  )
}

/**
 * Flattens file tree
 */
function flattenFiles(files: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node)
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }
  
  traverse(files)
  return result
}

/**
 * Generates placeholder HTML
 */
function generatePlaceholderHTML(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          color: white;
          padding: 2rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Preview Ready</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}

