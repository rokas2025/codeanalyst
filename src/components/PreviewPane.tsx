import React, { useState, useEffect, useRef } from 'react'
import { 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon, 
  DeviceTabletIcon,
  ArrowPathIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { wordpressService } from '../services/wordpressService'
import toast from 'react-hot-toast'

interface PreviewPaneProps {
  connectionId: string
  target: string | number
  builder?: 'auto' | 'gutenberg' | 'elementor' | 'divi' | 'wpbakery'
  onClose?: () => void
}

type PreviewMode = 'live' | 'snapshot'
type DeviceType = 'desktop' | 'tablet' | 'mobile'

export function PreviewPane({ connectionId, target, builder = 'auto', onClose }: PreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('live')
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [zoom, setZoom] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [ttl, setTtl] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch preview URL on mount or when target changes
  useEffect(() => {
    fetchPreviewUrl()
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [connectionId, target, builder])

  // Countdown timer
  useEffect(() => {
    if (ttl > 0 && !isExpired) {
      setTimeRemaining(ttl)
      setIsExpired(false)

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }

      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsExpired(true)
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [ttl, isExpired])

  const fetchPreviewUrl = async () => {
    setLoading(true)
    setError(null)
    setIsExpired(false)

    try {
      if (mode === 'live') {
        const response = await wordpressService.mintPreview(connectionId, target, builder)
        
        if (response.success && response.preview_url) {
          setPreviewUrl(response.preview_url)
          setTtl(response.ttl || 300)
          setTimeRemaining(response.ttl || 300)
        } else {
          setError(response.error || 'Failed to mint preview URL')
          toast.error(response.error || 'Failed to load preview')
        }
      } else {
        // Snapshot mode (stub)
        const response = await wordpressService.mintSnapshot(connectionId, target)
        
        if (response.success) {
          setSnapshotUrl(response.snapshotUrl || null)
        } else {
          setError(response.error || 'Snapshot not available')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchPreviewUrl()
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDeviceWidth = (): string => {
    switch (device) {
      case 'tablet':
        return '768px'
      case 'mobile':
        return '390px'
      default:
        return '100%'
    }
  }

  const getStatusText = (): string => {
    if (isExpired) {
      return 'Expired'
    }
    if (mode === 'live') {
      return `Live • expires in ${formatTime(timeRemaining)}`
    }
    return 'Snapshot'
  }

  const getStatusColor = (): string => {
    if (isExpired) {
      return 'bg-red-100 text-red-700'
    }
    if (mode === 'live') {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-blue-100 text-blue-700'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('live')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                mode === 'live'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setMode('snapshot')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                mode === 'snapshot'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Snapshot
            </button>
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-1 border border-gray-300 rounded">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 ${
                device === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Desktop"
            >
              <ComputerDesktopIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-2 ${
                device === 'tablet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Tablet"
            >
              <DeviceTabletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 ${
                device === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Mobile"
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-300 rounded">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="px-2 text-sm text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              className="p-2 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Reload Button */}
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            title="Reload"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Pill */}
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Stage */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading preview...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-600 mb-4">{error}</p>
            {isExpired && (
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Preview
              </button>
            )}
          </div>
        )}

        {!loading && !error && mode === 'live' && previewUrl && (
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              width: device === 'desktop' ? '100%' : getDeviceWidth(),
              maxWidth: device === 'desktop' ? '1400px' : 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full border-0"
              style={{
                height: device === 'mobile' ? '667px' : device === 'tablet' ? '1024px' : '800px',
                minHeight: '600px'
              }}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
              title="WordPress Preview"
            />
          </div>
        )}

        {!loading && !error && mode === 'snapshot' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {snapshotUrl ? (
              <img src={snapshotUrl} alt="Snapshot" className="max-w-full max-h-full" />
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Snapshot Coming Soon</p>
                <p className="text-sm">Snapshot mode is not yet available. Use Live mode for now.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

