import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { analysisService } from '../services/analysisService'
import { CodeAnalysisReport } from '../components/CodeAnalysisReport'
import { toast } from 'react-hot-toast'

export function WorkstationView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadAnalysis(id)
    }
  }, [id])

  const loadAnalysis = async (analysisId: string) => {
    try {
      setLoading(true)
      const data = await analysisService.getAnalysisById(analysisId)
      setAnalysis(data)
    } catch (error) {
      console.error('Failed to load analysis:', error)
      toast.error('Failed to load analysis')
      navigate('/analysis')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workstation...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Analysis not found</h2>
          <p className="mt-2 text-gray-600">The requested analysis could not be loaded.</p>
          <button
            onClick={() => navigate('/analysis')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/analysis/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Analysis
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              AI Workstation
            </h1>
          </div>
        </div>
      </div>

      {/* Workstation Content */}
      <CodeAnalysisReport analysis={analysis} enableWorkstation={true} />
    </div>
  )
} 