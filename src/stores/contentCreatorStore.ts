import { create } from 'zustand'
import type { 
  ContentCreatorState, 
  ContentTemplate, 
  GeneratedContent, 
  GenerationSettings
} from '../types/contentCreator'
import { DEFAULT_GENERATION_SETTINGS } from '../types/contentCreator'
import { contentCreatorService } from '../services/contentCreatorService'

interface ContentCreatorStore extends ContentCreatorState {
  // Actions
  loadTemplates: () => Promise<void>
  selectTemplate: (template: ContentTemplate) => void
  updateInputs: (inputs: Record<string, any>) => void
  updateSettings: (settings: Partial<GenerationSettings>) => void
  generateContent: () => Promise<void>
  regenerateSection: (sectionId: string) => Promise<void>
  saveContent: () => Promise<string | null>
  clearGeneration: () => void
  setCurrentStep: (step: ContentCreatorState['currentStep']) => void
  toggleAdvancedSettings: () => void
  setPreviewMode: (mode: ContentCreatorState['previewMode']) => void
  addToFavorites: (templateId: string) => void
  removeFromFavorites: (templateId: string) => void
  loadContentHistory: () => Promise<void>
  updateDefaultSettings: (settings: Partial<GenerationSettings>) => void
  
  // Error handling
  clearErrors: () => void
  setValidationErrors: (errors: Record<string, string>) => void
  
  // Content management
  updateContentSection: (sectionId: string, content: string) => void
  reorderContentSections: (sectionIds: string[]) => void
}

