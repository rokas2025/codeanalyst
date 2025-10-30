// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  avatarUrl?: string
  githubId?: number
  githubUsername?: string
  plan: 'free' | 'pro' | 'enterprise'
  role?: 'superadmin' | 'admin' | 'user'
  is_active?: boolean
  pending_approval?: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  type: 'github' | 'zip' | 'wordpress' | 'url'
  sourceUrl?: string
  githubRepo?: string
  status: 'active' | 'paused' | 'archived'
  lastAnalyzed?: string
  createdAt: string
  updatedAt: string
  settings: ProjectSettings
}

export interface ProjectSettings {
  aiModel: 'gpt-4' | 'claude-3'
  autoDeployment: boolean
  deploymentMethod: 'github' | 'ftp' | 'wordpress' | 'zip'
  notifications: boolean
  beenexIntegration: boolean
}

// AI Module Types
export interface AIAnalysisResult {
  id: string
  type: 'code' | 'content' | 'feature' | 'creation'
  suggestions: Suggestion[]
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  confidence: number
  createdAt: string
}

export interface Suggestion {
  id: string
  title: string
  description: string
  type: 'improvement' | 'fix' | 'feature' | 'content'
  priority: 'low' | 'medium' | 'high' | 'critical'
  files: string[]
  changes: CodeChange[]
  estimatedImpact: string
  reasoning: string
}

export interface CodeChange {
  file: string
  line: number
  oldCode: string
  newCode: string
  type: 'add' | 'modify' | 'delete'
}

// GitHub Integration Types
export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  private: boolean
  description?: string
  defaultBranch: string
  language: string
  updatedAt: string
}

export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  downloadUrl?: string
  content?: string
}

// WordPress Types
export interface WordPressPlugin {
  version: string
  isActive: boolean
  lastSync?: string
  siteUrl: string
  adminUrl: string
}

// Beenex CRM Types
export interface BeenexTask {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  dueDate?: string
  projectId: string
  createdAt: string
}

// API Response Types
export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

// Form Types
export interface ProjectFormData {
  name: string
  description?: string
  type: Project['type']
  sourceUrl?: string
  githubRepo?: string
  settings: ProjectSettings
}

// Analytics Types
export interface AnalyticsData {
  totalProjects: number
  totalSuggestions: number
  appliedChanges: number
  timeframe: 'week' | 'month' | 'quarter' | 'year'
  metrics: {
    codeImprovements: number
    contentOptimizations: number
    featuresAdded: number
    issuesFixed: number
  }
}

// AdoreIno Code Analytics Types
export interface AdoreInoAnalysis {
  id: string
  projectId: string
  status: 'analyzing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  results?: AdoreInoResults
}

export interface AdoreInoResults {
  systemOverview: SystemOverview
  technicalStructure: TechnicalStructure
  maintenanceNeeds: MaintenanceNeeds
  businessRecommendations: BusinessRecommendation[]
  aiExplanations: AIExplanation[]
  riskAssessment: RiskAssessment
  confidenceLevel: number
  dataValidation: DataValidation
}

export interface DataValidation {
  realData: string[] // List of metrics that are 100% real
  estimatedData: string[] // List of metrics that are estimated
  simulatedData: string[] // List of metrics that are simulated (if any)
  confidenceScores: Record<string, number> // 0-100 confidence for each metric
}

export interface SystemOverview {
  overallScore: number
  qualityRating: 'excellent' | 'good' | 'fair' | 'poor'
  modernityScore: number
  competitivenessRating: string
  mainTechnologies: string[]
  projectType: string
  estimatedComplexity: 'low' | 'medium' | 'high'
}

export interface TechnicalStructure {
  modules: ModuleInfo[]
  dependencies: DependencyInfo[]
  architecture: ArchitectureInfo
  codeMetrics: CodeMetrics
}

export interface ModuleInfo {
  name: string
  path: string
  type: 'core' | 'feature' | 'utility' | 'third-party'
  linesOfCode: number
  lastModified: string
  dependencies: string[]
  description?: string
}

export interface DependencyInfo {
  name: string
  version: string
  type: 'runtime' | 'dev' | 'peer'
  isOutdated: boolean
  securityIssues: number
  usageCount: number
}

export interface ArchitectureInfo {
  pattern: string
  layerStructure: string[]
  dataFlow: string
  scalabilityRating: number
}

export interface CodeMetrics {
  totalFiles: number
  totalLines: number
  complexity: number
  testCoverage?: number
  duplicateCode: number
  technicalDebt: number
}

export interface MaintenanceNeeds {
  urgentTasks: MaintenanceTask[]
  recommendedTasks: MaintenanceTask[]
  estimatedEffort: string
  priorityLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface MaintenanceTask {
  title: string
  description: string
  type: 'security' | 'performance' | 'update' | 'refactor' | 'documentation'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  estimatedHours: number
  files: string[]
}

export interface BusinessRecommendation {
  category: 'maintain' | 'improve' | 'migrate' | 'replace'
  title: string
  description: string
  businessImpact: string
  costEstimate: string
  timeline: string
  risks: string[]
  benefits: string[]
  priority: number
}

export interface AIExplanation {
  context: string
  explanation: string
  reasoning: string
  confidence: number
  relatedFiles: string[]
  businessValue: string
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  risks: RiskItem[]
  mitigation: string[]
}

export interface RiskItem {
  type: 'security' | 'performance' | 'maintenance' | 'compatibility' | 'business'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'low' | 'medium' | 'high'
  affectedFiles: string[]
} 