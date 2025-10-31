import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Bars3Icon, 
  FolderIcon, 
  FolderOpenIcon, 
  DocumentIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  CodeBracketIcon,
  PlayIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip'
import { MessageRenderer } from '../../components/MessageRenderer'
import { ModuleAccessGuard } from '../../components/ModuleAccessGuard'
import CodePreview from './AutoProgrammer/components/CodePreview'
import { isWebProject, detectProjectType } from '../../utils/projectDetector'

// Types
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  codeChanges?: CodeChange[]
}

interface CodeChange {
  id: string
  file: string
  type: 'create' | 'modify' | 'delete'
  content: string
  approved: boolean
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
  functions?: CodeFunction[]
  size?: number
}

interface CodeFunction {
  name: string
  type: 'function' | 'class' | 'method'
  startLine: number
  endLine: number
  signature: string
}

function AutoProgrammerContent() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'files' | 'preview' | 'changes'>('files')
  const [showPreview, setShowPreview] = useState(false)
  const [apiEndpoints, setApiEndpoints] = useState<Array<{method: string, path: string, description?: string}>>([])
  
  // Website preview modal state
  const [showWebsitePreview, setShowWebsitePreview] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')
  
  // ZIP upload state
  const [inputMethod, setInputMethod] = useState<'github' | 'zip'>('github')
  const [uploadedFiles, setUploadedFiles] = useState<FileNode[]>([])

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const projectPreviewRef = useRef<HTMLIFrameElement>(null)

  // Function definitions moved to top to avoid hoisting issues
  const getProjectName = (analysis: any) => {
    if (analysis.sourceReference) {
      try {
        const parsed = JSON.parse(analysis.sourceReference)
        return parsed.repositoryName || parsed.repo || 'Unknown Project'
      } catch {
        // If it's a URL, extract just the repo name
        if (analysis.sourceReference.includes('github.com/')) {
          const urlParts = analysis.sourceReference.split('/')
          return urlParts[urlParts.length - 1] || 'Unknown Project'
        }
        return analysis.sourceReference || 'Unknown Project'
      }
    }
    return analysis.metadata?.name || analysis.name || 'Unknown Project'
  }

  const getProjectUrl = (analysis: any) => {
    if (analysis.sourceReference) {
      try {
        const parsed = JSON.parse(analysis.sourceReference)
        return parsed.url || parsed.repositoryUrl || 'Unknown URL'
      } catch {
        return analysis.sourceReference || 'Unknown URL'
      }
    }
    return analysis.metadata?.url || 'Unknown URL'
  }

  const generateRecommendations = (results: any): string => {
    if (!results) return 'No recommendations available.'
    
    const recommendations = []
    
    // Pull from maintenance needs
    if (results.maintenanceNeeds?.aiRecommendations) {
      const aiRecs = results.maintenanceNeeds.aiRecommendations.slice(0, 3).map((rec: any) => 
        typeof rec === 'string' ? rec : (rec.description || rec.message || rec.title || JSON.stringify(rec))
      )
      recommendations.push(...aiRecs)
    }
    
    // Pull from security issues
    if (results.riskAssessment?.securityIssues) {
      recommendations.push(`🔒 Security: ${results.riskAssessment.securityIssues.slice(0, 1)[0] || 'Review security practices'}`)
    }
    
    // Add test coverage if low
    if (results.testCoveragePercentage !== undefined && results.testCoveragePercentage !== null) {
      const coverage = typeof results.testCoveragePercentage === 'number' && !isNaN(results.testCoveragePercentage) 
        ? results.testCoveragePercentage.toFixed(2) 
        : String(results.testCoveragePercentage || '0.00')
      if (parseFloat(coverage) < 50) {
        recommendations.push(`🧪 Testing: Improve test coverage (currently ${coverage}%)`)
      }
    }
    
    // Add technical debt if high
    if (results.technicalDebtPercentage !== undefined && results.technicalDebtPercentage !== null) {
      const debt = typeof results.technicalDebtPercentage === 'number' && !isNaN(results.technicalDebtPercentage)
        ? results.technicalDebtPercentage.toFixed(2) 
        : String(results.technicalDebtPercentage || '0.00')
      if (parseFloat(debt) > 30) {
        recommendations.push(`⚡ Refactoring: Reduce technical debt (currently ${debt}%)`)
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('1. 🔧 Code Quality: Review and improve code quality metrics')
      recommendations.push('2. 📚 Documentation: Add comprehensive documentation')
      recommendations.push('3. 🧪 Testing: Implement comprehensive test coverage')
    }
    
    return recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')
  }

  const extractFunctions = (content: string, extension: string): CodeFunction[] => {
    const functions: CodeFunction[] = []
    
    if (!content) return functions
    
    const lines = content.split('\n')
    
    try {
      if (extension === '.js' || extension === '.ts' || extension === '.jsx' || extension === '.tsx') {
        lines.forEach((line, index) => {
          // Function declarations
          const funcMatch = line.match(/^\s*(export\s+)?(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
          if (funcMatch) {
            functions.push({
              name: funcMatch[3],
              type: 'function',
              startLine: index + 1,
              endLine: index + 1,
              signature: line.trim()
            })
          }
          
          // Arrow functions
          const arrowMatch = line.match(/^\s*(export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(\([^)]*\))?\s*=>\s*/)
          if (arrowMatch) {
            functions.push({
              name: arrowMatch[2],
              type: 'function',
              startLine: index + 1,
              endLine: index + 1,
              signature: line.trim()
            })
          }
          
          // Class declarations
          const classMatch = line.match(/^\s*(export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*/)
          if (classMatch) {
            functions.push({
              name: classMatch[2],
              type: 'class',
              startLine: index + 1,
              endLine: index + 1,
              signature: line.trim()
            })
          }
          
          // Methods
          const methodMatch = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/)
          if (methodMatch && !funcMatch && !arrowMatch && !classMatch) {
            functions.push({
              name: methodMatch[1],
              type: 'method',
              startLine: index + 1,
              endLine: index + 1,
              signature: line.trim()
            })
          }
        })
      }
    } catch (error) {
      console.error('Error extracting functions:', error)
    }
    
    return functions
  }

  const buildFileTree = (fileStructure: any): FileNode[] => {
    if (!fileStructure) return []
    
    if (Array.isArray(fileStructure)) {
      if (fileStructure.length > 0 && typeof fileStructure[0] === 'object' && fileStructure[0].path) {
        return buildTreeFromFlatList(fileStructure)
      }
      return fileStructure
    }
    
    if (typeof fileStructure === 'object') {
      return Object.entries(fileStructure).map(([key, value]: [string, any]) => ({
        name: key,
        path: key,
        type: typeof value === 'object' && !value.content ? 'folder' : 'file',
        children: typeof value === 'object' && !value.content ? buildFileTree(value) : undefined,
        content: value.content,
        functions: value.content ? extractFunctions(value.content, value.extension || '') : []
      }))
    }
    
    return []
  }

  const buildTreeFromFlatList = (files: any[]): FileNode[] => {
    const tree: FileNode[] = []
    const pathMap = new Map<string, FileNode>()
    
    files.forEach((file: any) => {
      const parts = file.path.split('/')
      let currentPath = ''
      
      parts.forEach((part: string, index: number) => {
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part
        
        if (!pathMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: index === parts.length - 1 ? undefined : [],
            content: index === parts.length - 1 ? file.content : undefined,
            functions: index === parts.length - 1 ? extractFunctions(file.content || '', file.extension || '') : undefined,
            size: file.size
          }
          
          pathMap.set(currentPath, node)
          
          if (parentPath) {
            const parent = pathMap.get(parentPath)
            if (parent && parent.children) {
              parent.children.push(node)
            }
          } else {
            tree.push(node)
          }
        }
      })
    })
    
    return tree
  }

  useEffect(() => {
    fetchAnalyses()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate preview when project is selected
  useEffect(() => {
    if (!selectedProject || !fileTree.length) return
    
    const projectType = detectProjectType(selectedProject)
    
    if (projectType === 'web') {
      // Generate HTML preview for web projects
      const html = generatePreviewHTML(fileTree, projectType)
      if (projectPreviewRef.current) {
        const iframe = projectPreviewRef.current
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(html)
          doc.close()
        }
      }
    } else if (projectType === 'backend') {
      // Extract API endpoints for backend projects
      const endpoints = extractAPIEndpoints(fileTree)
      setApiEndpoints(endpoints)
    }
  }, [selectedProject, fileTree])

  const fetchAnalyses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      
      const response = await fetch(`${baseUrl}/code-analysis/history`, {
        headers: {
          'Authorization': `Bearer ${token || 'dev-token-autoprogrammer'}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalyses(data.analyses || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
      toast.error('Failed to load projects')
    }
  }

  const handleProjectSelect = async (analysis: any) => {
    setSelectedProject(analysis)
    
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      
      const response = await fetch(`${baseUrl}/code-analysis/${analysis.id}`, {
        headers: {
          'Authorization': `Bearer ${token || 'dev-token-autoprogrammer'}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Full analysis data:', data)
        
        if (data.success && data.analysis) {
          console.log('Analysis structure:', data.analysis)
          let fileStructure = null
          
          // Check for files in different possible locations - data is nested under results
          if (data.analysis.results?.technicalStructure?.files) {
            fileStructure = data.analysis.results.technicalStructure.files
          } else if (data.analysis.results?.technicalStructure?.fileStructure) {
            fileStructure = data.analysis.results.technicalStructure.fileStructure
          } else if (data.analysis.results?.systemOverview?.files) {
            fileStructure = data.analysis.results.systemOverview.files
          } else if (data.analysis.results?.systemOverview?.fileStructure) {
            fileStructure = data.analysis.results.systemOverview.fileStructure
          } else if (data.analysis.results?.staticAnalysisResults?.files) {
            fileStructure = data.analysis.results.staticAnalysisResults.files
          }
          
          console.log('Results:', data.analysis.results)
          console.log('Technical structure:', data.analysis.results?.technicalStructure)
          console.log('System overview:', data.analysis.results?.systemOverview)
          console.log('File structure found:', fileStructure)
          
          // If no file structure found in existing analysis, try to fetch it from GitHub
          if (!fileStructure && analysis.sourceType === 'github') {
            console.log('No file structure found, attempting to fetch from GitHub...')
            try {
              const githubUrl = getProjectUrl(analysis)
              if (githubUrl && githubUrl !== 'Unknown URL') {
                const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
                if (urlMatch) {
                  const [, owner, repo] = urlMatch
                  console.log(`Fetching file structure for ${owner}/${repo}`)
                  
                  // Call backend to fetch file structure
                  const fileResponse = await fetch(`${baseUrl}/code-analysis/github/files`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token || 'dev-token-autoprogrammer'}`,
                      'Content-Type': 'application/json',
                      'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                      owner,
                      repo,
                      branch: 'main'
                    })
                  })
                  
                  if (fileResponse.ok) {
                    const fileData = await fileResponse.json()
                    if (fileData.success && fileData.files) {
                      fileStructure = fileData.files
                      console.log('Successfully fetched file structure:', fileStructure.length, 'files')
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Failed to fetch file structure from GitHub:', error)
            }
          }
          
          if (fileStructure) {
            const tree = buildFileTree(fileStructure)
            console.log('Built file tree:', tree)
            setFileTree(tree)
            setExpandedFolders(new Set(['src', 'components', 'pages', 'utils', 'lib']))
            
            // Update the selected project with full results
            setSelectedProject({ ...analysis, results: data.analysis.results })
            
            // Generate recommendations based on actual analysis data
            const recommendations = generateRecommendations(data.analysis.results)
            
            // Send initial context message with actual recommendations
            const contextMessage: ChatMessage = {
              role: 'assistant',
              content: `Hey! I'm your AI coding assistant. I've analyzed your **${getProjectName(analysis)}** codebase and I'm ready to help you improve it.

**📊 Project Analysis:**
• **Files:** ${analysis.totalFiles || fileStructure.length || 0} files analyzed  
• **Lines of Code:** ${analysis.totalLines?.toLocaleString() || 'N/A'}
• **Quality Score:** ${analysis.codeQualityScore || 'N/A'}/100
• **Languages:** ${analysis.languages?.join(', ') || 'N/A'}

**🎯 Based on your actual code, here's what I can help you with:**

${recommendations}

I can analyze your actual functions, suggest specific improvements, write tests for your components, and help refactor complex code. What would you like to work on first?`,
              timestamp: new Date()
            }

            setMessages([contextMessage])
          } else {
            // Fallback if no file structure - show recommendations anyway
            const recommendations = generateRecommendations(data.analysis.results)
            
            const basicMessage: ChatMessage = {
              role: 'assistant',
              content: `Hey! I've loaded your project **${getProjectName(analysis)}**.

**📊 Project Analysis:**
• **Repository:** ${getProjectUrl(analysis)}
• **Files:** ${analysis.totalFiles || 0} files
• **Quality Score:** ${analysis.codeQualityScore || 'N/A'}/100

**🎯 Based on your analysis, here's what I can help with:**

${recommendations}

The file structure isn't available for this analysis, but I can still help you with code improvements, architecture suggestions, and answer questions about your project. What would you like to work on?`,
              timestamp: new Date()
            }
            setMessages([basicMessage])
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load full analysis data:', error)
      toast.error('Failed to load project structure')
    }
    toast.success(`Project ${getProjectName(analysis)} loaded!`)
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
      'Authorization': `Bearer ${token || 'dev-token-autoprogrammer'}`,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    }
  }

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInput('')
    setIsLoading(true)

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          project: selectedProject ? {
            name: getProjectName(selectedProject),
            url: getProjectUrl(selectedProject),
            fileStructure: fileTree,
            selectedFile: selectedFile ? {
              name: selectedFile.name,
              path: selectedFile.path,
              content: selectedFile.content,
              functions: selectedFile.functions
            } : null,
            codeQuality: selectedProject.codeQualityScore,
            languages: selectedProject.languages,
            totalFiles: selectedProject.totalFiles
          } : null
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('0:{"type":"text-delta"')) {
            try {
              const data = JSON.parse(line.substring(2))
              if (data.textDelta) {
                assistantMessage += data.textDelta
                
                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = assistantMessage
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date()
                    })
                  }
                  
                  return newMessages
                })
              }
            } catch (e) {
              console.warn('Failed to parse delta:', e)
            }
          }
        }
      }

      const codeChanges = parseCodeChanges(assistantMessage)
      if (codeChanges.length > 0) {
        setCodeChanges(prev => [...prev, ...codeChanges])
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const parseCodeChanges = (content: string): CodeChange[] => {
    const changes: CodeChange[] = []
    
    // Regex to find FILE: ... ACTION: ... CODE: ... blocks
    const fileRegex = /FILE:\s*(.+?)\nACTION:\s*(create|modify|delete)\nCODE:\s*```[\w]*\n([\s\S]+?)```/g
    
    let match
    while ((match = fileRegex.exec(content)) !== null) {
      changes.push({
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: match[1].trim(),
        type: match[2] as 'create' | 'modify' | 'delete',
        content: match[3].trim(),
        approved: false
      })
    }
    
    return changes
  }

  const handleApplyChanges = (changes: CodeChange[]) => {
    // Apply changes to file tree
    const updatedTree = applyChangesToTree(fileTree, changes)
    setFileTree(updatedTree)
    
    // Mark changes as approved
    setCodeChanges(prev => prev.map(c => ({ ...c, approved: true })))
    
    toast.success(`Applied ${changes.length} change(s) successfully!`)
    setShowPreview(false)
  }

  const applyChangesToTree = (tree: FileNode[], changes: CodeChange[]): FileNode[] => {
    // Create a map of file paths to changes
    const changeMap = new Map<string, CodeChange>()
    changes.forEach(change => changeMap.set(change.file, change))
    
    // Recursively update the tree
    const updateNode = (node: FileNode): FileNode => {
      if (node.type === 'file' && changeMap.has(node.path)) {
        const change = changeMap.get(node.path)!
        if (change.type === 'modify' || change.type === 'create') {
          return { ...node, content: change.content }
        }
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode).filter(child => {
            // Remove deleted files
            if (child.type === 'file' && changeMap.has(child.path)) {
              const change = changeMap.get(child.path)!
              return change.type !== 'delete'
            }
            return true
          })
        }
      }
      
      return node
    }
    
    return tree.map(updateNode)
  }

  const approveChange = (changeId: string) => {
    setCodeChanges(prev => 
      prev.map(change => 
        change.id === changeId ? { ...change, approved: true } : change
      )
    )
  }

  const commitChanges = async () => {
    const approvedChanges = codeChanges.filter(change => change.approved)
    if (approvedChanges.length === 0) {
      toast.error('No approved changes to commit')
      return
    }
    
    toast.success(`Simulated commit of ${approvedChanges.length} changes to GitHub`)
    setCodeChanges([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const selectFile = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node)
      setActiveTab('preview')
    }
  }

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'folder') {
      return expandedFolders.has(node.path) ? FolderOpenIcon : FolderIcon
    }
    return DocumentIcon
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer text-sm ${
            selectedFile?.path === node.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path)
            } else {
              selectFile(node)
            }
          }}
        >
          {node.type === 'folder' && (
            expandedFolders.has(node.path) ? (
              <ChevronDownIcon className="h-4 w-4 mr-1 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 mr-1 text-gray-400" />
            )
          )}
          {React.createElement(getFileIcon(node), { 
            className: `h-4 w-4 mr-2 ${node.type === 'folder' ? 'text-blue-500' : 'text-gray-500'}` 
          })}
          <span className="truncate">{node.name}</span>
          {node.type === 'file' && node.functions && node.functions.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">
              {node.functions.length} fn
            </span>
          )}
        </div>
        
        {node.type === 'folder' && node.children && expandedFolders.has(node.path) && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleFileClick = (filePath: string) => {
    // Try to find the file in the file tree and select it
    const findFileInTree = (nodes: FileNode[], path: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path || node.name === path) {
          return node
        }
        if (node.children) {
          const found = findFileInTree(node.children, path)
          if (found) return found
        }
      }
      return null
    }

    if (fileTree) {
      const foundFile = findFileInTree(fileTree, filePath)
      if (foundFile && foundFile.type === 'file') {
        setSelectedFile(foundFile)
        toast.success(`Opened ${foundFile.name}`)
      } else {
        // If not found, try to load the file content
        toast.info(`Attempting to open ${filePath}...`)
        // You could implement file loading logic here
      }
    }
  }

  // Helper functions for preview generation
  const flattenFiles = (files: FileNode[]): FileNode[] => {
    const result: FileNode[] = []
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') result.push(node)
        if (node.children) traverse(node.children)
      }
    }
    traverse(files)
    return result
  }

  const findMainHTMLFile = (files: FileNode[]): FileNode | null => {
    const flatFiles = flattenFiles(files)
    return flatFiles.find(f => f.path.toLowerCase().endsWith('index.html')) ||
           flatFiles.find(f => f.path.toLowerCase().endsWith('.html')) ||
           null
  }

  const findFilesByExtension = (files: FileNode[], extensions: string[]): FileNode[] => {
    const flatFiles = flattenFiles(files)
    return flatFiles.filter(f => extensions.some(ext => f.path.toLowerCase().endsWith(ext)))
  }

  const generatePlaceholderHTML = (message: string): string => {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Preview</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f3f4f6;">
<div style="text-align:center;color:#6b7280;"><h1 style="font-size:1.5rem;margin-bottom:0.5rem;">Preview</h1><p>${message}</p></div>
</body></html>`
  }

  const generatePreviewHTML = (files: FileNode[], projectType: any): string => {
    const flatFiles = flattenFiles(files)
    
    // Check if this is a React/Vite project
    const isReactProject = flatFiles.some(f => 
      f.path.includes('package.json') && f.content?.includes('"react"')
    ) || flatFiles.some(f => f.path.includes('vite.config'))
    
    if (isReactProject) {
      // For React projects, show a helpful message with deployment link
      const deploymentUrl = selectedProject?.sourceReference || ''
      const githubUrl = deploymentUrl.includes('github.com') ? deploymentUrl : ''
      
      return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>React Project Preview</title>
<style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .container { background: white; border-radius: 12px; padding: 2rem; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
  h1 { font-size: 1.5rem; color: #1f2937; margin-bottom: 1rem; }
  p { color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  .info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: left; }
  .info-title { font-weight: 600; color: #1e40af; margin-bottom: 0.5rem; font-size: 0.875rem; }
  .info-text { color: #1e3a8a; font-size: 0.875rem; line-height: 1.5; }
  .btn { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 1rem; font-weight: 500; transition: background 0.2s; }
  .btn:hover { background: #2563eb; }
  .note { font-size: 0.75rem; color: #9ca3af; margin-top: 1rem; }
</style>
</head>
<body>
  <div class="container">
    <div class="icon">⚛️</div>
    <h1>React Project Detected</h1>
    <p>This is a React/Vite project that requires compilation and a build process to preview.</p>
    
    <div class="info">
      <div class="info-title">💡 Why can't I see the preview?</div>
      <div class="info-text">React projects use JSX and need to be compiled to JavaScript. The source code can't be rendered directly in an iframe.</div>
    </div>
    
    <div class="info">
      <div class="info-title">🎯 How to preview this project:</div>
      <div class="info-text">
        1. Deploy it to Vercel, Netlify, or GitHub Pages<br>
        2. Run it locally with <code>npm run dev</code><br>
        3. Use the "Files" tab to explore the code structure
      </div>
    </div>
    
    ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="btn">View on GitHub →</a>` : ''}
    
    <div class="note">Use the "Files" tab to browse components and the AI chat to make changes!</div>
  </div>
