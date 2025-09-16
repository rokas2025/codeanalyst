import React, { useState } from 'react'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  BoltIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon,
  CursorArrowRaysIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface WebsiteAnalysisReportProps {
  results: any
}

// Helper functions for better data parsing
const parseScore = (score: any): number => {
  if (typeof score === 'number') return Math.round(score)
  if (typeof score === 'string') return Math.round(parseFloat(score)) || 0
  return 0
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600 bg-green-100'
  if (score >= 70) return 'text-yellow-600 bg-yellow-100'
  if (score >= 50) return 'text-orange-600 bg-orange-100'
  return 'text-red-600 bg-red-100'
}

const getScoreIcon = (score: number) => {
  if (score >= 90) return <CheckCircleIcon className="w-5 h-5 text-green-600" />
  if (score >= 70) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
  return <XCircleIcon className="w-5 h-5 text-red-600" />
}

const formatTime = (ms: any): string => {
  const time = parseFloat(ms) || 0
  if (time < 1000) return `${Math.round(time)}ms`
  return `${(time / 1000).toFixed(2)}s`
}

const formatBytes = (bytes: any): string => {
  const size = parseFloat(bytes) || 0
  if (size < 1024) return `${Math.round(size)} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// Convert performance metrics to user-friendly ratings (using Google's Core Web Vitals thresholds)
const getPerformanceRating = (metricType: string, value: number): { rating: string; color: string } => {
  switch(metricType) {
    case 'fcp': // First Contentful Paint
      if (value < 1800) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 3000) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    case 'lcp': // Largest Contentful Paint
      if (value < 2500) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 4000) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    case 'cls': // Cumulative Layout Shift
      if (value < 0.1) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 0.25) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    case 'tbt': // Total Blocking Time
      if (value < 200) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 600) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    case 'si': // Speed Index
      if (value < 3400) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 5800) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    case 'tti': // Time to Interactive
      if (value < 3800) return { rating: 'Good', color: 'text-green-600 bg-green-50' }
      if (value < 7300) return { rating: 'Needs Work', color: 'text-yellow-600 bg-yellow-50' }
      return { rating: 'Poor', color: 'text-red-600 bg-red-50' }
    
    default:
      return { rating: 'Unknown', color: 'text-gray-600 bg-gray-50' }
  }
}

export const WebsiteAnalysisReport: React.FC<WebsiteAnalysisReportProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllAccessibilityIssues, setShowAllAccessibilityIssues] = useState(false)

  // Parse performance data
  const performance = results.performance || {}
  const lighthouse = results.lighthouse || {}
  const seo = results.seo || {}
  const accessibility = results.accessibility || {}
  const security = results.security || {}
  const technologies = Array.isArray(results.technologies) ? results.technologies : []
  const scores = results.scores || {}

  // Extract scores with proper fallbacks
  const performanceScore = parseScore(
    scores.performance || 
    lighthouse.performance || 
    performance.score || 0
  )
  const seoScore = parseScore(
    seo.comprehensive?.overallScore || 
    seo.score || 
    scores.seo || 
    lighthouse.seo || 0
  )
  const lighthouseSeoScore = parseScore(
    seo.lighthouseScore || 
    lighthouse.seo || 0
  )
  const accessibilityScore = parseScore(
    scores.accessibility || 
    lighthouse.accessibility || 
    accessibility.score || 0
  )
  const securityScore = parseScore(
    scores.security || 
    security.score || 0
  )
  const bestPracticesScore = parseScore(
    scores.bestPractices || 
    lighthouse.bestPractices || 0
  )

  const overallScore = parseScore(
    scores.overall || 
    Math.round((performanceScore + seoScore + accessibilityScore + securityScore + bestPracticesScore) / 5)
  )

  // Extract key metrics - prioritize Lighthouse data as it's most accurate
  let metrics: any = {}
  if (lighthouse.metrics && Object.keys(lighthouse.metrics).length > 0) {
    metrics = lighthouse.metrics
  } else if (performance.metrics && Object.keys(performance.metrics).length > 0) {
    metrics = performance.metrics
  } else if (results.metrics && Object.keys(results.metrics).length > 0) {
    metrics = results.metrics
  }
  
  // Extract opportunities with explicit fallback chain
  let opportunities = []
  if (performance.opportunities && Array.isArray(performance.opportunities)) {
    opportunities = performance.opportunities
  } else if (lighthouse.opportunities && Array.isArray(lighthouse.opportunities)) {
    opportunities = lighthouse.opportunities
  } else if (results.opportunities && Array.isArray(results.opportunities)) {
    opportunities = results.opportunities
  }
  
  // Metrics successfully extracted from Lighthouse data

  return (
    <div className="space-y-6">
      {/* Executive Summary Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8 rounded-xl shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Website Analysis Report</h1>
            <p className="text-slate-300 text-lg mb-4">{results.url}</p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="w-5 h-5" />
                <span className="text-sm">Analyzed: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="w-5 h-5" />
                <span className="text-sm">{technologies.length} Technologies Detected</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {getScoreIcon(overallScore)}
              <span className="ml-2">{overallScore}/100</span>
            </div>
            <p className="text-slate-300 text-sm mt-2">Overall Health Score</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Performance</p>
              <p className="text-3xl font-bold text-gray-900">{performanceScore}</p>
            </div>
            <BoltIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className={`w-full bg-gray-200 rounded-full h-2`}>
              <div 
                className={`h-2 rounded-full ${performanceScore >= 90 ? 'bg-green-500' : performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${performanceScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">SEO</p>
              <p className="text-3xl font-bold text-gray-900">{seoScore}</p>
            </div>
            <MagnifyingGlassIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4">
            <div className={`w-full bg-gray-200 rounded-full h-2`}>
              <div 
                className={`h-2 rounded-full ${seoScore >= 90 ? 'bg-green-500' : seoScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${seoScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Accessibility</p>
              <p className="text-3xl font-bold text-gray-900">{accessibilityScore}</p>
            </div>
            <EyeIcon className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className={`w-full bg-gray-200 rounded-full h-2`}>
              <div 
                className={`h-2 rounded-full ${accessibilityScore >= 90 ? 'bg-green-500' : accessibilityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${accessibilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Security</p>
              <p className="text-3xl font-bold text-gray-900">{securityScore}</p>
            </div>
            <ShieldCheckIcon className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-4">
            <div className={`w-full bg-gray-200 rounded-full h-2`}>
              <div 
                className={`h-2 rounded-full ${securityScore >= 90 ? 'bg-green-500' : securityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${securityScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'performance', name: 'Performance', icon: BoltIcon },
              { id: 'seo', name: 'SEO', icon: MagnifyingGlassIcon },
              { id: 'accessibility', name: 'Accessibility', icon: EyeIcon },
              { id: 'security', name: 'Security', icon: ShieldCheckIcon },
              { id: 'recommendations', name: 'Action Plan', icon: DocumentTextIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2" />
                  Executive Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Website Health</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Your website has an overall health score of <strong>{overallScore}/100</strong>. 
                      {overallScore >= 80 && " Your site is performing well across most areas."}
                      {overallScore >= 60 && overallScore < 80 && " There are several areas that need attention to improve user experience."}
                      {overallScore < 60 && " Critical issues were identified that require immediate attention."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority Actions</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {performanceScore < 70 && <li>• Optimize loading speed and performance</li>}
                      {accessibilityScore < 70 && <li>• Improve accessibility for all users</li>}
                      {seoScore < 70 && <li>• Enhance SEO optimization</li>}
                      {securityScore < 70 && <li>• Address security vulnerabilities</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Website Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Website Details</h4>
                  <div className="space-y-2 text-sm">
                    {results.basic?.title && (
                      <div>
                        <span className="text-gray-600">Title:</span>
                        <p className="text-gray-900 font-medium">{results.basic.title}</p>
                      </div>
                    )}
                    {results.basic?.description && (
                      <div>
                        <span className="text-gray-600">Description:</span>
                        <p className="text-gray-900 line-clamp-2">{results.basic.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Analyzed:</span>
                      <p className="text-gray-900">
                        {results.analyzedAt ? new Date(results.analyzedAt).toLocaleString() : 
                         results.analysisDate ? new Date(results.analysisDate).toLocaleString() : 
                         'Recently'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Analysis Time:</span>
                      <p className="text-gray-900">
                        {results.duration ? formatTime(results.duration) : 
                         results.analysisTime ? formatTime(results.analysisTime) : 
                         'Quick scan'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Structure */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Content Structure</h4>
                  <div className="space-y-2 text-sm">
                    {results.basic?.imageCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Images:</span>
                        <span className="text-gray-900 font-medium">{results.basic.imageCount}</span>
                      </div>
                    )}
                    {results.basic?.linkCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Links:</span>
                        <span className="text-gray-900 font-medium">{results.basic.linkCount}</span>
                      </div>
                    )}
                    {results.basic?.wordCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Words:</span>
                        <span className="text-gray-900 font-medium">{results.basic.wordCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Metrics - User Friendly */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Performance Assessment</h4>
                  <div className="space-y-3 text-sm">
                    {metrics.firstContentfulPaint && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">First Paint:</span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">{formatTime(metrics.firstContentfulPaint)}</div>
                          <div className={`px-2 py-1 rounded text-xs ${getPerformanceRating('fcp', metrics.firstContentfulPaint).color}`}>
                            {getPerformanceRating('fcp', metrics.firstContentfulPaint).rating}
                          </div>
                        </div>
                      </div>
                    )}
                    {metrics.largestContentfulPaint && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Largest Paint:</span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">{formatTime(metrics.largestContentfulPaint)}</div>
                          <div className={`px-2 py-1 rounded text-xs ${getPerformanceRating('lcp', metrics.largestContentfulPaint).color}`}>
                            {getPerformanceRating('lcp', metrics.largestContentfulPaint).rating}
                          </div>
                        </div>
                      </div>
                    )}
                    {metrics.cumulativeLayoutShift !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Layout Shift:</span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">{(metrics.cumulativeLayoutShift || 0).toFixed(3)}</div>
                          <div className={`px-2 py-1 rounded text-xs ${getPerformanceRating('cls', metrics.cumulativeLayoutShift).color}`}>
                            {getPerformanceRating('cls', metrics.cumulativeLayoutShift).rating}
                          </div>
                        </div>
                      </div>
                    )}
                    {metrics.serverResponseTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Server Time:</span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">{formatTime(metrics.serverResponseTime)}</div>
                          <div className={`px-2 py-1 rounded text-xs ${getPerformanceRating('fcp', metrics.serverResponseTime).color}`}>
                            {getPerformanceRating('fcp', metrics.serverResponseTime).rating}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              {technologies.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CpuChipIcon className="w-5 h-5 mr-2" />
                    Technology Stack ({technologies.length} detected)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {technologies.map((tech: string, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-center border hover:shadow-md transition-shadow">
                        <div className="text-xs font-medium text-gray-900">{tech}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Performance Analysis</h3>

              {/* Page Load Performance */}
              {(metrics.timeToInteractive || metrics.largestContentfulPaint) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Page Load Performance</h4>
                      <p className="text-sm text-gray-600">Complete loading timeline with Core Web Vitals</p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  
                  {/* Core Web Vitals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {metrics.firstContentfulPaint && (
                      <div className="bg-white/60 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {formatTime(metrics.firstContentfulPaint)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">First Contentful Paint</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${getPerformanceRating('fcp', metrics.firstContentfulPaint).color}`}>
                          {getPerformanceRating('fcp', metrics.firstContentfulPaint).rating}
                        </div>
                      </div>
                    )}
                    
                    {metrics.largestContentfulPaint && (
                      <div className="bg-white/60 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {formatTime(metrics.largestContentfulPaint)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">Largest Contentful Paint</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${getPerformanceRating('lcp', metrics.largestContentfulPaint).color}`}>
                          {getPerformanceRating('lcp', metrics.largestContentfulPaint).rating}
                        </div>
                      </div>
                    )}
                    
                    {metrics.cumulativeLayoutShift !== undefined && (
                      <div className="bg-white/60 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {(metrics.cumulativeLayoutShift || 0).toFixed(3)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">Cumulative Layout Shift</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${getPerformanceRating('cls', metrics.cumulativeLayoutShift).color}`}>
                          {getPerformanceRating('cls', metrics.cumulativeLayoutShift).rating}
                        </div>
                      </div>
                    )}
                    
                    {metrics.timeToInteractive && (
                      <div className="bg-white/60 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {formatTime(metrics.timeToInteractive)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">Time to Interactive</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${getPerformanceRating('tti', metrics.timeToInteractive).color}`}>
                          {getPerformanceRating('tti', metrics.timeToInteractive).rating}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Load Timeline Bar */}
                  {metrics.timeToInteractive && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Loading Timeline</span>
                        <span>Total: {formatTime(metrics.timeToInteractive)}</span>
                      </div>
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        {metrics.firstContentfulPaint && (
                          <div 
                            className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((metrics.firstContentfulPaint / metrics.timeToInteractive) * 100, 100)}%` 
                            }}
                          />
                        )}
                        {metrics.largestContentfulPaint && (
                          <div 
                            className="absolute h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((metrics.largestContentfulPaint / metrics.timeToInteractive) * 100, 100)}%` 
                            }}
                          />
                        )}
                        <div className="absolute h-full bg-green-500 rounded-full w-full transition-all duration-500" />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0ms</span>
                        <span>First Paint</span>
                        <span>Main Content</span>
                        <span>Interactive</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Performance Opportunities */}
              {opportunities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Optimization Opportunities</h4>
                  <div className="space-y-3">
                    {opportunities.map((opp: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-gray-900">{opp.title}</h5>
                          <p className="text-sm text-gray-700 mt-1">{opp.description}</p>
                          {opp.savings > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              Potential savings: {formatTime(opp.savings)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Comprehensive SEO Analysis</h3>
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(seoScore)}`}>
                    SEO Score: {seoScore}/100
                  </div>
                  {lighthouseSeoScore && lighthouseSeoScore !== seoScore && (
                    <div className="text-xs text-gray-500">
                      (Lighthouse: {lighthouseSeoScore}/100)
                    </div>
                  )}
                </div>
              </div>



              {/* Critical Issues Alert */}
              {seo.criticalIssues && seo.criticalIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Critical SEO Issues</h4>
                  </div>
                  <ul className="space-y-1">
                    {seo.criticalIssues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm text-red-700">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Content Analysis */}
              {seo.contentDepth && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2" />
                    Content Quality Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{seo.contentDepth.wordCount || 0}</div>
                      <div className="text-sm text-gray-600">Words</div>
                      <div className={`text-xs mt-1 ${seo.contentDepth.adequateDepth ? 'text-green-600' : 'text-red-600'}`}>
                        {seo.contentDepth.adequateDepth ? 'Adequate' : 'Too Thin'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{seo.contentDepth.depthScore || 0}</div>
                      <div className="text-sm text-gray-600">Content Score</div>
                      <div className={`text-xs mt-1 ${(seo.contentDepth.depthScore || 0) >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {(seo.contentDepth.depthScore || 0) >= 70 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{seo.contentDepth.paragraphCount || 0}</div>
                      <div className="text-sm text-gray-600">Paragraphs</div>
                      <div className={`text-xs mt-1 ${(seo.contentDepth.paragraphCount || 0) >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                        {(seo.contentDepth.paragraphCount || 0) >= 3 ? 'Well Structured' : 'Poor Structure'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical SEO */}
              {seo.technicalSEO && (
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Cog6ToothIcon className="w-5 h-5 text-gray-600 mr-2" />
                    Technical SEO Health
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title Analysis */}
                    {seo.technicalSEO.factors?.titleOptimization && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Title Tag</span>
                          {seo.technicalSEO.factors.titleOptimization.optimal ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {seo.title && (
                          <div>
                            <p className="text-sm text-gray-900 mb-1">{seo.title}</p>
                            <p className="text-xs text-gray-500">
                              {(seo.title || '').length} characters
                              {(seo.title || '').length > 60 && ' (too long)'}
                              {(seo.title || '').length < 30 && ' (too short)'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta Description Analysis */}
                    {seo.technicalSEO.factors?.metaDescription && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Meta Description</span>
                          {seo.technicalSEO.factors.metaDescription.optimal ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {seo.description && (
                          <div>
                            <p className="text-sm text-gray-900 mb-1">{seo.description}</p>
                            <p className="text-xs text-gray-500">
                              {(seo.description || '').length} characters
                              {(seo.description || '').length > 160 && ' (too long)'}
                              {(seo.description || '').length < 120 && ' (could be longer)'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Heading Structure */}
                    {seo.technicalSEO.factors?.headingStructure && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Heading Structure</span>
                          {seo.technicalSEO.factors.headingStructure.hasH1 ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {seo.technicalSEO.factors.headingStructure.hasH1 ? 
                            `H1: ${seo.technicalSEO.factors.headingStructure.h1Count}` : 
                            'No H1 tag found'
                          }
                          {seo.technicalSEO.factors.headingStructure.hasHierarchy && ' • Good hierarchy'}
                        </div>
                      </div>
                    )}

                    {/* Structured Data */}
                    {seo.technicalSEO.factors?.structuredData && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Structured Data</span>
                          {seo.technicalSEO.factors.structuredData.present ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {seo.technicalSEO.factors.structuredData.present ? 
                            'Schema markup detected' : 
                            'No structured data found'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SEO Recommendations */}
              {seo.recommendations && seo.recommendations.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <LightBulbIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    SEO Recommendations
                  </h4>
                  <div className="space-y-4">
                    {seo.recommendations.slice(0, 6).map((rec: any, index: number) => (
                      <div key={index} className={`border-l-4 pl-4 py-2 ${
                        rec.priority === 'high' ? 'border-red-400 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.priority?.toUpperCase()} PRIORITY
                          </span>
                          <span className="text-xs text-gray-500">{rec.category}</span>
                        </div>
                        <h5 className="font-medium text-gray-900 text-sm">{rec.issue}</h5>
                        <p className="text-sm text-gray-700 mt-1">{rec.action}</p>
                        <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              {seo.comprehensive && (
                <div className="space-y-6">
                  {/* On-Page SEO Analysis */}
                  {seo.comprehensive.onPage && (
                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CursorArrowRaysIcon className="w-5 h-5 text-purple-600 mr-2" />
                          On-Page SEO Analysis
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${seo.comprehensive.onPage.score >= 70 ? 'bg-green-100 text-green-800' : seo.comprehensive.onPage.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {seo.comprehensive.onPage.score}/100
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Image SEO:</span>
                            <span className={`font-medium ${seo.comprehensive.onPage.factors?.imageSEO?.score >= 70 ? 'text-green-600' : seo.comprehensive.onPage.factors?.imageSEO?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.onPage.factors?.imageSEO?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Social Signals:</span>
                            <span className={`font-medium ${seo.comprehensive.onPage.factors?.socialSignals?.score >= 70 ? 'text-green-600' : seo.comprehensive.onPage.factors?.socialSignals?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.onPage.factors?.socialSignals?.score || 0}/100
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Link Profile:</span>
                            <span className={`font-medium ${seo.comprehensive.onPage.factors?.linkProfile?.score >= 70 ? 'text-green-600' : seo.comprehensive.onPage.factors?.linkProfile?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.onPage.factors?.linkProfile?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Keyword Optimization:</span>
                            <span className={`font-medium ${seo.comprehensive.onPage.factors?.keywordOptimization?.score >= 70 ? 'text-green-600' : seo.comprehensive.onPage.factors?.keywordOptimization?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.onPage.factors?.keywordOptimization?.score || 0}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content & Technical Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Content Analysis */}
                    {seo.comprehensive.content?.analysis && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 text-green-600 mr-2" />
                            Content Analysis
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${seo.comprehensive.content.score >= 70 ? 'bg-green-100 text-green-800' : seo.comprehensive.content.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {seo.comprehensive.content.score}/100
                          </span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Freshness:</span>
                            <span className={`font-medium ${seo.comprehensive.content.analysis.freshness?.score >= 70 ? 'text-green-600' : seo.comprehensive.content.analysis.freshness?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.content.analysis.freshness?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Relevance:</span>
                            <span className={`font-medium ${seo.comprehensive.content.analysis.relevance?.score >= 70 ? 'text-green-600' : seo.comprehensive.content.analysis.relevance?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.content.analysis.relevance?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Structure:</span>
                            <span className={`font-medium ${seo.comprehensive.content.analysis.structure?.score >= 70 ? 'text-green-600' : seo.comprehensive.content.analysis.structure?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.content.analysis.structure?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Uniqueness:</span>
                            <span className={`font-medium ${seo.comprehensive.content.analysis.uniqueness?.score >= 70 ? 'text-green-600' : seo.comprehensive.content.analysis.uniqueness?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.content.analysis.uniqueness?.score || 0}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical SEO */}
                    {seo.comprehensive.technical?.factors && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <Cog6ToothIcon className="w-5 h-5 text-blue-600 mr-2" />
                            Technical SEO
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${seo.comprehensive.technical.score >= 70 ? 'bg-green-100 text-green-800' : seo.comprehensive.technical.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {seo.comprehensive.technical.score}/100
                          </span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Meta Tags:</span>
                            <span className={`font-medium ${seo.comprehensive.technical.factors.metaTags?.score >= 70 ? 'text-green-600' : seo.comprehensive.technical.factors.metaTags?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.technical.factors.metaTags?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">URL Structure:</span>
                            <span className={`font-medium ${seo.comprehensive.technical.factors.urlStructure?.score >= 70 ? 'text-green-600' : seo.comprehensive.technical.factors.urlStructure?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.technical.factors.urlStructure?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Structured Data:</span>
                            <span className={`font-medium ${seo.comprehensive.technical.factors.structuredData?.score >= 70 ? 'text-green-600' : seo.comprehensive.technical.factors.structuredData?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.technical.factors.structuredData?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Internal Linking:</span>
                            <span className={`font-medium ${seo.comprehensive.technical.factors.internalLinking?.score >= 70 ? 'text-green-600' : seo.comprehensive.technical.factors.internalLinking?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.technical.factors.internalLinking?.score || 0}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Experience & Competitive */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Experience */}
                    {seo.comprehensive.userExperience?.signals && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <UserIcon className="w-5 h-5 text-orange-600 mr-2" />
                            User Experience
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${seo.comprehensive.userExperience.score >= 70 ? 'bg-green-100 text-green-800' : seo.comprehensive.userExperience.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {seo.comprehensive.userExperience.score}/100
                          </span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Navigation:</span>
                            <span className={`font-medium ${seo.comprehensive.userExperience.signals.navigation?.score >= 70 ? 'text-green-600' : seo.comprehensive.userExperience.signals.navigation?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.userExperience.signals.navigation?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Readability:</span>
                            <span className={`font-medium ${seo.comprehensive.userExperience.signals.readability?.score >= 70 ? 'text-green-600' : seo.comprehensive.userExperience.signals.readability?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.userExperience.signals.readability?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Organization:</span>
                            <span className={`font-medium ${seo.comprehensive.userExperience.signals.organization?.score >= 70 ? 'text-green-600' : seo.comprehensive.userExperience.signals.organization?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.userExperience.signals.organization?.score || 0}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mobile Optimization:</span>
                            <span className={`font-medium ${seo.comprehensive.userExperience.signals.mobileOptimization?.score >= 70 ? 'text-green-600' : seo.comprehensive.userExperience.signals.mobileOptimization?.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {seo.comprehensive.userExperience.signals.mobileOptimization?.score || 0}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Competitive Analysis */}
                    {seo.comprehensive.competitive && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <ChartBarIcon className="w-5 h-5 text-indigo-600 mr-2" />
                          Competitive Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Brand Signals:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${seo.comprehensive.competitive.brandSignals === 'strong' ? 'bg-green-100 text-green-800' : seo.comprehensive.competitive.brandSignals === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {seo.comprehensive.competitive.brandSignals}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trust Signals:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${seo.comprehensive.competitive.trustSignals === 'strong' ? 'bg-green-100 text-green-800' : seo.comprehensive.competitive.trustSignals === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {seo.comprehensive.competitive.trustSignals}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Content vs Industry:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${seo.comprehensive.competitive.contentDepthVsIndustry === 'deep' ? 'bg-green-100 text-green-800' : seo.comprehensive.competitive.contentDepthVsIndustry === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {seo.comprehensive.competitive.contentDepthVsIndustry}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Technical Implementation:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${seo.comprehensive.competitive.technicalImplementation === 'excellent' ? 'bg-green-100 text-green-800' : seo.comprehensive.competitive.technicalImplementation === 'good' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {seo.comprehensive.competitive.technicalImplementation}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              {seo.comprehensive && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Comprehensive SEO Score Breakdown</h4>
                  
                  {/* Score Components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{seo.comprehensive.technical?.score || 0}</div>
                      <div className="text-sm text-gray-600">Technical SEO</div>
                      <div className="text-xs text-gray-500 mt-1">25% weight</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{seo.comprehensive.content?.score || 0}</div>
                      <div className="text-sm text-gray-600">Content Quality</div>
                      <div className="text-xs text-gray-500 mt-1">35% weight</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{seo.comprehensive.onPage?.score || 0}</div>
                      <div className="text-sm text-gray-600">On-Page SEO</div>
                      <div className="text-xs text-gray-500 mt-1">25% weight</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{seo.comprehensive.userExperience?.score || 0}</div>
                      <div className="text-sm text-gray-600">User Experience</div>
                      <div className="text-xs text-gray-500 mt-1">15% weight</div>
                    </div>
                  </div>

                  {/* Calculation Formula */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Score Calculation</h5>
                    <div className="text-sm text-gray-700">
                      <div className="font-mono bg-gray-100 p-2 rounded text-xs">
                        ({seo.comprehensive.technical?.score || 0} × 0.25) + ({seo.comprehensive.content?.score || 0} × 0.35) + ({seo.comprehensive.onPage?.score || 0} × 0.25) + ({seo.comprehensive.userExperience?.score || 0} × 0.15) = <span className="font-bold">{seoScore}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-4">
                      <span className="font-medium text-gray-600">Basic Analysis:</span>
                      <span className="ml-2 text-lg font-bold">{lighthouseSeoScore}/100</span>
                      <p className="text-xs text-gray-500 mt-1">Tests only 10-15 basic technical factors like title tags, meta descriptions, heading structure</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <span className="font-medium text-gray-600">In-depth Analysis:</span>
                      <span className="ml-2 text-lg font-bold">{seoScore}/100</span>
                      <p className="text-xs text-gray-500 mt-1">Analyzes content depth, technical factors, user experience, and competitive positioning</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Accessibility Analysis</h3>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(accessibilityScore)}`}>
                  Lighthouse Score: {accessibilityScore}/100
                </div>
              </div>

              {/* Score Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Understanding Accessibility Scores</h4>
                <p className="text-sm text-blue-800">
                  <strong>Lighthouse Score ({accessibilityScore}/100)</strong> - Automated accessibility audit covering ~30% of issues<br/>
                  <strong>Detailed Analysis</strong> - Comprehensive WCAG 2.1 compliance check covering all accessibility requirements
                </p>
              </div>
              
              {/* Summary Stats */}
              {accessibility.issues && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{accessibility.issues.errors || 0}</div>
                    <p className="text-sm text-gray-600">WCAG Errors</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{accessibility.issues.warnings || 0}</div>
                    <p className="text-sm text-gray-600">Warnings</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{accessibility.issues.notices || 0}</div>
                    <p className="text-sm text-gray-600">Notices</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-600">{accessibility.issues.total || 0}</div>
                    <p className="text-sm text-gray-600">Total Issues</p>
                  </div>
                </div>
              )}
              
              {/* Detailed Issues */}
              {accessibility.details && accessibility.details.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Accessibility Issues ({accessibility.details.length} total)
                    </h4>
                    {accessibility.details.length > 6 && (
                      <button
                        onClick={() => setShowAllAccessibilityIssues(!showAllAccessibilityIssues)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showAllAccessibilityIssues ? 'Show Less' : `Show All ${accessibility.details.length}`}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {(showAllAccessibilityIssues ? accessibility.details : accessibility.details.slice(0, 6)).map((issue: any, index: number) => (
                      <div key={index} className={`flex items-start space-x-3 p-3 rounded border ${
                        issue.type === 'error' ? 'bg-red-50 border-red-200' :
                        issue.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          issue.type === 'error' ? 'bg-red-100 text-red-700' :
                          issue.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-900">
                            {issue.code || issue.type || 'Accessibility Issue'}
                          </h5>
                          <p className="text-xs text-gray-700 mt-1">
                            {issue.message || issue.description || 'Issue detected'}
                          </p>
                          {issue.selector && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                              {issue.selector}
                            </code>
                          )}
                          {issue.context && (
                            <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                              {issue.context.length > 100 ? issue.context.substring(0, 100) + '...' : issue.context}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!accessibility.details || accessibility.details.length === 0) && (!accessibility.issues || accessibility.issues.total === 0) && accessibilityScore > 90 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <span className="text-green-800 font-medium">Excellent accessibility compliance!</span>
                  <p className="text-green-700 text-sm mt-1">No major accessibility issues detected</p>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Security Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Security Headers</h4>
                  <div className="space-y-2">
                    {security.headers ? (
                      Object.entries(security.headers).map(([header, present]: [string, any]) => (
                        <div key={header} className="flex items-center space-x-2">
                          {present ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm capitalize">{header.replace(/-/g, ' ')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">Security headers analysis not available</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">HTTPS & Certificates</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {results.url?.startsWith('https://') ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">HTTPS Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Action Plan</h3>
              
              {/* Priority Issues */}
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Critical Issues (Fix Immediately)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {performanceScore < 50 && (
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">•</span>
                        <span>Page loads too slowly ({formatTime(metrics.firstContentfulPaint || 0)}). Optimize images and reduce server response time.</span>
                      </li>
                    )}
                    {accessibilityScore < 50 && (
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">•</span>
                        <span>Serious accessibility issues found ({accessibility.issues?.length || 0} total). Address color contrast and missing alt text.</span>
                      </li>
                    )}
                    {!results.url?.startsWith('https://') && (
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">•</span>
                        <span>Website not using HTTPS. Implement SSL certificate immediately.</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Important Improvements (Next 30 Days)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {seoScore < 80 && (
                      <li className="flex items-start space-x-2">
                        <span className="text-yellow-600">•</span>
                        <span>Optimize SEO meta descriptions and title tags for better search rankings.</span>
                      </li>
                    )}
                    {performanceScore < 80 && performanceScore >= 50 && (
                      <li className="flex items-start space-x-2">
                        <span className="text-yellow-600">•</span>
                        <span>Implement image optimization and lazy loading to improve page speed.</span>
                      </li>
                    )}
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-600">•</span>
                      <span>Set up monitoring to track performance metrics over time.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                    Long-term Optimizations (Next 90 Days)
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600">•</span>
                      <span>Implement advanced caching strategies for better performance.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600">•</span>
                      <span>Consider Progressive Web App (PWA) features for mobile users.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600">•</span>
                      <span>Implement comprehensive analytics and user tracking.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Cost-Benefit Analysis */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Estimated Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+{Math.round(25 + (100 - overallScore) * 0.5)}%</div>
                    <div className="text-sm text-gray-600">User Experience</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">+{Math.round(15 + (100 - seoScore) * 0.3)}%</div>
                    <div className="text-sm text-gray-600">Search Visibility</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">+{Math.round(10 + (100 - performanceScore) * 0.2)}%</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw Data (collapsed by default) */}
      <details className="bg-gray-50 rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-gray-700 flex items-center">
          <DocumentTextIcon className="w-4 h-4 mr-2" />
          Technical Data (Developer View)
        </summary>
        <pre className="mt-4 bg-white p-4 rounded border text-xs overflow-auto max-h-96 text-gray-600">
          {JSON.stringify(results, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default WebsiteAnalysisReport 