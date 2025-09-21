// Backend Service - Communication with CodeAnalyst Backend API
// Updated to use port 3001 for backend connection (matches env.example)
import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minute timeout for analysis operations
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface AnalysisStatus {
  id: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
}

export interface URLAnalysisRequest {
  url: string
  options?: {
    aiProfile?: 'technical' | 'business' | 'mixed'
    includeScreenshots?: boolean
    deepAnalysis?: boolean
  }
}

export interface URLAnalysisResult {
  id: string
  url: string
  title?: string
  status: string
  technologies: string[]
  performance: any
  lighthouse?: any
  seo: any
  accessibility: any
  security: any
  basic?: any
  scores?: any
  aiInsights: any
  businessRecommendations: any
  technicalRecommendations: any
  riskAssessment: any
  analysisDate?: string
  analyzedAt?: string
  completedAt?: string
  analysisTime?: number
  duration?: number
  confidenceScore?: number
  raw?: any
}

export interface GitHubAnalysisRequest {
  repoUrl: string
  branch?: string
  options?: {
    aiProfile?: 'technical' | 'business' | 'mixed'
    includeTests?: boolean
    runSecurityScan?: boolean
  }
}

export interface CodeAnalysisResult {
  id: string
  sourceType: 'github' | 'zip'
  sourceReference: string
  status: string
  totalFiles: number
  totalLines: number
  languages: string[]
  frameworks: string[]
  codeQualityScore: number
  technicalDebtPercentage: number
  testCoveragePercentage: number
  complexityScore: number
  systemOverview: any
  technicalStructure: any
  maintenanceNeeds: any
  aiExplanations: any
  businessRecommendations: any
  riskAssessment: any
  testResults: any
  buildResults: any
  staticAnalysisResults: any
  analysisDate: string
  completedAt: string
  duration: number
}

class BackendService {
  /**
   * Test backend connection
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health')
    return response.data
  }

  /**
   * Start URL analysis
   */
  async analyzeURL(request: URLAnalysisRequest): Promise<{ analysisId: string; status: string; estimatedTime: string }> {
    const response = await api.post('/url-analysis/analyze', request)
    return response.data
  }

