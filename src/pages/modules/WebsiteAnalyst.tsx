import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { GlobeAltIcon, ExclamationTriangleIcon, CheckCircleIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import WebsiteAnalysisReport from '../../components/WebsiteAnalysisReport'
import { AdoreInoReport } from '../../components/AdoreInoReport'
import { AIProviderStatus } from '../../components/AIProviderStatus'
import { WordPressSiteSelector } from '../../components/WordPressSiteSelector'
import { ModuleAccessGuard } from '../../components/ModuleAccessGuard'
import { useProjectContext } from '../../contexts/ProjectContext'
import { WordPressConnection } from '../../services/wordpressService'
import { urlFetcher } from '../../services/urlFetcher'
import { backendService } from '../../services/backendService'
import { AdoreInoAnalyzer } from '../../utils/adoreIno'
import { createAIService } from '../../services/aiService'
import { AdoreInoAnalysis, AdoreInoResults } from '../../types'
import { scanURL, convertURLScanToFileStructure } from '../../utils/urlScanner'
import { realUrlConverter } from '../../utils/realUrlToFileConverter'

function WebsiteAnalystContent() {
  const location = useLocation()
  const { selectedProject, isProjectMode } = useProjectContext()
  const [urlInput, setUrlInput] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [analysis, setAnalysis] = useState<AdoreInoAnalysis | null>(null)
  const [analysisType, setAnalysisType] = useState<'url' | 'code'>('url')
  const [aiProviderUsed, setAiProviderUsed] = useState<{ provider: string; model: string } | null>(null)
  const [useBackend, setUseBackend] = useState<boolean>(true)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [usePageSpeed, setUsePageSpeed] = useState<boolean>(true)
  const [useSecurityScan, setUseSecurityScan] = useState<boolean>(true)
  const [useSSLScan, setUseSSLScan] = useState<boolean>(false)

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

  // Update URL input when project changes
  useEffect(() => {
    if (isProjectMode && selectedProject) {
      setUrlInput(selectedProject.url)
    }
  }, [selectedProject, isProjectMode])

  // Handle prefilled URL from navigation (e.g., from Connected Sites)
  useEffect(() => {
    if (location.state?.prefilledUrl) {
      const url = location.state.prefilledUrl
      setUrlInput(url)
      
      // Auto-start analysis after a short delay
      toast.success(`Analyzing ${url}...`)
      setTimeout(() => {
        handleAnalyze()
      }, 500)
    }
  }, [location.state])

  const handleWordPressSiteSelect = (site: WordPressConnection) => {
    setUrlInput(site.site_url)
    toast.success(`Selected ${site.site_name || site.site_url}. Starting analysis...`)
    
    // Auto-start analysis - pass URL directly!
    setTimeout(() => {
      handleAnalyze(site.site_url)
    }, 500)
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async (providedUrl?: string) => {
    const urlToAnalyze = providedUrl || urlInput
    
    if (!urlToAnalyze.trim()) {
      toast.error('Please enter a website URL to analyze')
      return
    }

    if (!isValidUrl(urlToAnalyze)) {
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
      if (urlToAnalyze) {
        if (useBackend && backendStatus === 'available') {
          // Use backend for real analysis
          setAnalysisType('url')
          setAnalysisStep('Sending URL to backend for analysis...')
          
          try {
            const response = await backendService.analyzeURL({
              url: urlToAnalyze,
              options: {
                aiProfile: 'mixed', // For URL analysis, use mixed profile
                deepAnalysis: true,
                includeScreenshots: false,
                usePageSpeed: usePageSpeed, // Enable/disable PageSpeed API
                useSecurityScan: useSecurityScan, // Enable/disable Mozilla Observatory
                useSSLScan: useSSLScan // Enable/disable SSL Labs
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
              
              toast.success(`✅ Backend analysis completed! Real data from ${urlToAnalyze}`, {
                duration: 5000,
                position: 'top-right',
              })
              
              setIsAnalyzing(false)
              return // Exit early - no need for client-side processing
            }
            
          } catch (error) {
            console.error('Backend URL analysis failed:', error)
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error('Full error details:', errorMessage)
            
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
            } else if (errorMessage.includes('502') || errorMessage.includes('bot') || errorMessage.includes('blocked')) {
              // Bot protection detected
              toast.error(`🤖 Website blocked analysis: The site detected automated access. Try a different URL or wait before retrying.`, {
                duration: 10000,
                position: 'top-right',
              })
              setIsAnalyzing(false)
              return
            } else {
              // For other errors, stop completely
              toast.error(`Backend analysis failed: ${errorMessage.includes('Request failed') ? 'Server error - please try again' : errorMessage}`, {
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
            const realScanResult = await urlFetcher.fetchURL(urlToAnalyze, {
              includeResources: true,
              timeout: 30000,
              proxyService: 'allorigins'
            })
            
            setAnalysisStep('Converting website data to analyzable format...')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Convert real data to file structure
            filesToAnalyze = realUrlConverter.convertToFileStructure(realScanResult)
            
            toast.success(`Successfully analyzed ${urlToAnalyze}! 🌐 Found ${filesToAnalyze.length} analyzable files`, {
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
            
            const fallbackResult = await scanURL(urlToAnalyze, {
              includeResources: true,
              checkPerformance: true,
              analyzeSEO: true,
              checkAccessibility: true
            })
            
            filesToAnalyze = convertURLScanToFileStructure(fallbackResult)
            
            toast(`⚠️ Using fallback analysis for ${urlToAnalyze}`, {
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

      {/* WordPress Site Selector */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Connected WordPress Site</h3>
        <WordPressSiteSelector 
          onSiteSelect={handleWordPressSiteSelect}
          label="Choose a WordPress site to analyze"
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">OR</span>
        </div>
      </div>

      {/* URL Input */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analyze Any Website</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              🌐 Enter any website URL to get comprehensive analysis including performance metrics, SEO optimization, accessibility compliance, and security assessment.
            </p>
          </div>
          <div className="flex space-x-3">
            <input
              type="url"
              className="flex-1 input"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing || isProjectMode}
              readOnly={isProjectMode}
              title={isProjectMode ? 'URL is set from selected project' : ''}
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
          
          {/* PageSpeed Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePageSpeed}
                  onChange={(e) => setUsePageSpeed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Use Google PageSpeed Insights</span>
                  <p className="text-xs text-gray-500">Get real-world performance data from Google (adds ~30s)</p>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <SparklesIcon className="w-4 h-4" />
              <span>Powered by Google</span>
            </div>
          </div>
          
          {/* Security Scan Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSecurityScan}
                  onChange={(e) => setUseSecurityScan(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Security Headers Analysis</span>
                  <p className="text-xs text-gray-500">Scan security headers with Mozilla Observatory (adds ~15s)</p>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <SparklesIcon className="w-4 h-4" />
              <span>Powered by Mozilla</span>
            </div>
          </div>
          
          {/* SSL Labs Toggle (Optional - Off by default) */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSSLScan}
                  onChange={(e) => setUseSSLScan(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">SSL/TLS Deep Scan</span>
                  <p className="text-xs text-gray-500">Comprehensive SSL analysis with SSL Labs (adds ~2-3 min)</p>
                  <p className="text-xs text-yellow-600 font-semibold mt-1">⚠️ Rate limited: 1 scan per domain per 24 hours</p>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <SparklesIcon className="w-4 h-4" />
              <span>Powered by SSL Labs</span>
            </div>
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

export function WebsiteAnalyst() {
  return (
    <ModuleAccessGuard module="website_analyst">
      <WebsiteAnalystContent />
    </ModuleAccessGuard>
  )
}