</body></html>`
    }
    
    // For simple HTML projects
    const htmlFile = findMainHTMLFile(files)
    if (!htmlFile) return generatePlaceholderHTML('No HTML file found in project')
    
    const cssFiles = findFilesByExtension(files, ['.css', '.scss'])
    const cssContent = cssFiles.map(f => f.content || '').join('\n')
    
    let html = htmlFile.content || ''
    if (cssContent) {
      html = html.replace('</head>', `<style>${cssContent}</style></head>`)
    }
    
    return html
  }

  const extractAPIEndpoints = (files: FileNode[]): Array<{method: string, path: string, description?: string}> => {
    const endpoints: Array<{method: string, path: string, description?: string}> = []
    const flatFiles = flattenFiles(files)
    
    // Look for route files (Express, NestJS, etc.)
    const routeFiles = flatFiles.filter(f => 
      f.path.includes('route') || 
      f.path.includes('controller') || 
      f.path.includes('api')
    )
    
    routeFiles.forEach(file => {
      if (!file.content) return
      
      // Extract Express routes: router.get('/path', ...)
      const expressRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g
      let match
      while ((match = expressRegex.exec(file.content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          description: `From ${file.name}`
        })
      }
      
      // Extract NestJS decorators: @Get('/path')
      const nestRegex = /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]+)['"]\)/g
      while ((match = nestRegex.exec(file.content)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          description: `From ${file.name}`
        })
      }
    })
    
    return endpoints
  }
  
  // Helper function to check if file should be included
  const shouldIncludeFile = (path: string): boolean => {
    const excludePatterns = ['node_modules/', '.git/', 'dist/', 'build/', '.DS_Store', '__MACOSX']
    return !excludePatterns.some(pattern => path.includes(pattern))
  }
  
  // ZIP upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const files: FileNode[] = []
    
    try {
      for (const file of acceptedFiles) {
        if (file.name.endsWith('.zip')) {
          const zip = new JSZip()
          const zipContent = await zip.loadAsync(file)
          
          for (const [path, zipEntry] of Object.entries(zipContent.files)) {
            if (!zipEntry.dir && shouldIncludeFile(path)) {
              const content = await zipEntry.async('string')
              files.push({
                name: path.split('/').pop() || path,
                path: path,
                type: 'file',
                content: content
              })
            }
          }
        }
      }
      
      setUploadedFiles(files)
      setFileTree(files)
      setSelectedProject({
        id: 'uploaded-zip',
        name: 'Uploaded ZIP Project',
        type: 'zip'
      })
      toast.success(`Uploaded ${files.length} files successfully`)
    } catch (error) {
      console.error('ZIP upload error:', error)
      toast.error('Failed to process ZIP file')
    }
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'application/zip': ['.zip'] }
  })
  
  // Auto-select uploaded project when files are uploaded
  useEffect(() => {
    if (inputMethod === 'zip' && uploadedFiles.length > 0) {
      setFileTree(uploadedFiles)
      setSelectedProject({
        id: 'uploaded-zip',
        name: 'Uploaded ZIP Project',
        type: 'zip'
      })
    }
  }, [inputMethod, uploadedFiles])
  
  // Helper functions for changes management
  const getCurrentFileContent = (filePath: string): string => {
    const flatFiles = flattenFiles(fileTree)
    const file = flatFiles.find(f => f.path === filePath)
    return file?.content || '// New file'
  }
  
  const applySingleChange = (changeId: string) => {
    const change = codeChanges.find(c => c.id === changeId)
    if (!change) return
    
    const updatedTree = applyChangeToTree(fileTree, change)
    setFileTree(updatedTree)
    setCodeChanges(prev => prev.filter(c => c.id !== changeId))
    
    toast.success(`Applied changes to ${change.file}`)
  }
  
  const applyAllChanges = () => {
    let updatedTree = fileTree
    codeChanges.forEach(change => {
      updatedTree = applyChangeToTree(updatedTree, change)
    })
    
    setFileTree(updatedTree)
    setCodeChanges([])
    
    toast.success(`Applied ${codeChanges.length} changes`)
  }
  
  const rejectChange = (changeId: string) => {
    setCodeChanges(prev => prev.filter(c => c.id !== changeId))
    toast.success('Change rejected')
  }
  
  const applyChangeToTree = (tree: FileNode[], change: CodeChange): FileNode[] => {
    return tree.map(node => {
      if (node.type === 'file' && node.path === change.file) {
        return { ...node, content: change.content }
      }
      if (node.type === 'folder' && node.children) {
        return { ...node, children: applyChangeToTree(node.children, change) }
      }
      return node
    })
  }
  
  const generatePreviewWithChanges = (tree: FileNode[], changes: CodeChange[]): string => {
    let previewTree = JSON.parse(JSON.stringify(tree))
    changes.forEach(change => {
      previewTree = applyChangeToTree(previewTree, change)
    })
    return generatePreviewHTML(previewTree, detectProjectType(previewTree))
  }
  
  const downloadProjectAsZip = async () => {
    try {
      const zip = new JSZip()
      
      const addFilesToZip = (nodes: FileNode[], folder: JSZip | null = null) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content) {
            const target = folder || zip
            target.file(node.path, node.content)
          } else if (node.type === 'folder' && node.children) {
            const newFolder = folder ? folder.folder(node.name) : zip.folder(node.name)
            if (newFolder) {
              addFilesToZip(node.children, newFolder)
            }
          }
        })
      }
      
      addFilesToZip(fileTree)
      
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${getProjectName(selectedProject)}-updated.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Project downloaded successfully!')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download project')
    }
  }

  return (
    <div className="h-screen max-h-screen bg-gray-50 flex overflow-hidden">
      {/* Project Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm`}>
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {analyses.map((analysis) => (
                          <div
                key={analysis.id}
                onClick={() => handleProjectSelect(analysis)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                  selectedProject?.id === analysis.id
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
              <div className="font-medium text-gray-900 mb-2">
                {getProjectName(analysis)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{analysis.totalFiles || 0} files</span>
                <span className="text-green-500 font-medium">
                  {analysis.codeQualityScore || 'N/A'}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white" style={{ height: '100vh', maxHeight: '100vh', minHeight: '100vh' }}>
          {/* Header */}
          <div className="px-6 py-2 border-b border-gray-200 bg-white" style={{ flexShrink: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <Bars3Icon className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">AI Coding Assistant</h1>
                  {selectedProject && (
                    <p className="text-sm text-gray-500">{getProjectName(selectedProject)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedProject && (
                  <button
                    onClick={downloadProjectAsZip}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Download ZIP</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 pt-3" style={{ minHeight: 0, maxHeight: 'calc(100vh - 120px)' }}>
            {!selectedProject ? (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-gray-400 mb-3">
                    <CodeBracketIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AutoProgrammer</h3>
                  <p className="text-gray-500 mb-6">Choose how you want to start coding with AI</p>
                </div>
                
                {/* Input Method Selection */}
                <div className="card p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Input Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      className={`p-4 border rounded-lg transition-colors text-left ${
                        inputMethod === 'github' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setInputMethod('github')}
                    >
                      <div className="font-medium">GitHub Project</div>
                      <div className="text-sm text-gray-600 mt-1">Select from analyzed projects</div>
                    </button>
                    <button
                      className={`p-4 border rounded-lg transition-colors text-left ${
                        inputMethod === 'zip' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setInputMethod('zip')}
                    >
                      <div className="font-medium">ZIP Upload</div>
                      <div className="text-sm text-gray-600 mt-1">Upload project files directly</div>
                    </button>
                  </div>
                </div>
                
                {/* GitHub Project Selection */}
                {inputMethod === 'github' && (
                  <div className="card p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Select GitHub Project</h3>
                    <p className="text-gray-500 mb-4">Choose a project from your analyzed repositories</p>
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Choose Project
                    </button>
                  </div>
                )}
                
                {/* ZIP Upload */}
                {inputMethod === 'zip' && (
                  <div className="card p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Project Files</h3>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      {isDragActive ? (
                        <p className="text-blue-600 font-medium">Drop ZIP file here...</p>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-2">
                            Drag & drop a ZIP file, or click to browse
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports project archives up to 50MB
                          </p>
                        </>
                      )}
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center text-sm text-green-700">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">{uploadedFiles.length} files uploaded successfully</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                    <div className={`max-w-4xl ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                      {/* User role indicator for assistant messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                            <CodeBracketIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-500">AutoProgrammer</span>
                        </div>
                      )}
                      
                      <div className={`p-4 shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md' 
                          : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-md'
                      }`}>
                        <div className={message.role === 'user' ? 'text-sm' : ''}>
                          {message.role === 'user' ? (
                            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                          ) : (
                            <MessageRenderer 
                              content={message.content} 
                              onFileClick={handleFileClick}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className={`mt-2 text-xs text-gray-400 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-4xl mr-8">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                          <CodeBracketIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">AutoProgrammer</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-md shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Analyzing your code...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input - ALWAYS VISIBLE at bottom */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white" style={{ flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 10 }}>
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={selectedProject ? "Ask me anything about your code... (Shift+Enter for new line)" : "Select a project first..."}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white shadow-sm"
                  disabled={isLoading || !selectedProject}
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !selectedProject}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
            
            {selectedProject && (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Connected to <span className="font-medium text-blue-600">{getProjectName(selectedProject)}</span>
                </div>
                {isWebProject(selectedProject) && codeChanges.length > 0 && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-md hover:from-green-700 hover:to-green-800 transition-all shadow-sm"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Website Preview
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - File Structure & Preview */}
        {selectedProject && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'files', name: 'Files', icon: FolderIcon },
                  { id: 'preview', name: 'Preview', icon: EyeIcon },
                  { id: 'changes', name: 'Changes', icon: CodeBracketIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                    {tab.id === 'changes' && codeChanges.length > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {codeChanges.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'files' && (
                <div className="h-full overflow-y-auto">
                  {fileTree.length > 0 ? (
                    <div className="p-2">
                      {renderFileTree(fileTree)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Loading file structure...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {/* Website Preview Button */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Live Website Preview</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            View your project rendered in a browser
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const html = generatePreviewHTML(fileTree, detectProjectType(fileTree))
                            setPreviewHTML(html)
                            setShowWebsitePreview(true)
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="h-5 w-5" />
                          <span>Preview Website</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* File Content Preview */}
                    {selectedFile ? (
                      <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">{selectedFile.path}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedFile.content || '')
                              toast.success('Copied to clipboard!')
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="text-sm text-gray-100">
                          <code>{selectedFile.content || 'No content available'}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <DocumentIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>Select a file from the tree to preview its content</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'changes' && (
                <div className="h-full overflow-y-auto p-4">
                  {codeChanges.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <CodeBracketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No pending changes</p>
                        <p className="text-xs mt-1">Chat with AI to suggest improvements</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Actions Header */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {codeChanges.length} Pending Change{codeChanges.length !== 1 ? 's' : ''}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Review and approve changes before applying
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const html = generatePreviewWithChanges(fileTree, codeChanges)
                                setPreviewHTML(html)
                                setShowWebsitePreview(true)
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Preview Changes
                            </button>
                            <button
                              onClick={applyAllChanges}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Apply All
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* List of Changes with Side-by-Side */}
                      {codeChanges.map((change) => (
                        <div key={change.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Change Header */}
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                change.type === 'create' ? 'bg-green-100 text-green-700' :
                                change.type === 'modify' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {change.type.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{change.file}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => applySingleChange(change.id)}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => rejectChange(change.id)}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          
                          {/* Side-by-Side Comparison */}
                          <div className="grid grid-cols-2 divide-x divide-gray-200">
                            {/* Current */}
                            <div className="p-4 bg-red-50">
                              <h4 className="text-xs font-medium text-gray-700 mb-2">CURRENT</h4>
                              <pre className="text-xs bg-white p-3 rounded border border-red-200 overflow-auto max-h-64">
                                <code>{getCurrentFileContent(change.file)}</code>
                              </pre>
                            </div>
                            
                            {/* Proposed */}
                            <div className="p-4 bg-green-50">
                              <h4 className="text-xs font-medium text-gray-700 mb-2">PROPOSED</h4>
                              <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-auto max-h-64">
                                <code>{change.content}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Code Preview Modal (existing) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            <CodePreview
              currentFiles={fileTree}
              proposedChanges={codeChanges}
              projectType={detectProjectType(selectedProject)}
              onApplyChanges={handleApplyChanges}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
      
      {/* Website Preview Modal (new) */}
      {showWebsitePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Website Preview</h2>
              <button
                onClick={() => setShowWebsitePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body - Iframe */}
            <div className="flex-1 p-4 overflow-hidden">
              <iframe
                srcDoc={previewHTML}
                className="w-full h-full border border-gray-200 rounded-lg bg-white"
                sandbox="allow-scripts allow-same-origin"
                title="Website Preview"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowWebsitePreview(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AutoProgrammer() {
  return (
    <ModuleAccessGuard module="auto_programmer">
      <AutoProgrammerContent />
    </ModuleAccessGuard>
  )
} 