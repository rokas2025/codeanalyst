/**
 * Advanced File Processing System for AdoreIno Analysis
 * Processes entire uploaded codebases according to Lithuanian requirements document
 */

export interface ProcessedFile {
  path: string
  content: string
  size: number
  type: FileType
  language: ProgrammingLanguage
  lastModified?: Date
  complexity?: number
  dependencies?: string[]
}

export interface CodebaseStructure {
  totalFiles: number
  totalLines: number
  languages: ProgrammingLanguage[]
  frameworks: DetectedFramework[]
  structure: DirectoryStructure
  entryPoints: string[]
  configFiles: string[]
}

export interface DirectoryStructure {
  [key: string]: {
    files: ProcessedFile[]
    subdirectories: DirectoryStructure
    type: 'source' | 'config' | 'test' | 'documentation' | 'build' | 'assets'
  }
}

export type FileType = 'source' | 'config' | 'test' | 'documentation' | 'asset' | 'build'
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'php' | 'python' | 'java' | 'css' | 'html' | 'json' | 'markdown' | 'unknown'

export interface DetectedFramework {
  name: string
  version?: string
  confidence: number
  files: string[]
}

export class AdvancedFileProcessor {
  private files: { path: string; content: string; size: number }[] = []
  private processedFiles: ProcessedFile[] = []
  private structure: CodebaseStructure | null = null

  constructor(files: { path: string; content: string; size: number }[]) {
    this.files = files
  }

  /**
   * Process entire codebase according to AdoreIno requirements
   * Performs comprehensive analysis of all uploaded files
   */
  async processCodebase(): Promise<CodebaseStructure> {
    // Processing files for comprehensive analysis
    
    // Step 1: Classify and process each file
    this.processedFiles = await this.classifyAndProcessFiles()
    
    // Step 2: Detect frameworks and technologies
    const frameworks = this.detectFrameworks()
    
    // Step 3: Build directory structure
    const structure = this.buildDirectoryStructure()
    
    // Step 4: Identify entry points and important files
    const entryPoints = this.identifyEntryPoints()
    const configFiles = this.identifyConfigFiles()
    
    // Step 5: Calculate metrics
    const totalLines = this.processedFiles.reduce((sum, file) => sum + file.content.split('\n').length, 0)
    const languages = [...new Set(this.processedFiles.map(f => f.language))]
    
    this.structure = {
      totalFiles: this.processedFiles.length,
      totalLines,
      languages,
      frameworks,
      structure,
      entryPoints,
      configFiles
    }
    
    console.log(`✅ Processed codebase: ${this.structure.totalFiles} files, ${this.structure.totalLines} lines`)
    
    return this.structure
  }

  /**
   * Classify each file by type and programming language
   */
  private async classifyAndProcessFiles(): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = []
    
    for (const file of this.files) {
      const processedFile: ProcessedFile = {
        ...file,
        type: this.classifyFileType(file.path),
        language: this.detectProgrammingLanguage(file.path, file.content),
        complexity: this.calculateFileComplexity(file.content, file.path),
        dependencies: this.extractDependencies(file.content, file.path)
      }
      
      processed.push(processedFile)
    }
    