export const useContentCreatorStore = create<ContentCreatorStore>((set, get) => ({
  // Initial state
  selectedTemplate: null,
  inputs: {},
  settings: { ...DEFAULT_GENERATION_SETTINGS },
  generatedContent: null,
  
  // UI State
  isGenerating: false,
  currentStep: 'template',
  showAdvancedSettings: false,
  previewMode: 'formatted',
  
  // Error handling
  generationError: null,
  validationErrors: {},
  
  // Generation metadata
  lastGenerationMetadata: null,
  
  // Data
  templates: [],
  contentHistory: [],
  favorites: JSON.parse(localStorage.getItem('contentCreator_favorites') || '[]'),
  
  // Settings
  defaultSettings: { ...DEFAULT_GENERATION_SETTINGS },
  apiConfiguration: {
    provider: 'openai'
  },

  // Actions
  loadTemplates: async () => {
    try {
      console.log('📚 Loading content templates...')
      const { settings } = get()
      const templates = await contentCreatorService.getTemplates(undefined, settings.language)
      set({ templates })
      console.log(`✅ Loaded ${templates.length} templates in language: ${settings.language}`)
    } catch (error) {
      console.error('❌ Failed to load templates:', error)
    }
  },

  selectTemplate: (template: ContentTemplate) => {
    console.log('📝 Selected template:', template.name)
    set({ 
      selectedTemplate: template,
      inputs: {},
      generatedContent: null,
      currentStep: 'inputs',
      settings: {
        ...get().defaultSettings,
        ...template.defaultSettings
      }
    })
  },

  updateInputs: (inputs: Record<string, any>) => {
    set(state => ({
      inputs: { ...state.inputs, ...inputs }
    }))
  },

  updateSettings: (newSettings: Partial<GenerationSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }))
  },

  generateContent: async () => {
    const { selectedTemplate, inputs, settings } = get()
    
    if (!selectedTemplate) {
      console.error('❌ No template selected')
      return
    }

    // Validate required inputs
    const missingFields = selectedTemplate.inputFields
      .filter(field => field.required)
      .filter(field => !inputs[field.name] || inputs[field.name].trim() === '')
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields.map(f => f.label))
      // TODO: Show validation errors in UI
      return
    }

    set({ isGenerating: true, currentStep: 'preview', generationError: null })
    
    try {
      console.log('🤖 Generating content...')
      console.log('Template:', selectedTemplate.name)
      console.log('Inputs:', inputs)
      console.log('Settings:', settings)

      const response = await contentCreatorService.generateContent({
        templateId: selectedTemplate.template_id || selectedTemplate.id,
        inputs,
        settings
      })

      if (response.success && response.content) {
        set({ 
          generatedContent: {
            id: response.content.id || `temp_${Date.now()}`,
            content: response.content.sections || response.content.content_sections || [],
            metadata: response.metadata || response.generation_metadata,
            rawContent: response.content.raw_content,
            formattedContent: response.content.formatted_content
          },
          isGenerating: false,
          lastGenerationMetadata: response.metadata
        })
        console.log('✅ Content generated successfully')
      } else {
        throw new Error(response.error || 'Generation failed')
      }
    } catch (error) {
      console.error('❌ Content generation failed:', error)
      set({ 
        isGenerating: false, 
        generationError: error instanceof Error ? error.message : 'Generation failed'
      })
    }
  },

  regenerateSection: async (sectionId: string) => {
    const { selectedTemplate, inputs, settings, generatedContent } = get()
    
    if (!selectedTemplate || !generatedContent) {
      console.error('❌ Cannot regenerate: missing template or content')
      return
    }

    try {
      console.log('🔄 Regenerating section:', sectionId)
      
      const response = await contentCreatorService.generateContent({
        templateId: selectedTemplate.id,
        inputs,
        settings,
        regenerateSections: [sectionId]
      })

      if (response.success && response.content) {
        // Update only the regenerated section
        const updatedContent = {
          ...generatedContent,
          content: generatedContent.content.map(section => {
            const newSection = response.content!.content.find(s => s.id === section.id)
            return newSection || section
          })
        }
        
        set({ generatedContent: updatedContent })
        console.log('✅ Section regenerated successfully')
      }
    } catch (error) {
      console.error('❌ Section regeneration failed:', error)
    }
  },

  saveContent: async () => {
    const { generatedContent } = get()
    
    if (!generatedContent) {
      console.error('❌ No content to save')
      return null
    }

    try {
      console.log('💾 Saving content...')
      const id = await contentCreatorService.saveContent(generatedContent)
      
      // Update content history
      set(state => ({
        contentHistory: [generatedContent, ...state.contentHistory.slice(0, 19)]
      }))
      
      console.log('✅ Content saved successfully:', id)
      return id
    } catch (error) {
      console.error('❌ Failed to save content:', error)
      return null
    }
  },

  clearGeneration: () => {
    set({
      selectedTemplate: null,
      inputs: {},
      generatedContent: null,
      currentStep: 'template',
      settings: { ...get().defaultSettings },
      generationError: null,
      validationErrors: {},
      lastGenerationMetadata: null
    })
  },

  setCurrentStep: (step: ContentCreatorState['currentStep']) => {
    set({ currentStep: step })
  },

  toggleAdvancedSettings: () => {
    set(state => ({ showAdvancedSettings: !state.showAdvancedSettings }))
  },

  setPreviewMode: (mode: ContentCreatorState['previewMode']) => {
    set({ previewMode: mode })
  },

  addToFavorites: (templateId: string) => {
    const favorites = get().favorites
    if (!favorites.includes(templateId)) {
      const newFavorites = [...favorites, templateId]
      set({ favorites: newFavorites })
      localStorage.setItem('contentCreator_favorites', JSON.stringify(newFavorites))
    }
  },

  removeFromFavorites: (templateId: string) => {
    const newFavorites = get().favorites.filter(id => id !== templateId)
    set({ favorites: newFavorites })
    localStorage.setItem('contentCreator_favorites', JSON.stringify(newFavorites))
  },

  loadContentHistory: async () => {
    try {
      console.log('📚 Loading content history...')
      const history = await contentCreatorService.getContentHistory()
      set({ contentHistory: history })
      console.log(`✅ Loaded ${history.length} content items`)
    } catch (error) {
      console.error('❌ Failed to load content history:', error)
    }
  },

  updateDefaultSettings: (newSettings: Partial<GenerationSettings>) => {
    const updatedDefaults = { ...get().defaultSettings, ...newSettings }
    set({ 
      defaultSettings: updatedDefaults,
      settings: { ...get().settings, ...newSettings }
    })
    
    // Save to localStorage
    localStorage.setItem('contentCreator_defaultSettings', JSON.stringify(updatedDefaults))
  },

  // Error handling methods
  clearErrors: () => {
    set({ 
      generationError: null, 
      validationErrors: {} 
    })
  },

  setValidationErrors: (errors: Record<string, string>) => {
    set({ validationErrors: errors })
  },

  // Content management methods
  updateContentSection: (sectionId: string, content: string) => {
    const { generatedContent } = get()
    if (!generatedContent || !generatedContent.content) return

    const updatedSections = generatedContent.content.map(section =>
      section.id === sectionId ? { ...section, content } : section
    )

    set({
      generatedContent: {
        ...generatedContent,
        content: updatedSections
      }
    })
  },

  reorderContentSections: (sectionIds: string[]) => {
    const { generatedContent } = get()
    if (!generatedContent || !generatedContent.content) return

    // Create a map for quick lookup
    const sectionMap = new Map(
      generatedContent.content.map(section => [section.id, section])
    )

    // Reorder sections based on the provided order
    const reorderedSections = sectionIds
      .map(id => sectionMap.get(id))
      .filter(Boolean)
      .map((section, index) => ({ ...section!, order: index + 1 }))

    set({
      generatedContent: {
        ...generatedContent,
        content: reorderedSections
      }
    })
  }
}))

// Initialize store with saved settings
const savedSettings = localStorage.getItem('contentCreator_defaultSettings')
if (savedSettings) {
  try {
    const parsedSettings = JSON.parse(savedSettings)
    useContentCreatorStore.getState().updateDefaultSettings(parsedSettings)
  } catch (error) {
    console.error('Failed to load saved settings:', error)
  }
}
