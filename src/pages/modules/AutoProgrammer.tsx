import React, { useState, useEffect, useRef } from 'react'
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
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

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

export function AutoProgrammer() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'structure' | 'preview' | 'changes'>('structure')

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const parseCodeChanges = (content: string) => {
    return []
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
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

  const renderMessageContent = (content: string) => {
    let processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
    
    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />
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
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 pt-3" style={{ minHeight: 0, maxHeight: 'calc(100vh - 120px)' }}>
            {!selectedProject ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-3">
                  <CodeBracketIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AutoProgrammer</h3>
                <p className="text-gray-500 mb-4">Select a project to start coding with AI</p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Choose Project
                </button>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                      <div className={`p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">
                          {message.role === 'user' ? (
                            message.content
                          ) : (
                            renderMessageContent(message.content)
                          )}
                        </div>
                      </div>
                      <div className={`mt-1 text-xs text-gray-400 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl mr-12">
                      <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          </div>
                          <span className="text-sm text-gray-500">Thinking...</span>
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
          <div className="px-4 py-2 border-t border-gray-200 bg-white" style={{ flexShrink: 0, backgroundColor: '#fff', position: 'sticky', bottom: 0, zIndex: 10 }}>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={selectedProject ? "Ask me anything about your code..." : "Select a project first..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading || !selectedProject}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !selectedProject}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - File Structure & Preview */}
        {selectedProject && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'structure', name: 'Files', icon: FolderIcon },
                  { id: 'preview', name: 'Preview', icon: DocumentIcon },
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
                      <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                        {codeChanges.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'structure' && (
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
                  {selectedFile ? (
                    <div className="p-4">
                      {/* File Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{selectedFile.path}</p>
                        </div>
                        {selectedFile.size && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {Math.round(selectedFile.size / 1024)}KB
                          </span>
                        )}
                      </div>

                      {/* Functions Overview */}
                      {selectedFile.functions && selectedFile.functions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <CodeBracketIcon className="h-4 w-4 mr-2 text-blue-500" />
                            Functions & Methods ({selectedFile.functions.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedFile.functions.map((func, index) => (
                              <div key={index} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="font-mono text-sm font-semibold text-blue-700">{func.name}</span>
                                    <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                      {func.type}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">Line {func.startLine}</span>
                                </div>
                                {func.signature && (
                                  <pre className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border overflow-x-auto">
                                    {func.signature}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Code Preview */}
                      {selectedFile.content && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <DocumentIcon className="h-4 w-4 mr-2 text-green-500" />
                            Code Preview
                          </h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <span className="text-xs text-gray-600 ml-2">{selectedFile.name}</span>
                              </div>
                            </div>
                            <pre className="text-xs text-gray-800 p-4 overflow-x-auto bg-white" style={{ maxHeight: '300px' }}>
                              {selectedFile.content.split('\n').slice(0, 50).map((line, index) => (
                                <div key={index} className="flex">
                                  <span className="text-gray-400 mr-4 select-none" style={{ minWidth: '2rem' }}>
                                    {(index + 1).toString().padStart(2, ' ')}
                                  </span>
                                  <span>{line}</span>
                                </div>
                              ))}
                              {selectedFile.content.split('\n').length > 50 && (
                                <div className="text-gray-500 italic mt-2">
                                  ... {selectedFile.content.split('\n').length - 50} more lines
                                </div>
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Select a file to preview</p>
                        <p className="text-xs text-gray-400 mt-1">Click on any file in the structure to see its content</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'changes' && (
                <div className="h-full overflow-y-auto p-4">
                  {codeChanges.length > 0 ? (
                    <div className="space-y-3">
                      {codeChanges.map((change) => (
                        <div key={change.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{change.file}</span>
                            <button
                              onClick={() => approveChange(change.id)}
                              className={`text-xs px-2 py-1 rounded ${
                                change.approved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {change.approved ? 'Approved' : 'Approve'}
                            </button>
                          </div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {change.content.slice(0, 200)}...
                          </pre>
                        </div>
                      ))}
                      <button
                        onClick={commitChanges}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4 inline mr-2" />
                        Commit to GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <CodeBracketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No pending changes</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 