    return processed
  }

  /**
   * Classify file type based on path and content
   */
  private classifyFileType(path: string): FileType {
    const lowerPath = path.toLowerCase()
    
    // Test files
    if (lowerPath.includes('test') || lowerPath.includes('spec') || lowerPath.includes('__tests__')) {
      return 'test'
    }
    
    // Configuration files
    if (lowerPath.includes('config') || lowerPath.match(/\.(json|yml|yaml|toml|ini|env)$/)) {
      return 'config'
    }
    
    // Documentation
    if (lowerPath.match(/\.(md|txt|rst|doc)$/) || lowerPath.includes('readme') || lowerPath.includes('docs')) {
      return 'documentation'
    }
    
    // Build files
    if (lowerPath.includes('build') || lowerPath.includes('dist') || lowerPath.includes('bundle')) {
      return 'build'
    }
    
    // Assets
    if (lowerPath.match(/\.(png|jpg|jpeg|gif|svg|ico|css|scss|sass|less)$/)) {
      return 'asset'
    }
    
    // Source files (default)
    return 'source'
  }

  /**
   * Detect programming language from file extension and content
   */
  private detectProgrammingLanguage(path: string, content: string): ProgrammingLanguage {
    const extension = path.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'php':
        return 'php'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return 'css'
      case 'html':
      case 'htm':
        return 'html'
      case 'json':
        return 'json'
      case 'md':
      case 'markdown':
        return 'markdown'
      default:
        // Try to detect from content
        if (content.includes('<?php')) return 'php'
        if (content.includes('import ') && content.includes('export ')) return 'javascript'
        if (content.includes('interface ') && content.includes(': ')) return 'typescript'
        return 'unknown'
    }
  }

  /**
   * Calculate file complexity score
   */
  private calculateFileComplexity(content: string, path: string): number {
    let complexity = 0
    const lines = content.split('\n')
    
    // Base complexity from file size
    complexity += Math.min(lines.length / 100, 10)
    
    // Add complexity for control structures
    const controlPatterns = [
      /\b(if|else|for|while|switch|case|try|catch)\b/g,
      /\b(function|class|interface|type)\b/g,
      /\b(async|await|promise)\b/gi
    ]
    
    for (const pattern of controlPatterns) {
      const matches = content.match(pattern)
      if (matches) complexity += matches.length * 0.5
    }
    
    // Add complexity for nested structures
    const nestingLevel = this.calculateNestingLevel(content)
    complexity += nestingLevel
    
    return Math.min(complexity, 50) // Cap at 50
  }

  /**
   * Calculate maximum nesting level in file
   */
  private calculateNestingLevel(content: string): number {
    let maxLevel = 0
    let currentLevel = 0
    
    for (const char of content) {
      if (char === '{' || char === '(') {
        currentLevel++
        maxLevel = Math.max(maxLevel, currentLevel)
      } else if (char === '}' || char === ')') {
        currentLevel = Math.max(0, currentLevel - 1)
      }
    }
    
    return maxLevel
  }

  /**
   * Extract dependencies from file content
   */
  private extractDependencies(content: string, path: string): string[] {
    const dependencies: string[] = []
    
    // JavaScript/TypeScript imports
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g)
    if (importMatches) {
      importMatches.forEach(match => {
        const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1]
        if (dep && !dep.startsWith('.')) {
          dependencies.push(dep.split('/')[0]) // Get package name only
        }
      })
    }
    
    // Require statements
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g)
    if (requireMatches) {
      requireMatches.forEach(match => {
        const dep = match.match(/require\(['"]([^'"]+)['"]\)/)?.[1]
        if (dep && !dep.startsWith('.')) {
          dependencies.push(dep.split('/')[0])
        }
      })
    }
    
    // PHP includes/requires
    if (path.endsWith('.php')) {
      const phpIncludes = content.match(/(?:include|require)(?:_once)?\s*['"]([^'"]+)['"]/g)
      if (phpIncludes) {
        phpIncludes.forEach(match => {
          const dep = match.match(/['"]([^'"]+)['"]/)?.[1]
          if (dep) dependencies.push(dep)
        })
      }
    }
    
    return [...new Set(dependencies)] // Remove duplicates
  }

  /**
   * Detect frameworks and libraries used in the codebase
   */
  private detectFrameworks(): DetectedFramework[] {
    const frameworks: DetectedFramework[] = []
    const packageJsonFiles = this.processedFiles.filter(f => f.path.endsWith('package.json'))
    
    console.log(`🔍 FRAMEWORK DETECTION: Found ${packageJsonFiles.length} package.json files`)
    
    // Analyze package.json files
    for (const file of packageJsonFiles) {
      try {
        console.log(`📦 PARSING: ${file.path}`)
        const pkg = JSON.parse(file.content)
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
        console.log(`📋 DEPENDENCIES: Found ${Object.keys(allDeps).length} dependencies`)
        
        for (const [name, version] of Object.entries(allDeps)) {
          const framework = this.identifyFramework(name, version as string)
          if (framework) {
            console.log(`✅ FRAMEWORK IDENTIFIED: ${framework.name} v${framework.version}`)
            frameworks.push({
              ...framework,
              files: [file.path]
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to parse package.json: ${file.path}`)
      }
    }
    
    // Detect frameworks from file patterns
    const patternFrameworks = this.detectFrameworksFromPatterns()
    frameworks.push(...patternFrameworks)
    
    return frameworks
  }

  /**
   * Identify framework from package name and version
   */
  private identifyFramework(name: string, version: string): DetectedFramework | null {
    const frameworkMap: { [key: string]: { name: string; confidence: number } } = {
      'react': { name: 'React', confidence: 0.95 },
      'vue': { name: 'Vue.js', confidence: 0.95 },
      'angular': { name: 'Angular', confidence: 0.95 },
      'express': { name: 'Express.js', confidence: 0.9 },
      'next': { name: 'Next.js', confidence: 0.9 },
      'nuxt': { name: 'Nuxt.js', confidence: 0.9 },
      'svelte': { name: 'Svelte', confidence: 0.9 },
      'laravel': { name: 'Laravel', confidence: 0.95 },
      'symfony': { name: 'Symfony', confidence: 0.9 },
      'wordpress': { name: 'WordPress', confidence: 0.95 },
      'tailwindcss': { name: 'Tailwind CSS', confidence: 0.8 },
      'bootstrap': { name: 'Bootstrap', confidence: 0.8 },
      'jquery': { name: 'jQuery', confidence: 0.7 }
    }
    
    const framework = frameworkMap[name.toLowerCase()]
    if (framework) {
      return {
        name: framework.name,
        version: version.replace(/[^\d.]/g, ''), // Clean version string
        confidence: framework.confidence,
        files: []
      }
    }
    
    return null
  }

  /**
   * Detect frameworks from file patterns and content
   */
  private detectFrameworksFromPatterns(): DetectedFramework[] {
    const frameworks: DetectedFramework[] = []
    
    console.log(`🔍 PATTERN DETECTION: Analyzing ${this.processedFiles.length} files for framework patterns`)
    
    // WordPress detection
    const wpFiles = this.processedFiles.filter(f => 
      f.content.includes('wp_') || 
      f.path.includes('wp-content') ||
      f.content.includes('WordPress')
    )
    if (wpFiles.length > 0) {
      frameworks.push({
        name: 'WordPress',
        confidence: 0.8,
        files: wpFiles.map(f => f.path)
      })
    }
    
    // React detection
    const reactFiles = this.processedFiles.filter(f => 
      f.content.includes('import React') ||
      f.content.includes('from "react"') ||
      f.path.includes('.jsx') ||
      f.path.includes('.tsx')
    )
    console.log(`🔍 REACT DETECTION: Found ${reactFiles.length} React files`)
    if (reactFiles.length > 0) {
      console.log(`✅ REACT IDENTIFIED: ${reactFiles.length} files detected`)
      frameworks.push({
        name: 'React',
        confidence: 0.85,
        files: reactFiles.map(f => f.path)
      })
    }
    
    // Laravel detection
    const laravelFiles = this.processedFiles.filter(f =>
      f.content.includes('Illuminate\\') ||
      f.path.includes('artisan') ||
      f.content.includes('Laravel')
    )
    if (laravelFiles.length > 0) {
      frameworks.push({
        name: 'Laravel',
        confidence: 0.85,
        files: laravelFiles.map(f => f.path)
      })
    }
    
    return frameworks
  }

  /**
   * Build hierarchical directory structure
   */
  private buildDirectoryStructure(): DirectoryStructure {
    const structure: DirectoryStructure = {}
    
    for (const file of this.processedFiles) {
      const pathParts = file.path.split('/')
      let current = structure
      
      // Navigate/create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        if (!current[part]) {
          current[part] = {
            files: [],
            subdirectories: {},
            type: this.classifyDirectoryType(part)
          }
        }
        current = current[part].subdirectories
      }
      
      // Add file to final directory
      const finalDir = pathParts[pathParts.length - 2] || 'root'
      if (!current[finalDir]) {
        current[finalDir] = {
          files: [],
          subdirectories: {},
          type: this.classifyDirectoryType(finalDir)
        }
      }
      current[finalDir].files.push(file)
    }
    
    return structure
  }

  /**
   * Classify directory type based on name
   */
  private classifyDirectoryType(dirName: string): 'source' | 'config' | 'test' | 'documentation' | 'build' | 'assets' {
    const lower = dirName.toLowerCase()
    
    if (lower.includes('test') || lower.includes('spec')) return 'test'
    if (lower.includes('doc') || lower === 'docs') return 'documentation'
    if (lower.includes('build') || lower.includes('dist')) return 'build'
    if (lower.includes('asset') || lower.includes('static') || lower.includes('public')) return 'assets'
    if (lower.includes('config') || lower === 'conf') return 'config'
    
    return 'source'
  }

  /**
   * Identify entry points of the application
   */
  private identifyEntryPoints(): string[] {
    const entryPoints: string[] = []
    
    // Common entry point patterns
    const entryPatterns = [
      'index.js', 'index.ts', 'index.php', 'main.js', 'main.ts',
      'app.js', 'app.ts', 'server.js', 'server.ts',
      'index.html', 'App.tsx', 'App.jsx'
    ]
    
    for (const file of this.processedFiles) {
      const fileName = file.path.split('/').pop() || ''
      if (entryPatterns.includes(fileName)) {
        entryPoints.push(file.path)
      }
    }
    
    return entryPoints
  }

  /**
   * Identify configuration files
   */
  private identifyConfigFiles(): string[] {
    const configFiles: string[] = []
    
    const configPatterns = [
      'package.json', 'composer.json', 'webpack.config.js', 'vite.config.js',
      'tsconfig.json', 'babel.config.js', '.eslintrc', 'prettier.config.js',
      'tailwind.config.js', '.env', '.env.example', 'docker-compose.yml'
    ]
    
    for (const file of this.processedFiles) {
      const fileName = file.path.split('/').pop() || ''
      if (configPatterns.some(pattern => fileName.includes(pattern))) {
        configFiles.push(file.path)
      }
    }
    
    return configFiles
  }

  /**
   * Get processed files
   */
  getProcessedFiles(): ProcessedFile[] {
    return this.processedFiles
  }

  /**
   * Get codebase structure
   */
  getStructure(): CodebaseStructure | null {
    return this.structure
  }

  /**
   * Get files by type
   */
  getFilesByType(type: FileType): ProcessedFile[] {
    return this.processedFiles.filter(f => f.type === type)
  }

  /**
   * Get files by language
   */
  getFilesByLanguage(language: ProgrammingLanguage): ProcessedFile[] {
    return this.processedFiles.filter(f => f.language === language)
  }

  /**
   * Calculate codebase statistics
   */
  getStatistics() {
    const sourceFiles = this.getFilesByType('source')
    const testFiles = this.getFilesByType('test')
    const totalComplexity = this.processedFiles.reduce((sum, f) => sum + (f.complexity || 0), 0)
    
    return {
      totalFiles: this.processedFiles.length,
      sourceFiles: sourceFiles.length,
      testFiles: testFiles.length,
      testCoverage: testFiles.length > 0 ? (testFiles.length / sourceFiles.length) * 100 : 0,
      averageComplexity: totalComplexity / this.processedFiles.length,
      languages: [...new Set(this.processedFiles.map(f => f.language))],
      largestFile: this.processedFiles.reduce((largest, current) => 
        current.size > largest.size ? current : largest, this.processedFiles[0]
      )
    }
  }
}