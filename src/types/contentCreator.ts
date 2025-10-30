// Content Creator Types
export interface GenerationSettings {
  temperature: number // 0.1 - 1.0, default 0.7
  maxTokens: number // 500 - 4000, default 2000
  model: 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo' // Default: gpt-4-turbo
  language: 'en' | 'lt' | 'es' | 'fr' | 'de' // Default: 'en'
  tone: 'professional' | 'casual' | 'persuasive' | 'friendly' | 'authoritative' | 'creative' | 'formal' | 'conversational'
  style: 'concise' | 'detailed' | 'conversational' | 'formal' | 'narrative' | 'list-based'
  audience: 'general' | 'technical' | 'executive' | 'consumer' | 'academic' | 'marketing'
  ctaStrength: 'subtle' | 'moderate' | 'strong' | 'aggressive'
  brandPrimaryColor?: string // Optional brand primary color (hex)
  brandSecondaryColor?: string // Optional brand secondary color (hex)
  brandBackgroundColor?: string // Optional brand background color (hex)
  brandTextColor?: string // Optional brand text color (hex)
}

export interface ContentTemplate {
  id: string
  name: string
  description: string
  category: 'website' | 'marketing' | 'ecommerce' | 'blog' | 'social' | 'email'
  icon: string
  inputFields: TemplateField[]
  promptTemplate: string
  outputStructure: ContentSection[]
  defaultSettings: Partial<GenerationSettings>
  estimatedWords: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface TemplateField {
  name: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'url'
  label: string
  placeholder: string
  required: boolean
  description?: string
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface ContentSection {
  id: string
  name: string
  type: 'heading' | 'paragraph' | 'list' | 'cta' | 'image' | 'quote'
  content: string
  editable: boolean
  order: number
}

export interface GeneratedContent {
  id: string
  templateId: string
  title: string
  content: ContentSection[]
  settings: GenerationSettings
  inputs: Record<string, any>
  metadata: {
    wordCount: number
    readingTime: number
    seoScore: number
    generatedAt: string
    tokensUsed: number
    cost: number
  }
  status: 'draft' | 'generated' | 'edited' | 'approved' | 'published'
  versions: ContentVersion[]
}

export interface ContentVersion {
  id: string
  content: ContentSection[]
  settings: GenerationSettings
  createdAt: string
  notes?: string
}

export interface GenerationRequest {
  templateId: string
  inputs: Record<string, any>
  settings: GenerationSettings
  regenerateSections?: string[] // Optional: only regenerate specific sections
}

export interface GenerationResponse {
  success: boolean
  content?: GeneratedContent
  error?: string
  warnings?: string[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

export interface ContentExportOptions {
  format: 'html' | 'markdown' | 'plaintext' | 'wordpress' | 'json'
  includeMetadata: boolean
  includeStyling: boolean
  customTemplate?: string
}

export interface ContentCreatorState {
  // Current generation
  selectedTemplate: ContentTemplate | null
  inputs: Record<string, any>
  settings: GenerationSettings
  generatedContent: GeneratedContent | null
  
  // UI State
  isGenerating: boolean
  currentStep: 'template' | 'inputs' | 'settings' | 'preview' | 'export'
  showAdvancedSettings: boolean
  previewMode: 'formatted' | 'html' | 'markdown'
  
  // Error handling
  generationError: string | null
  validationErrors: Record<string, string>
  
  // Generation metadata
  lastGenerationMetadata: any | null
  
  // Templates and history
  templates: ContentTemplate[]
  contentHistory: GeneratedContent[]
  favorites: string[] // Template IDs
  
  // Settings
  defaultSettings: GenerationSettings
  apiConfiguration: {
    provider: 'openai'
    apiKey?: string
    organization?: string
  }
}

// Default settings
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  temperature: 0.7,
  maxTokens: 2000,
  model: 'gpt-4-turbo',
  language: 'en',
  tone: 'professional',
  style: 'detailed',
  audience: 'general',
  ctaStrength: 'moderate',
  brandPrimaryColor: '#3B82F6',
  brandSecondaryColor: '#8B5CF6',
  brandBackgroundColor: '#FFFFFF',
  brandTextColor: '#1F2937'
}

// Temperature presets
export const TEMPERATURE_PRESETS = {
  conservative: { value: 0.3, label: 'Conservative', description: 'Predictable, safe content' },
  balanced: { value: 0.7, label: 'Balanced', description: 'Good mix of creativity and consistency' },
  creative: { value: 0.9, label: 'Creative', description: 'More creative and varied output' }
} as const

// Tone options with descriptions
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling, sales-oriented tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable tone' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident tone' },
  { value: 'creative', label: 'Creative', description: 'Innovative, inspiring tone' },
  { value: 'formal', label: 'Formal', description: 'Strict, academic tone' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, chat-like tone' }
] as const

// Style options
export const STYLE_OPTIONS = [
  { value: 'concise', label: 'Concise', description: 'Brief, to-the-point content' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough content' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, dialogue-style content' },
  { value: 'formal', label: 'Formal', description: 'Structured, academic-style content' },
  { value: 'narrative', label: 'Narrative', description: 'Story-driven, engaging content' },
  { value: 'list-based', label: 'List-based', description: 'Organized in lists and bullet points' }
] as const

// Audience options
export const AUDIENCE_OPTIONS = [
  { value: 'general', label: 'General Public', description: 'Broad, accessible audience' },
  { value: 'technical', label: 'Technical', description: 'Developers, engineers, technical professionals' },
  { value: 'executive', label: 'Executive', description: 'Business leaders, decision makers' },
  { value: 'consumer', label: 'Consumer', description: 'End customers, retail buyers' },
  { value: 'academic', label: 'Academic', description: 'Students, researchers, educators' },
  { value: 'marketing', label: 'Marketing', description: 'Marketing professionals, agencies' }
] as const

