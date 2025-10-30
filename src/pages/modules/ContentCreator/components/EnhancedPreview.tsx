import React, { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react'
import { ContentSection, GenerationSettings } from '../../../../types/contentCreator'
import { Theme } from '../../../../utils/previewThemes'
import { Viewport, generateStyledHTML, getViewportDimensions } from '../../../../utils/htmlGenerator'
import ViewportSelector from '../../../../components/ViewportSelector'
import ThemeSelector from '../../../../components/ThemeSelector'

interface EnhancedPreviewProps {
  content: ContentSection[]
  inputs: Record<string, any>
  theme: Theme
  viewport: Viewport
  settings?: GenerationSettings
  onThemeChange: (theme: Theme) => void
  onViewportChange: (viewport: Viewport) => void
  onEdit?: (sectionId: string, newContent: string) => void
}

const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5]

export default function EnhancedPreview({
  content,
  inputs,
  theme,
  viewport,
  settings,
  onThemeChange,
  onViewportChange,
  onEdit
}: EnhancedPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Apply brand colors to theme if provided in settings
  const brandedTheme: Theme = settings ? {
    ...theme,
    primary: settings.brandPrimaryColor || theme.primary,
    secondary: settings.brandSecondaryColor || theme.secondary,
    background: settings.brandBackgroundColor || theme.background,
    text: settings.brandTextColor || theme.text
  } : theme

  // Generate HTML with current theme and viewport
  const htmlContent = generateStyledHTML(content, brandedTheme, viewport, {
    includeResponsive: true,
    includeAnimations: true
  })

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle zoom in/out
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

  // Handle download HTML
  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-preview-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const dimensions = getViewportDimensions(viewport)
  const scaledWidth = dimensions.width * zoom
  const scaledHeight = dimensions.height * zoom

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {/* Left side - Viewport selector */}
        <div className="flex items-center gap-3">
          <ViewportSelector
            selectedViewport={viewport}
            onViewportChange={onViewportChange}
          />
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
            {dimensions.width} × {dimensions.height}px
          </div>
        </div>

        {/* Center - Zoom controls */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom === zoomLevels[0]}
            className="p-2 rounded hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom === zoomLevels[zoomLevels.length - 1]}
            className="p-2 rounded hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Right side - Theme selector and actions */}
        <div className="flex items-center gap-2">
          <ThemeSelector selectedTheme={theme} onThemeChange={onThemeChange} />
          
          <button
            onClick={handleDownload}
            className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Download HTML"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            minWidth: `${scaledWidth}px`,
            minHeight: `${scaledHeight}px`
          }}
        >
          <iframe
            ref={iframeRef}
            title="Content Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Theme: {theme.name}</span>
            <span>•</span>
            <span>Viewport: {viewport}</span>
            <span>•</span>
            <span>{content.length} sections</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Interactive preview with live styling</span>
          </div>
        </div>
      </div>
    </div>
  )
}

