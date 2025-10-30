import React from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { Viewport } from '../utils/htmlGenerator'

interface ViewportSelectorProps {
  selectedViewport: Viewport
  onViewportChange: (viewport: Viewport) => void
}

const viewportOptions = [
  { id: 'desktop' as Viewport, label: 'Desktop', icon: Monitor, width: '1440px' },
  { id: 'tablet' as Viewport, label: 'Tablet', icon: Tablet, width: '768px' },
  { id: 'mobile' as Viewport, label: 'Mobile', icon: Smartphone, width: '375px' }
]

export default function ViewportSelector({ selectedViewport, onViewportChange }: ViewportSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {viewportOptions.map(({ id, label, icon: Icon, width }) => (
        <button
          key={id}
          onClick={() => onViewportChange(id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-200
            ${
              selectedViewport === id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          title={`${label} (${width})`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

