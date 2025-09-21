export interface AnalysisResult {
  id: string
  sourceType: 'github' | 'zip' | 'url'
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  metadata: {
    owner?: string
    repo?: string
    branch?: string
    url?: string
  }
  results?: any
  errorMessage?: string
}

export interface WebsiteAnalysisResult {
  id: string
  url: string
  title: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  technologies: string[]
  confidenceScore?: number
  performance?: {
    score: number
  }
  seo?: {
    score: number
  }
  accessibility?: {
    score: number
  }
  security?: {
    score: number
  }
}

export class AnalysisService {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'

  /**
   * Get user's analysis history
   */
  async getUserAnalyses(): Promise<AnalysisResult[]> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/code-analysis/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch analysis history')
    }

    return data.analyses
  }

  /**
   * Get latest successful analysis for a repository
   */
  async getLatestAnalysisByRepo(repoUrl: string): Promise<AnalysisResult> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const encodedRepoUrl = encodeURIComponent(repoUrl)
    const response = await fetch(`${this.baseUrl}/code-analysis/latest/${encodedRepoUrl}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch latest analysis')
    }

    return data.analysis
  }

  /**
   * Get specific analysis by ID (with fallback to latest)
   */
  async getAnalysisById(analysisId: string, repoUrl?: string): Promise<AnalysisResult> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/code-analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Slowing down polling...')
    }

    if (!response.ok) {
      // If specific analysis fails and we have a repo URL, try latest successful analysis
      if (repoUrl && (response.status === 404 || response.status === 400)) {
        console.warn(`Analysis ${analysisId} not found or invalid, trying latest for repo: ${repoUrl}`)
        return this.getLatestAnalysisByRepo(repoUrl)
      }
      
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      const responseText = await response.text()
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch analysis')
    }

    // Validate that we have real data
    if (!data.analysis.results?.totalFiles || data.analysis.results.totalFiles === 0) {
      if (repoUrl) {
        console.warn(`Analysis ${analysisId} has no data, trying latest for repo: ${repoUrl}`)
        return this.getLatestAnalysisByRepo(repoUrl)
      }
    }

    return data.analysis
  }

  /**
   * Poll analysis status until completion
   */
  async pollAnalysisStatus(
    analysisId: string,
    onProgress?: (analysis: AnalysisResult) => void,
    repoUrl?: string
  ): Promise<AnalysisResult> {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const analysis = await this.getAnalysisById(analysisId, repoUrl)
          
          if (onProgress) {
            onProgress(analysis)
          }

          if (analysis.status === 'completed' || analysis.status === 'failed') {
            resolve(analysis)
            return
          }

          attempts++
          if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout'))
            return
          }

          setTimeout(poll, 10000) // Poll every 10 seconds
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          if (errorMessage.includes('Rate limit')) {
            // For rate limits, wait longer and continue
            attempts++
            if (attempts >= maxAttempts) {
              reject(new Error('Analysis timeout due to repeated rate limits'))
              return
            }
            setTimeout(poll, 30000) // Wait 30 seconds on rate limit
          } else {
            reject(error)
          }
        }
      }

      poll()
    })
  }

  /**
   * Get analysis history for the user
   */
  async getAnalysisHistory(): Promise<any[]> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/code-analysis/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch analysis history')
    }

    return data.analyses
  }

  /**
   * Delete analysis by ID
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/code-analysis/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete analysis')
    }
  }

  /**
   * Get user's website analysis history
   */
  async getWebsiteAnalysisHistory(): Promise<WebsiteAnalysisResult[]> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/url-analysis/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch website analysis history')
    }

    return data.analyses
  }

  /**
   * Get website analysis by ID
   */
  async getWebsiteAnalysisById(analysisId: string): Promise<any> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/url-analysis/result/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch website analysis')
    }

    return data.analysis
  }

  /**
   * Delete website analysis
   */
  async deleteWebsiteAnalysis(analysisId: string): Promise<void> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/url-analysis/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete analysis: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete analysis')
    }
  }
}

export const analysisService = new AnalysisService() 