// GitHub Service - Repository cloning and analysis
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

export class GitHubService {
  constructor() {
    this.tempDir = process.env.TEMP_DIR || '/tmp'
    // Parse MAX_REPO_SIZE (could be "500MB" or bytes) - default to 500MB in bytes
    const envSize = process.env.MAX_REPO_SIZE
    if (envSize && envSize.includes('MB')) {
      this.maxRepoSize = parseInt(envSize) * 1024 * 1024 // Convert MB to bytes
    } else {
      this.maxRepoSize = parseInt(envSize) || 500 * 1024 * 1024 // 500MB default
    }
    logger.info('GitHubService initialized:', {
      maxRepoSizeBytes: this.maxRepoSize,
      maxRepoSizeMB: Math.round(this.maxRepoSize / 1024 / 1024),
      envValue: process.env.MAX_REPO_SIZE
    })
  }

  /**
   * Validate GitHub repository URL
   */
  static validateRepoUrl(url) {
    const githubPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/
    const match = url.match(githubPattern)
    
    if (!match) {
      throw new Error('Invalid GitHub repository URL')
    }
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
      fullName: `${match[1]}/${match[2].replace('.git', '')}`
    }
  }

  /**
   * Get repository information from GitHub API
   */
  async getRepoInfo(owner, repo) {
    try {
      const token = process.env.GITHUB_TOKEN
      const headers = token ? { Authorization: `token ${token}` } : {}
      
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        timeout: 10000
      })
      
      const repoData = response.data
      
      // Check if repository is too large (GitHub API returns size in KB)
      const maxRepoSizeKB = this.maxRepoSize / 1024 // Convert bytes to KB
      if (repoData.size > maxRepoSizeKB) {
        throw new Error(`Repository too large: ${repoData.size}KB (max: ${maxRepoSizeKB}KB)`)
      }
      
      return {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        isPrivate: repoData.private,
        topics: repoData.topics || [],
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        cloneUrl: repoData.clone_url,
        htmlUrl: repoData.html_url
      }
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Repository not found or is private')
      }
      if (error.response?.status === 403) {
        throw new Error('API rate limit exceeded. Please provide a GitHub token.')
      }
      throw new Error(`Failed to fetch repository info: ${error.message}`)
    }
  }

  /**
   * Get repository information using user's access token (for private repos)
   */
  async getRepoInfoWithToken(owner, repo, accessToken) {
    try {
      const headers = {
        Authorization: `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeAnalyst-App'
      }
      
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        timeout: 10000
      })
      
      const repoData = response.data
      
      // Check if repository is too large (GitHub API returns size in KB)
      const maxRepoSizeKB = this.maxRepoSize / 1024 // Convert bytes to KB
      if (repoData.size > maxRepoSizeKB) {
        throw new Error(`Repository too large: ${repoData.size}KB (max: ${maxRepoSizeKB}KB)`)
      }
      
      return {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        isPrivate: repoData.private,
        topics: repoData.topics || [],
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        cloneUrl: repoData.clone_url,
        htmlUrl: repoData.html_url
      }
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Repository not found or you do not have access')
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden or API rate limit exceeded')
      }
      throw new Error(`Failed to fetch repository info: ${error.message}`)
    }
  }

  /**
   * Clone repository to temporary directory
   */
  async cloneRepository(repoUrl, analysisId) {
    try {
      const { owner, repo } = GitHubService.validateRepoUrl(repoUrl)
      const repoInfo = await this.getRepoInfo(owner, repo)
      
      const tempPath = path.join(this.tempDir, `codeanalyst-${analysisId}`)
      
      logger.info(`📦 Cloning repository: ${repoInfo.fullName}`, {
        analysisId,
        size: repoInfo.size,
        language: repoInfo.language
      })
      
      // Clone with depth 1 for faster downloads
      const cloneCommand = `git clone --depth 1 --single-branch "${repoUrl}" "${tempPath}"`
      await execAsync(cloneCommand, { timeout: 120000 }) // 2 minute timeout
      
      // Get repository stats
      const stats = await this.getRepositoryStats(tempPath)
      
      return {
        tempPath,
        repoInfo,
        stats,
        success: true
      }
    } catch (error) {
      logger.error('Failed to clone repository:', error, { analysisId, repoUrl })
      throw new Error(`Repository clone failed: ${error.message}`)
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repoPath) {
    try {
      const stats = {
        totalFiles: 0,
        totalLines: 0,
        languages: {},
        directories: 0,
        largestFile: { name: '', size: 0 },
        fileTypes: {}
      }
      
      await this.scanDirectory(repoPath, stats)
      
      return stats
    } catch (error) {
      logger.error('Failed to get repository stats:', error)
      throw error
    }
  }

  /**
   * Recursively scan directory for statistics
   */
  async scanDirectory(dirPath, stats, basePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        // Skip .git and node_modules
        if (entry.name.startsWith('.git') || entry.name === 'node_modules') {
          continue
        }
        
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          stats.directories++
          await this.scanDirectory(fullPath, stats, path.join(basePath, entry.name))
        } else if (entry.isFile()) {
          const fileStat = await fs.stat(fullPath)
          stats.totalFiles++
          
          // Track largest file
          if (fileStat.size > stats.largestFile.size) {
            stats.largestFile = {
              name: path.join(basePath, entry.name),
              size: fileStat.size
            }
          }
          
          // Track file types
          const ext = path.extname(entry.name).toLowerCase()
          stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1
          
          // Count lines for text files
          if (this.isTextFile(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8')
              const lines = content.split('\n').length
              stats.totalLines += lines
              
              // Track languages
              const language = this.getLanguageFromExtension(ext)
              if (language) {
                stats.languages[language] = (stats.languages[language] || 0) + lines
              }
            } catch (error) {
              // Skip files that can't be read as text
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning directory:', error)
    }
  }

  /**
   * Check if file is a text file
   */
  isTextFile(extension) {
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
      '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
      '.md', '.txt', '.rst', '.tex', '.sql', '.sh', '.bash', '.zsh', '.fish',
      '.dockerfile', '.makefile', '.gradle', '.maven', '.sbt'
    ]
    
    return textExtensions.includes(extension)
  }

  /**
   * Get programming language from file extension
   */
  getLanguageFromExtension(extension) {
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C',
      '.hpp': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Shell',
      '.zsh': 'Shell',
      '.fish': 'Shell'
    }
    
    return languageMap[extension]
  }

  /**
   * Get repository files for analysis
   */
  async getRepositoryFiles(repoPath, maxFiles = 1000) {
    try {
      const files = []
      await this.collectFiles(repoPath, files, maxFiles)
      
      return files.slice(0, maxFiles)
    } catch (error) {
      logger.error('Failed to get repository files:', error)
      throw error
    }
  }

  /**
   * Collect files recursively
   */
  async collectFiles(dirPath, files, maxFiles, basePath = '') {
    if (files.length >= maxFiles) return
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (files.length >= maxFiles) break
        
        // Skip certain directories and files
        if (this.shouldSkipPath(entry.name)) {
          continue
        }
        
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.join(basePath, entry.name)
        
        if (entry.isDirectory()) {
          await this.collectFiles(fullPath, files, maxFiles, relativePath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          
          if (this.isTextFile(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8')
              const stat = await fs.stat(fullPath)
              
              files.push({
                path: relativePath,
                name: entry.name,
                extension: ext,
                size: stat.size,
                content: content.slice(0, 100000), // Limit content to 100KB
                lines: content.split('\n').length,
                language: this.getLanguageFromExtension(ext)
              })
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error collecting files:', error)
    }
  }

  /**
   * Check if path should be skipped
   */
  shouldSkipPath(name) {
    const skipPatterns = [
      '.git',
      'node_modules',
      '.npm',
      '.yarn',
      'bower_components',
      'vendor',
      '__pycache__',
      '.pytest_cache',
      'venv',
      'env',
      '.env',
      'build',
      'dist',
      'target',
      '.gradle',
      '.mvn',
      'coverage',
      '.nyc_output',
      '.sass-cache',
      '.DS_Store',
      'Thumbs.db'
    ]
    
    return skipPatterns.some(pattern => name.includes(pattern))
  }

  /**
   * Fetch repository content via GitHub API (no cloning needed!)
   */
  async fetchRepositoryContent(owner, repo, accessToken, branch = 'main') {
    try {
      logger.info(`📡 Fetching repository content via API: ${owner}/${repo}`)
      
      const headers = {
        'User-Agent': 'CodeAnalyst-App',
        'Accept': 'application/vnd.github.v3+json'
      }
      
      if (accessToken) {
        headers['Authorization'] = `token ${accessToken}`
      }

      // Get repository tree (file structure)
      const treeResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
      )

      const files = treeResponse.data.tree.filter(item => item.type === 'blob')
      logger.info(`📁 Found ${files.length} files in repository`)

      // Fetch content for analysis-relevant files (limit to reasonable size)
      const relevantFiles = files.filter(file => 
        this.isAnalysisRelevantFile(file.path) && 
        file.size && file.size < 1024 * 1024 // Skip files larger than 1MB
      ).slice(0, 50) // Increased from 100 to prevent API rate limits

      logger.info(`🔍 Found ${files.length} total files`)
      logger.info(`🔍 Filtered to ${relevantFiles.length} relevant files`)
      logger.info(`📁 Sample files: ${files.slice(0, 10).map(f => f.path).join(', ')}`)
      logger.info(`📁 All files: ${files.map(f => `${f.path} (${f.size}B)`).join(', ')}`)
      logger.info(`🚫 Excluded files: ${files.filter(f => !this.isAnalysisRelevantFile(f.path)).map(f => f.path).join(', ')}`)

      const fileContents = []
      for (const file of relevantFiles) {
        try {
          const contentResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
            { headers }
          )

          if (contentResponse.data.content) {
            const content = Buffer.from(contentResponse.data.content, 'base64').toString('utf-8')
            fileContents.push({
              path: file.path,
              content: content,
              size: file.size,
              type: this.getFileType(file.path)
            })
          }
        } catch (error) {
          logger.warn(`Failed to fetch content for ${file.path}: ${error.message}`)
        }
      }

      return {
        files: fileContents,
        totalFiles: files.length,
        analyzedFiles: fileContents.length,
        repository: {
          owner,
          repo,
          branch
        }
      }

    } catch (error) {
      logger.error(`Failed to fetch repository content: ${error.message}`)
      throw new Error(`Repository content fetch failed: ${error.message}`)
    }
  }

  /**
   * Check if file is relevant for code analysis
   */
  isAnalysisRelevantFile(filePath) {
    // Skip binary files and common non-code directories
    const skipPatterns = [
      'node_modules/', 'vendor/', '.git/', 'dist/', 'build/', 'target/',
      '.exe', '.dll', '.so', '.dylib', '.bin', '.png', '.jpg', '.gif', '.ico',
      '.zip', '.tar', '.gz', '.pdf', '.doc', '.docx'
    ]
    
    for (const pattern of skipPatterns) {
      if (filePath.includes(pattern)) {
        return false
      }
    }

    const relevantExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', '.cpp', '.c', '.h',
      '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs',
      '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
      '.md', '.txt', '.dockerfile', '.sql', '.sh', '.bash', '.ps1',
      '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte'
    ]

    const ext = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath).toLowerCase()
    
    // Include important config files
    const importantFiles = [
      'package.json', 'composer.json', 'requirements.txt', 'gemfile',
      'pom.xml', 'build.gradle', 'cargo.toml', 'go.mod', 'makefile',
      'dockerfile', '.gitignore', 'readme.md', 'license', 'readme'
    ]

    // If no extension and not an important file, include it anyway for analysis (might be a script)
    if (!ext && !importantFiles.includes(fileName)) {
      return filePath.length < 50 // Include short filename files (likely scripts)
    }

    return relevantExtensions.includes(ext) || importantFiles.includes(fileName)
  }

  /**
   * Get file type for analysis
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const typeMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.json': 'config',
      '.yaml': 'config',
      '.yml': 'config',
      '.xml': 'config',
      '.md': 'documentation',
      '.html': 'web',
      '.css': 'web',
      '.scss': 'web'
    }
    return typeMap[ext] || 'other'
  }

  /**
   * Clean up temporary repository
   */
  async cleanup(tempPath) {
    try {
      if (tempPath && await fs.access(tempPath).then(() => true).catch(() => false)) {
        await fs.rm(tempPath, { recursive: true, force: true })
        logger.info(`🧹 Cleaned up repository: ${tempPath}`)
      }
    } catch (error) {
      logger.error('Failed to cleanup repository:', error)
    }
  }

  /**
   * Get GitHub API rate limit status
   */
  async getRateLimitStatus() {
    try {
      const token = process.env.GITHUB_TOKEN
      const headers = token ? { Authorization: `token ${token}` } : {}
      
      const response = await axios.get('https://api.github.com/rate_limit', {
        headers,
        timeout: 5000
      })
      
      return response.data.rate
    } catch (error) {
      return { limit: 0, remaining: 0, reset: 0 }
    }
  }

  /**
   * Get user's repositories using their access token
   */
  static async getUserRepositories(accessToken, options = {}) {
    try {
      const { 
        per_page = 50, 
        page = 1, 
        sort = 'updated', 
        type = 'owner' 
      } = options

      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodeAnalyst-App'
        },
        params: {
          per_page,
          page,
          sort,
          type
        },
        timeout: 10000
      })

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        language: repo.language,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        default_branch: repo.default_branch
      }))

    } catch (error) {
      logger.error('Failed to get user repositories:', error)
      throw new Error(`Failed to fetch repositories: ${error.message}`)
    }
  }
}

export default GitHubService 