  /**
   * Check analysis status
   */
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await api.get(`/url-analysis/status/${analysisId}`)
    return response.data.analysis
  }

  /**
   * Get URL analysis results
   */
  async getURLAnalysisResult(analysisId: string): Promise<URLAnalysisResult> {
    const response = await api.get(`/url-analysis/result/${analysisId}`)
    return response.data.analysis
  }

  /**
   * Get URL analysis history
   */
  async getURLAnalysisHistory(page = 1, limit = 20): Promise<{ analyses: URLAnalysisResult[]; pagination: any }> {
    const response = await api.get(`/url-analysis/history?page=${page}&limit=${limit}`)
    return response.data
  }

  /**
   * Start GitHub repository analysis
   */
  async analyzeGitHubRepo(request: GitHubAnalysisRequest): Promise<{ analysisId: string; status: string; estimatedTime: string }> {
    const response = await api.post('/code-analysis/github', request)
    return response.data
  }

  /**
   * Upload and analyze ZIP file
   */
  async analyzeZipFile(file: File, options?: { aiProfile?: 'technical' | 'business' | 'mixed' }): Promise<{ analysisId: string; status: string; estimatedTime: string }> {
    const formData = new FormData()
    formData.append('zipFile', file)
    
    if (options?.aiProfile) {
      formData.append('options[aiProfile]', options.aiProfile)
    }

    const response = await api.post('/code-analysis/zip', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 120000 // 2 minutes for file upload
    })
    
    return response.data
  }

  /**
   * Get code analysis status
   */
  async getCodeAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await api.get(`/code-analysis/status/${analysisId}`)
    return response.data.analysis
  }

  /**
   * Get code analysis results
   */
  async getCodeAnalysisResult(analysisId: string): Promise<CodeAnalysisResult> {
    const response = await api.get(`/code-analysis/result/${analysisId}`)
    return response.data.analysis
  }

  /**
   * Get code analysis history
   */
  async getCodeAnalysisHistory(page = 1, limit = 20, sourceType?: 'github' | 'zip'): Promise<{ analyses: CodeAnalysisResult[]; pagination: any }> {
    let url = `/code-analysis/history?page=${page}&limit=${limit}`
    if (sourceType) {
      url += `&sourceType=${sourceType}`
    }
    const response = await api.get(url)
    return response.data
  }

  /**
   * Delete analysis
   */
  async deleteURLAnalysis(analysisId: string): Promise<void> {
    await api.delete(`/url-analysis/${analysisId}`)
  }

  /**
   * Delete code analysis
   */
  async deleteCodeAnalysis(analysisId: string): Promise<void> {
    await api.delete(`/code-analysis/${analysisId}`)
  }

  /**
   * Re-analyze URL
   */
  async reanalyzeURL(analysisId: string): Promise<{ analysisId: string; status: string }> {
    const response = await api.post(`/url-analysis/reanalyze/${analysisId}`)
    return response.data
  }

  /**
   * Polling helper for analysis completion
   */
  async pollAnalysisStatus(
    analysisId: string, 
    type: 'url' | 'code' = 'url',
    onProgress?: (status: AnalysisStatus) => void,
    maxAttempts = 60, // 5 minutes max
    interval = 10000 // 10 seconds
  ): Promise<AnalysisStatus> {
    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++
          
          const status = type === 'url' 
            ? await this.getAnalysisStatus(analysisId)
            : await this.getCodeAnalysisStatus(analysisId)

          if (onProgress) {
            onProgress(status)
          }

          if (status.status === 'completed') {
            resolve(status)
            return
          }

          if (status.status === 'failed') {
            reject(new Error(status.error || 'Analysis failed'))
            return
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout'))
            return
          }

          // Continue polling
          setTimeout(poll, interval)

        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }

  /**
   * Converts backend URL analysis result to a format compatible with frontend components.
   */
  convertToAdoreInoFormat(urlResult: URLAnalysisResult): any {
    // Log the raw result for debugging
    // Debug: Check backend response
    if (!urlResult.basic || Object.keys(urlResult.basic).length === 0) {
      console.log('⚠️ Backend is not providing basic website data')
    }
    
    // Use the actual scores object if available, otherwise extract from individual components
    const actualScores = urlResult.scores || {}
    // EMERGENCY FIX: Backend is putting scores in wrong place, so extract from performance object
    const performanceScore = actualScores.performance || urlResult.performance?.performance || urlResult.lighthouse?.performance || 0
    const seoScore = actualScores.seo || urlResult.performance?.seo || urlResult.lighthouse?.seo || 0
    const accessibilityScore = actualScores.accessibility || urlResult.performance?.accessibility || urlResult.lighthouse?.accessibility || 0
    const securityScore = actualScores.security || urlResult.security?.score || 0
    const bestPracticesScore = actualScores.bestPractices || urlResult.performance?.bestPractices || urlResult.lighthouse?.bestPractices || 0
    const overallScore = actualScores.overall || Math.round((performanceScore + seoScore + accessibilityScore + securityScore + bestPracticesScore) / 5)
    

    
    // For URLs, we now properly map the comprehensive data structure
    const mappedResult = {
      ...urlResult,
      
      // Ensure basic data is available - try multiple fallback paths  
      basic: urlResult.basic || urlResult.raw?.basic || {},
      
      // Ensure performance data is properly structured using actual scores
      performance: {
        score: performanceScore,
        metrics: urlResult.lighthouse?.metrics || urlResult.performance?.metrics || {},
        opportunities: urlResult.lighthouse?.opportunities || urlResult.performance?.opportunities || []
      },
      
      // Ensure lighthouse data is properly structured with actual scores
      lighthouse: {
        performance: performanceScore,
        seo: seoScore,
        accessibility: accessibilityScore,
        bestPractices: bestPracticesScore,
        metrics: urlResult.lighthouse?.metrics || {},
        opportunities: urlResult.lighthouse?.opportunities || []
      },
      
      // Ensure SEO data is properly structured
      seo: {
        score: seoScore,
        title: urlResult.seo?.title || urlResult.basic?.title || '',
        description: urlResult.seo?.description || urlResult.basic?.description || '',
        keywords: urlResult.seo?.keywords || urlResult.basic?.keywords || [],
        headings: urlResult.seo?.headings || urlResult.basic?.headingStructure || {},
        // CRITICAL: Preserve comprehensive SEO analysis
        comprehensive: urlResult.seo?.comprehensive,
        lighthouseScore: urlResult.seo?.lighthouseScore,
        recommendations: urlResult.seo?.recommendations,
        criticalIssues: urlResult.seo?.criticalIssues
      },
      
      // Ensure accessibility data is properly structured
      accessibility: {
        score: accessibilityScore,
        issues: urlResult.accessibility?.issues || [],
        details: urlResult.accessibility?.details || []
      },
      
      // Ensure security data is properly structured
      security: {
        score: securityScore,
        headers: urlResult.security?.headers || {},
        vulnerabilities: urlResult.security?.vulnerabilities || [],
        recommendations: urlResult.security?.recommendations || []
      },
      
      // Ensure technologies array is properly formatted
      technologies: Array.isArray(urlResult.technologies) 
        ? urlResult.technologies 
        : Array.isArray((urlResult as any).technologies?.technologies)
          ? (urlResult as any).technologies.technologies.map((tech: any) => 
              typeof tech === 'string' ? tech : tech.name || tech
            ) 
          : [],
      
      // Use actual calculated scores
      scores: {
        performance: performanceScore,
        seo: seoScore,
        accessibility: accessibilityScore,
        security: securityScore,
        bestPractices: bestPracticesScore,
        overall: overallScore
      },
      
      // System overview for the header using actual scores
      systemOverview: {
        projectType: 'website',
        overallScore: overallScore
      },
      
      // Include AI insights if available
      aiInsights: urlResult.aiInsights,
      
      // Include raw data for debugging
      raw: urlResult
    }
    
    console.log('✅ Mapped Result for Frontend:', JSON.stringify(mappedResult, null, 2))
    return mappedResult
  }

  convertToAdoreInoFormatOld(urlResult: URLAnalysisResult): any {
    // Calculate actual scores from the analysis result
    const actualScores = urlResult.scores || {}
    const performanceScore = actualScores.performance || urlResult.performance?.performance || urlResult.lighthouse?.performance || 0
    const overallScore = actualScores.overall || Math.round((performanceScore + (actualScores.seo || 0) + (actualScores.accessibility || 0) + (actualScores.security || 0)) / 4)
    
    return {
      systemOverview: {
        projectType: 'website',
        overallScore: Math.round(overallScore * 0.8) // Apply 0.8 factor if needed for legacy compatibility
      },
      technicalStructure: {
        codeQuality: {
          score: Math.round(overallScore * 0.8),
          issues: []
        }
      },
      maintenanceNeeds: {
        technicalDebt: Math.round((100 - overallScore) * 0.5),
        codeSmells: [],
        refactoringOpportunities: [],
        priorityLevel: overallScore >= 70 ? 'low' : overallScore >= 50 ? 'medium' : 'high'
      },
      aiExplanations: urlResult.aiInsights || {},
      businessRecommendations: (urlResult.businessRecommendations || []).map((rec: any) => ({
        ...rec,
        category: rec.category || 'general',
        impact: rec.impact || 'medium',
        urgency: rec.urgency || 'medium'
      })),
      riskAssessment: urlResult.riskAssessment || {
        overallRisk: 'medium',
        technicalRisks: [],
        businessRisks: [],
        securityConcerns: []
      },
      confidenceLevel: urlResult.confidenceScore || 50,
      dataValidation: {
        realData: [
          { metric: 'Page Load Time', value: '2.3s', source: 'Browser' },
          { metric: 'First Contentful Paint', value: '1.8s', source: 'Lighthouse' }
        ],
        estimatedData: [
          { metric: 'SEO Score', value: '75/100', source: 'Analysis' },
          { metric: 'Accessibility Score', value: '82/100', source: 'Pa11y' }
        ],
        simulatedData: [
          { metric: 'User Engagement', value: 'Medium', source: 'Estimated' }
        ],
        confidenceScores: {
          performance: 85,
          seo: 70,
          accessibility: 80,
          security: 60
        }
      }
    }
  }
}

// Export singleton instance
export const backendService = new BackendService()
export default backendService 