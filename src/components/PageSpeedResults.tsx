import React from 'react'
import { 
  SparklesIcon, 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface PageSpeedResultsProps {
  data: {
    success: boolean
    strategy: string
    scores: {
      performance: number
      accessibility: number
      bestPractices: number
      seo: number
    }
    coreWebVitals: {
      lcp: { value: string; passing: boolean }
      fid: { value: string; passing: boolean }
      cls: { value: string; passing: boolean }
      fcp: { value: string }
      tti: { value: string }
      tbt: { value: string }
      speedIndex: { value: string }
    }
  }
}

export function PageSpeedResults({ data }: PageSpeedResultsProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Failed to load PageSpeed results</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Google PageSpeed Insights
          </h3>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          {data.strategy === 'mobile' ? (
            <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ComputerDesktopIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          )}
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
            {data.strategy}
          </span>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(data.scores).map(([key, score]) => (
          <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {key === 'bestPractices' ? 'Best Practices' : key}
              </span>
              <span className={`text-xs font-bold ${getScoreColor(score)}`}>
                {getScoreGrade(score)}
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${score}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    score >= 90 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Core Web Vitals */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Core Web Vitals
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LCP */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LCP</span>
              {data.coreWebVitals.lcp.passing ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.coreWebVitals.lcp.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Largest Contentful Paint
            </div>
          </div>

          {/* FID */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FID</span>
              {data.coreWebVitals.fid.passing ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.coreWebVitals.fid.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              First Input Delay
            </div>
          </div>

          {/* CLS */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CLS</span>
              {data.coreWebVitals.cls.passing ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.coreWebVitals.cls.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cumulative Layout Shift
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">FCP</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.coreWebVitals.fcp.value}
            </div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">TTI</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.coreWebVitals.tti.value}
            </div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">TBT</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.coreWebVitals.tbt.value}
            </div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Speed Index</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.coreWebVitals.speedIndex.value}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> These are lab-based metrics from Google's PageSpeed Insights API. 
          Real user experience may vary based on network conditions and device capabilities.
        </p>
      </div>
    </div>
  )
}

export default PageSpeedResults

