import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrashIcon, 
  EyeIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { analysisService, WebsiteAnalysisResult } from '../services/analysisService'
import { toast } from 'react-hot-toast'

interface AnalysisHistoryItem {
  id: string
  sourceType: string
  sourceReference: string
  status: string
  progress: number
  totalFiles: number | null
  totalLines: number | null
  languages: string[]
  codeQualityScore: number | null
  createdAt: string
  completedAt: string | null
  errorMessage: string | null
}

type AnalysisTab = 'code' | 'website'

export function Projects() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AnalysisTab>('code')
  const [codeAnalyses, setCodeAnalyses] = useState<AnalysisHistoryItem[]>([])
  const [websiteAnalyses, setWebsiteAnalyses] = useState<WebsiteAnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true)
      
      // Load both code and website analysis histories
      const [codeHistory, websiteHistory] = await Promise.all([
        analysisService.getAnalysisHistory(),
        analysisService.getWebsiteAnalysisHistory().catch(() => []) // Fallback to empty array if fails
      ])
      
      setCodeAnalyses(codeHistory as AnalysisHistoryItem[])
      setWebsiteAnalyses(websiteHistory)
    } catch (error) {
      console.error('Failed to load analysis history:', error)
      toast.error('Failed to load analysis history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (analysisId: string, repoName: string, type: 'code' | 'website' = 'code') => {
    if (!confirm(`Are you sure you want to delete the analysis for "${repoName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(analysisId)
      
      if (type === 'website') {
        await analysisService.deleteWebsiteAnalysis(analysisId)
        // Remove from local state
        setWebsiteAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId))
      } else {
        await analysisService.deleteAnalysis(analysisId)
        // Remove from local state
        setCodeAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId))
      }
      
      toast.success('Analysis deleted successfully', {
        duration: 3000,
        position: 'top-right',
      })
    } catch (error) {
      console.error('Failed to delete analysis:', error)
      toast.error('Failed to delete analysis')
    } finally {
      setDeleting(null)
    }
  }

  const handleView = (analysisId: string, type: 'code' | 'website' = 'code') => {
    if (type === 'website') {
      navigate(`/analysis/website/${analysisId}`)
    } else {
      navigate(`/analysis/${analysisId}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'analyzing':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'github':
        return <CodeBracketIcon className="h-5 w-5 text-gray-700" />
      case 'url':
        return <GlobeAltIcon className="h-5 w-5 text-blue-600" />
      case 'zip':
        return <ArchiveBoxIcon className="h-5 w-5 text-purple-600" />
      default:
        return <CodeBracketIcon className="h-5 w-5 text-gray-700" />
    }
  }

  const getRepoName = (sourceReference: string) => {
    if (sourceReference?.includes('github.com')) {
      return sourceReference.split('/').pop() || 'Unknown Repository'
    }
    if (sourceReference?.startsWith('http')) {
      try {
        return new URL(sourceReference).hostname
      } catch {
        return 'Website'
      }
    }
    return sourceReference || 'Unknown Source'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return `${diffMins} minutes ago`
      } else if (diffHours < 24) {
        return `${diffHours} hours ago`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} days ago`
      }
    } catch {
      return 'Unknown'
    }
  }

  const currentAnalyses = activeTab === 'code' ? codeAnalyses : websiteAnalyses

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analysis history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
        <p className="text-gray-600">View and manage your code and website analysis history</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <CodeBracketIcon className="h-5 w-5 mr-2" />
              Code Analysis ({codeAnalyses.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('website')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'website'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <GlobeAltIcon className="h-5 w-5 mr-2" />
              Website Analysis ({websiteAnalyses.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Analysis List */}
      <div className="space-y-4">
        {currentAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {activeTab === 'code' ? <CodeBracketIcon /> : <GlobeAltIcon />}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} analyses yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by analyzing your first {activeTab === 'code' ? 'repository' : 'website'}.
            </p>
          </div>
        ) : (
          currentAnalyses.map((analysis: any) => (
            <div key={analysis.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  {getStatusIcon(analysis.status)}
                  
                  {/* Type Icon */}
                  {activeTab === 'code' ? getTypeIcon(analysis.sourceType) : <GlobeAltIcon className="h-5 w-5 text-blue-600" />}
                  
                  {/* Analysis Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {activeTab === 'code' ? getRepoName(analysis.sourceReference) : (analysis.title || analysis.url)}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="capitalize">{analysis.status}</span>
                      <span>🕒 {formatDate(analysis.createdAt)}</span>
                      
                      {/* Code Analysis Specific Info */}
                      {activeTab === 'code' && (
                        <>
                          {analysis.totalFiles && (
                            <span>📁 {analysis.totalFiles} files</span>
                          )}
                          {analysis.totalLines && (
                            <span>📄 {analysis.totalLines.toLocaleString()} lines</span>
                          )}
                          {analysis.codeQualityScore && (
                            <span>⭐ {analysis.codeQualityScore}/100 quality</span>
                          )}
                          {analysis.languages && analysis.languages.length > 0 && (
                            <span>💻 {analysis.languages.filter((l: string) => l && l.length > 1).map((l: string) => l.replace('.', '')).join(', ')}</span>
                          )}
                        </>
                      )}
                      
                      {/* Website Analysis Specific Info */}
                      {activeTab === 'website' && (
                        <>
                          {analysis.technologies && analysis.technologies.length > 0 && (
                            <span>🔧 {analysis.technologies.slice(0, 3).join(', ')}</span>
                          )}
                          {analysis.performance?.score && (
                            <span>⚡ {analysis.performance.score}/100 performance</span>
                          )}
                          {analysis.seo?.score && (
                            <span>📈 {analysis.seo.score}/100 SEO</span>
                          )}
                          {analysis.confidenceScore && (
                            <span>🎯 {Math.round(analysis.confidenceScore * 100)}% confidence</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {analysis.status === 'completed' && (
                    <button
                      onClick={() => handleView(analysis.id, activeTab)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(
                      analysis.id, 
                      activeTab === 'code' ? getRepoName(analysis.sourceReference) : (analysis.title || analysis.url),
                      activeTab
                    )}
                    disabled={deleting === analysis.id}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    {deleting === analysis.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              
              {/* Error Message */}
              {analysis.status === 'failed' && analysis.errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {analysis.errorMessage}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 