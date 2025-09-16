import React, { useState, useEffect } from 'react'
import { GlobeAltIcon, ExclamationTriangleIcon, CheckCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import WebsiteAnalysisReport from '../../components/WebsiteAnalysisReport'
import { AdoreInoReport } from '../../components/AdoreInoReport'
import { AIProviderStatus } from '../../components/AIProviderStatus'
import { urlFetcher } from '../../services/urlFetcher'
import { backendService } from '../../services/backendService'
import { AdoreInoAnalyzer } from '../../utils/adoreIno'
import { createAIService } from '../../services/aiService'
import { AdoreInoAnalysis, AdoreInoResults } from '../../types'
import { scanURL, convertURLScanToFileStructure } from '../../utils/urlScanner'
import { realUrlConverter } from '../../utils/realUrlToFileConverter'

export function WebsiteAnalyst() {
  const [urlInput, setUrlInput] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [analysis, setAnalysis] = useState<AdoreInoAnalysis | null>(null)
  const [analysisType, setAnalysisType] = useState<'url' | 'code'>('url')
  const [aiProviderUsed, setAiProviderUsed] = useState<{ provider: string; model: string } | null>(null)
  const [useBackend, setUseBackend] = useState<boolean>(true)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)

  // Check backend availability on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await backendService.healthCheck()
        setBackendStatus('available')
        console.log('✅ Backend is available - using real website analysis')
      } catch (error) {
        setBackendStatus('unavailable')
        setUseBackend(false)
        console.warn('⚠️ Backend unavailable - falling back to client-side analysis:', error)
      }
    }
    
    checkBackend()
  }, [])

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a website URL to analyze')
      return
    }

    if (!isValidUrl(urlInput)) {
      toast.error('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setIsAnalyzing(true)
    setAnalysisStep('Initializing analysis engine...')
    setAnalysis(null)

    const newAnalysis: AdoreInoAnalysis = {
      id: `analysis-${Date.now()}`,
      projectId: 'website-analysis',
      status: 'analyzing',
      createdAt: new Date().toISOString(),
    }
    setAnalysis(newAnalysis)

    try {
      let filesToAnalyze: { path: string; content: string; size: number }[] = []
      
      // Handle URL scanning with the exact same logic as CodeAnalyst
      if (urlInput) {
        if (useBackend && backendStatus === 'available') {
          // Use backend for real analysis
          setAnalysisType('url')
          setAnalysisStep('Sending URL to backend for analysis...')
          
          try {
            const response = await backendService.analyzeURL({
              url: urlInput,
              options: {
                aiProfile: 'mixed', // For URL analysis, use mixed profile
                deepAnalysis: true,
                includeScreenshots: false
              }
            })
            
            setCurrentAnalysisId(response.analysisId)
            setAnalysisStep('Backend analysis in progress...')
            
            toast.success(`Analysis started! ID: ${response.analysisId}`, {
              duration: 4000,
              position: 'top-right',
            })
            
            // Poll for completion
            const finalStatus = await backendService.pollAnalysisStatus(
              response.analysisId,
              'url',
              (status) => {
                setAnalysisStep(`Analysis ${status.progress}% complete...`)
              }
            )
            
            if (finalStatus.status === 'completed') {
              const result = await backendService.getURLAnalysisResult(response.analysisId)
              
              // Convert backend result to frontend format
              const adoreInoResult = backendService.convertToAdoreInoFormat(result)
              
              // Complete the analysis
              newAnalysis.results = adoreInoResult
              newAnalysis.status = 'completed'
              newAnalysis.completedAt = new Date().toISOString()
              setAnalysis({ ...newAnalysis })
              
              toast.success(`✅ Backend analysis completed! Real data from ${urlInput}`, {
                duration: 5000,
                position: 'top-right',
              })
              
              setIsAnalyzing(false)
              return // Exit early - no need for client-side processing
            }
            
          } catch (error) {
            console.error('Backend URL analysis failed:', error)
            
            // Check if it's a rate limit error (429)
            if (error instanceof Error && error.message.includes('429')) {
              toast.error(`⚠️ Analysis quota exceeded. Please wait before analyzing again.`, {
                duration: 10000,
                position: 'top-right',
              })
              
              // Show helpful info about existing results
              setTimeout(() => {
                toast(`💡 If you've analyzed this URL before, check your saved analysis files or wait for the quota to reset.`, {
                  duration: 8000,
                  position: 'top-right',
                })
              }, 2000)
              
              setIsAnalyzing(false)
              return // Stop completely - don't show fake data
            } else {
              // For other errors, stop completely
              toast.error(`Backend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                duration: 5000,
                position: 'top-right',
              })
              
              setIsAnalyzing(false)
              return
            }

          }
        }
        
        // Client-side fallback (original logic)
        if (!useBackend || backendStatus !== 'available') {
          setAnalysisStep('Fetching website content (client-side)...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          try {
            // Use real URL fetcher instead of simulation
            const realScanResult = await urlFetcher.fetchURL(urlInput, {
              includeResources: true,
              timeout: 30000,
              proxyService: 'allorigins'
            })
            
            setAnalysisStep('Converting website data to analyzable format...')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Convert real data to file structure
            filesToAnalyze = realUrlConverter.convertToFileStructure(realScanResult)
            
            toast.success(`Successfully analyzed ${urlInput}! 🌐 Found ${filesToAnalyze.length} analyzable files`, {
              duration: 4000,
              position: 'top-right',
            })
            
            console.log('📊 Real URL Analysis Results:', {
              url: realScanResult.url,
              title: realScanResult.title,
              technologies: realScanResult.technologies,
              domElements: realScanResult.performance.domElements,
              scripts: realScanResult.scripts.length,
              stylesheets: realScanResult.stylesheets.length,
              analyzableFiles: filesToAnalyze.length
            })
            
          } catch (error) {
            console.error('Real URL analysis failed:', error)
            toast.error(`Failed to analyze URL: ${error instanceof Error ? error.message : 'Unknown error'}`, {
              duration: 5000,
              position: 'top-right',
            })
            
            // Fallback to old simulation method
            console.log('🔄 Falling back to simulation method...')
            setAnalysisStep('Using fallback analysis method...')
            
            const fallbackResult = await scanURL(urlInput, {
              includeResources: true,
              checkPerformance: true,
              analyzeSEO: true,
              checkAccessibility: true
            })
            
            filesToAnalyze = convertURLScanToFileStructure(fallbackResult)
            
            toast(`⚠️ Using fallback analysis for ${urlInput}`, {
              duration: 3000,
              position: 'top-right',
            })
          }
        }
      }
      
      const analyzer = new AdoreInoAnalyzer(filesToAnalyze)
      
      // Step 2: Code Quality Analysis
      setAnalysisStep('Analyzing code quality and potential improvements...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const baseResults = await analyzer.analyze()
      
      // Step 3: AI Code Suggestions
      setAnalysisStep('Generating AI-powered improvement suggestions...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Configure AI service based on user preference and available API keys
      const aiService = createAIService()
      
      let finalResults = baseResults
      let providerUsed = null
      
             if (aiService) {
         try {
           const enhancedResults = await aiService.enhanceAnalysisWithAI(baseResults, 'mixed')
           finalResults = enhancedResults
           
           // Store which AI provider was used for this analysis
           setAiProviderUsed({
             provider: (aiService as any).config.provider,
             model: (aiService as any).config.model
           })
          
                     toast.success(`✨ Enhanced with ${(aiService as any).config.provider || 'AI'} insights!`, {
             duration: 3000,
             position: 'top-right',
           })
        } catch (aiError) {
          console.warn('AI enhancement failed, using base analysis:', aiError)
          toast(`⚠️ AI enhancement unavailable, showing base analysis`, {
            duration: 3000,
            position: 'top-right',
          })
        }
      } else {
        toast(`ℹ️ Configure AI provider in Settings for enhanced analysis`, {
          duration: 4000,
          position: 'top-right',
        })
      }
      
      // Complete the analysis
      newAnalysis.results = finalResults
      newAnalysis.status = 'completed'
      newAnalysis.completedAt = new Date().toISOString()
      setAnalysis({ ...newAnalysis })
      
      toast.success('🎉 Analysis completed!', {
        duration: 3000,
        position: 'top-right',
      })

    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      newAnalysis.status = 'failed'
      newAnalysis.completedAt = new Date().toISOString()
      setAnalysis({ ...newAnalysis })
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  const resetAnalysis = () => {
    setAnalysis(null)
    setUrlInput('')
    setCurrentAnalysisId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <GlobeAltIcon className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Analyst</h1>
          <p className="text-gray-600">Comprehensive website performance, SEO, and accessibility analysis</p>
        </div>
      </div>

      {/* AI Provider Status */}
      <AIProviderStatus />

      {/* URL Input */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analyze Website</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              🌐 Enter your website URL to get comprehensive analysis including performance metrics, SEO optimization, accessibility compliance, and security assessment.
            </p>
          </div>
          <div className="flex space-x-3">
            <input
              type="url"
              className="flex-1 input"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !urlInput.trim()}
              className="btn-primary px-6 py-2 flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Analyze Website</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backend Status */}
      <div className="card p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'available' ? 'bg-green-500' :
              backendStatus === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium">
              {backendStatus === 'available' ? 'Backend Connected' :
               backendStatus === 'unavailable' ? 'Backend Offline' : 'Checking Backend...'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {useBackend ? 'Full Analysis Available' : 'Basic Analysis Only'}
          </span>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">Analyzing Website...</p>
              <p className="text-sm text-blue-700">{analysisStep}</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: analysisStep.includes('Initializing') ? '10%' :
                       analysisStep.includes('comprehensive') ? '40%' :
                       analysisStep.includes('Processing') ? '70%' :
                       analysisStep.includes('completed') ? '100%' : '0%'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis?.results && (
        analysisType === 'url' ? (
          <WebsiteAnalysisReport results={analysis.results} />
        ) : (
          <AdoreInoReport 
            results={analysis.results} 
            userProfile={'mixed'}
            aiProvider={aiProviderUsed?.provider}
            aiModel={aiProviderUsed?.model}
          />
        )
      )}

      {/* Analysis Failed */}
      {analysis?.status === 'failed' && (
        <div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Analysis Failed</h3>
              <p className="text-red-700 text-sm">
                We encountered an error during website analysis. Please check the URL and try again.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={resetAnalysis}
              className="btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {analysis?.status === 'completed' && analysis?.results && (
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Website analysis completed successfully
              </span>
            </div>
            <button
              onClick={resetAnalysis}
              className="text-sm text-green-700 hover:text-green-900"
            >
              Analyze Another Website
            </button>
          </div>
        </div>
      )}
    </div>
  )
}