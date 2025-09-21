export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  language: string | null
  size: number
  stargazers_count: number
  forks_count: number
  updated_at: string
  pushed_at: string
  default_branch: string
}

export class GitHubService {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'

  /**
   * Get user's GitHub repositories
   */
  async getUserRepositories(): Promise<GitHubRepository[]> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${this.baseUrl}/auth/github/repos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch repositories')
    }

    return data.repositories
  }

  /**
   * Analyze a GitHub repository
   */
  async analyzeRepository(repoUrl: string, options: any = {}): Promise<any> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const requestData = {
      repoUrl,
      branch: options.branch || 'main',
      options: {
        aiProfile: options.aiProfile || 'mixed',
        includeTests: options.includeTests !== false,
        deepAnalysis: options.deepAnalysis !== false,
        ...options
      }
    }

    console.log('🔍 Sending GitHub analysis request:', requestData)

    const response = await fetch(`${this.baseUrl}/code-analysis/github`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to start repository analysis')
    }

    return data
  }
}

export const githubService = new GitHubService() 