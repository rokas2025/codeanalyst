/**
 * Project Type Detector
 * Analyzes project files to determine if it's web, backend, mobile, or other
 */

export type ProjectType = 'web' | 'backend' | 'mobile' | 'other'

interface FileNode {
  name?: string
  path: string
  type?: 'file' | 'folder'
  content?: string
  children?: FileNode[]
}

/**
 * Detects the project type based on analysis data
 */
export function detectProjectType(analysis: any): ProjectType {
  if (!analysis) return 'other'
  
  // Try to get files from various possible locations in the analysis structure
  let files: FileNode[] = []
  
  if (analysis.results?.technicalStructure?.files) {
    files = analysis.results.technicalStructure.files
  } else if (analysis.results?.technicalStructure?.fileStructure) {
    files = analysis.results.technicalStructure.fileStructure
  } else if (analysis.results?.systemOverview?.files) {
    files = analysis.results.systemOverview.files
  } else if (analysis.results?.systemOverview?.fileStructure) {
    files = analysis.results.systemOverview.fileStructure
  } else if (analysis.results?.staticAnalysisResults?.files) {
    files = analysis.results.staticAnalysisResults.files
  } else if (analysis.files) {
    files = analysis.files
  }
  
  // Flatten file tree to check all files
  const allFiles = flattenFileTree(files)
  const filePaths = allFiles.map(f => f.path.toLowerCase())
  const fileContents = allFiles.map(f => f.content?.toLowerCase() || '')
  
  // Check for web indicators
  const webIndicators = {
    react: filePaths.some(p => p.endsWith('.jsx') || p.endsWith('.tsx')) ||
           fileContents.some(c => c.includes('import react') || c.includes('from "react"')),
    html: filePaths.some(p => p.endsWith('.html')),
    vue: filePaths.some(p => p.endsWith('.vue')),
    angular: filePaths.some(p => p.includes('angular.json') || p.endsWith('.component.ts')),
    nextjs: filePaths.some(p => p.includes('next.config') || p.includes('pages/') && p.endsWith('.tsx')),
    svelte: filePaths.some(p => p.endsWith('.svelte')),
    css: filePaths.some(p => p.endsWith('.css') || p.endsWith('.scss') || p.endsWith('.sass')),
    webpack: filePaths.some(p => p.includes('webpack.config')),
    vite: filePaths.some(p => p.includes('vite.config')),
    packageJson: filePaths.some(p => p.endsWith('package.json'))
  }
  
  // Strong web indicators
  if (webIndicators.react || webIndicators.vue || webIndicators.angular || 
      webIndicators.nextjs || webIndicators.svelte) {
    return 'web'
  }
  
  // HTML projects
  if (webIndicators.html && (webIndicators.css || webIndicators.packageJson)) {
    return 'web'
  }
  
  // Check for backend indicators
  const backendIndicators = {
    express: fileContents.some(c => c.includes('express') && c.includes('app.listen')),
    fastify: fileContents.some(c => c.includes('fastify')),
    nestjs: filePaths.some(p => p.includes('nest-cli.json') || p.endsWith('.controller.ts')),
    api: filePaths.some(p => p.includes('api/') || p.includes('routes/') || p.includes('controllers/')),
    django: filePaths.some(p => p.endsWith('settings.py') || p.endsWith('wsgi.py')),
    flask: fileContents.some(c => c.includes('from flask import')),
    springboot: filePaths.some(p => p.endsWith('pom.xml') && fileContents.some(c => c.includes('spring-boot'))),
    database: filePaths.some(p => p.includes('models/') || p.includes('schema') || p.includes('migrations/'))
  }
  
  if (backendIndicators.express || backendIndicators.fastify || backendIndicators.nestjs ||
      backendIndicators.django || backendIndicators.flask || backendIndicators.springboot) {
    return 'backend'
  }
  
  // If has API routes but also web files, it's likely a full-stack web project
  if (backendIndicators.api && (webIndicators.react || webIndicators.html)) {
    return 'web'
  }
  
  // Check for mobile indicators
  const mobileIndicators = {
    reactNative: fileContents.some(c => c.includes('react-native')) ||
                 filePaths.some(p => p.includes('app.json') && fileContents.some(c => c.includes('expo'))),
    flutter: filePaths.some(p => p.endsWith('.dart') || p.includes('pubspec.yaml')),
    ionic: filePaths.some(p => p.includes('ionic.config.json')),
    xamarin: filePaths.some(p => p.endsWith('.xaml')),
    swift: filePaths.some(p => p.endsWith('.swift') && p.includes('ios/')),
    kotlin: filePaths.some(p => p.endsWith('.kt') && p.includes('android/'))
  }
  
  if (mobileIndicators.reactNative || mobileIndicators.flutter || mobileIndicators.ionic ||
      mobileIndicators.xamarin || mobileIndicators.swift || mobileIndicators.kotlin) {
    return 'mobile'
  }
  
  // Default to other if we can't determine
  return 'other'
}

/**
 * Checks if the project is a web project
 */
export function isWebProject(analysis: any): boolean {
  return detectProjectType(analysis) === 'web'
}

/**
 * Checks if the project is previewable (web or mobile with web view)
 */
export function isPreviewable(analysis: any): boolean {
  const type = detectProjectType(analysis)
  return type === 'web' || type === 'mobile'
}

/**
 * Gets a human-readable description of the project type
 */
export function getProjectTypeDescription(type: ProjectType): string {
  switch (type) {
    case 'web':
      return 'Web Application'
    case 'backend':
      return 'Backend/API'
    case 'mobile':
      return 'Mobile Application'
    case 'other':
      return 'Other Project Type'
  }
}

/**
 * Flattens a file tree into a single array
 */
function flattenFileTree(files: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  
  traverse(files)
  return result
}

/**
 * Detects the main framework/library used in a web project
 */
export function detectWebFramework(analysis: any): string {
  if (!isWebProject(analysis)) return 'Unknown'
  
  const files = analysis.results?.technicalStructure?.files || 
                analysis.results?.systemOverview?.files || 
                analysis.files || []
  
  const allFiles = flattenFileTree(files)
  const filePaths = allFiles.map(f => f.path.toLowerCase())
  const fileContents = allFiles.map(f => f.content?.toLowerCase() || '')
  
  if (filePaths.some(p => p.includes('next.config'))) return 'Next.js'
  if (filePaths.some(p => p.endsWith('.vue'))) return 'Vue.js'
  if (filePaths.some(p => p.includes('angular.json'))) return 'Angular'
  if (filePaths.some(p => p.endsWith('.svelte'))) return 'Svelte'
  if (filePaths.some(p => p.endsWith('.tsx') || p.endsWith('.jsx'))) return 'React'
  if (filePaths.some(p => p.endsWith('.html'))) return 'HTML/CSS/JS'
  
  return 'Unknown'
}

