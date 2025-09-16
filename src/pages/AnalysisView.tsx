import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { analysisService } from '../services/analysisService'
import { CodeAnalysisReport } from '../components/CodeAnalysisReport'
import { WebsiteAnalysisReport } from '../components/WebsiteAnalysisReport'
import { toast } from 'react-hot-toast'

export function AnalysisView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadAnalysis(id)
    }
  }, [id])

  const loadAnalysis = async (analysisId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if this is a website analysis route
      const isWebsiteAnalysis = window.location.pathname.includes('/analysis/website/')
      
      // Fetch the appropriate analysis
      const analysisData = isWebsiteAnalysis 
        ? await analysisService.getWebsiteAnalysisById(analysisId)
        : await analysisService.getAnalysisById(analysisId)
      
      setAnalysis(analysisData)
      
    } catch (error) {
      console.error('Failed to load analysis:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analysis')
      toast.error('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/projects')
  }

  const getRepoName = (analysis: any) => {
    // Try to get from source_reference first
    if (analysis.source_reference?.includes('github.com')) {
      const parts = analysis.source_reference.split('/')
      return parts[parts.length - 1] || parts[parts.length - 2] || 'Repository'
    }
    
    // Try metadata sourceReference  
    if (analysis.metadata?.sourceReference?.includes('github.com')) {
      const parts = analysis.metadata.sourceReference.split('/')
      return parts[parts.length - 1] || parts[parts.length - 2] || 'Repository'
    }
    
    // For website analysis
    if (analysis.sourceType === 'url' && analysis.metadata?.sourceReference) {
      try {
        return new URL(analysis.metadata.sourceReference).hostname
      } catch {
        return 'Website Analysis'
      }
    }
    
    // Default based on analysis type
    if (analysis.sourceType === 'github') return 'GitHub Repository'
    if (analysis.sourceType === 'url') return 'Website Analysis' 
    if (analysis.sourceType === 'zip') return 'Code Archive'
    
    return 'Code Analysis'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analysis...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876a2 2 0 001.789-1.089l6.143-12.286C15.97 3.125 14.47 2 12.5 2h-1C9.03 2 7.53 3.125 6.63 5.625L.487 17.911A2 2 0 002.276 19h13.876a2 2 0 001.789-1.089l6.143-12.286z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Not Found</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="btn-primary flex items-center space-x-2 mx-auto"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Analysis History</span>
        </button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data</h3>
        <p className="text-gray-600 mb-4">The analysis data could not be loaded.</p>
        <button
          onClick={handleBack}
          className="btn-primary flex items-center space-x-2 mx-auto"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Analysis History</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-2 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Analysis History
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Analysis Results - {getRepoName(analysis)}
          </h1>
          <p className="text-gray-600">
            Analysis ID: {id} • Status: {analysis.status} • 
            {analysis.completedAt && ` Completed: ${new Date(analysis.completedAt).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Analysis Report */}
      {(analysis.sourceType === 'url' || window.location.pathname.includes('/analysis/website/')) ? (
        <WebsiteAnalysisReport results={analysis} />
      ) : (
        <CodeAnalysisReport analysis={analysis} />
      )}
    </div>
  )
} 