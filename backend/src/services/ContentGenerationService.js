// Content Generation Service - AI-powered content creation
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../utils/logger.js'
import crypto from 'crypto'

export class ContentGenerationService {
  constructor() {
    this.providers = {
      openai: null,
      anthropic: null,
      google: null
    }
    
    this.initializeProviders()
  }

  /**
   * Initialize AI providers
   */
  initializeProviders() {
    try {
      // OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.providers.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        logger.info('✅ OpenAI initialized for content generation')
      }

      // Anthropic
      if (process.env.ANTHROPIC_API_KEY) {
        this.providers.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        })
        logger.info('✅ Anthropic initialized for content generation')
      }

      // Google (placeholder for future implementation)
      if (process.env.GOOGLE_AI_API_KEY) {
        logger.info('✅ Google AI API key configured (using OpenAI as processor)')
      }

    } catch (error) {
      logger.error('❌ Error initializing AI providers for content generation:', error)
    }
  }

  /**
   * Get available providers for content generation
   */
  getAvailableProviders() {
    const available = []
    if (this.providers.openai) available.push('openai')
    if (this.providers.anthropic) available.push('anthropic')
    if (this.providers.google) available.push('google')
    return available
  }

  /**
   * Build dynamic prompt from template and user inputs
   */
  buildPromptFromTemplate(template, userInputs, generationSettings = {}) {
    try {
      let prompt = template.prompt_template
      
      // Replace placeholders with user inputs
      Object.entries(userInputs).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g')
        prompt = prompt.replace(placeholder, value || '')
      })
      
      // Replace generation settings placeholders
      Object.entries(generationSettings).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g')
        prompt = prompt.replace(placeholder, value || '')
      })
      
      // Add content structure instructions
      if (template.output_structure && template.output_structure.length > 0) {
        prompt += `\n\nStructure the content with these sections:\n`
        template.output_structure.forEach(section => {
          prompt += `- ${section.name} (${section.type}): ${section.name}\n`
        })
      }
      
      // Add generation guidelines
      prompt += `\n\nGeneration Guidelines:
- Write engaging, professional content that matches the specified tone
- Ensure content is ready for publication without major editing
- Include specific calls-to-action where appropriate
- Make the content scannable with clear structure
- Aim for approximately ${template.estimated_words || 500} words
- Write for ${generationSettings.audience || 'general'} audience`

      return prompt
      
    } catch (error) {
      logger.error('❌ Error building prompt from template:', error)
      throw new Error('Failed to build content generation prompt')
    }
  }

  /**
   * Generate content using AI with enhanced error handling and retry logic
   */
  async generateContent(template, userInputs, generationSettings = {}, options = {}) {
    const startTime = Date.now()
    let attempt = 0
    const maxRetries = 3
    
    while (attempt < maxRetries) {
      try {
        attempt++
        logger.info(`🎨 Starting content generation for template: ${template.template_id} (attempt ${attempt}/${maxRetries})`)
        
        // Validate inputs
        this.validateGenerationInputs(template, userInputs, generationSettings)
        
        // Detect language if provided in options
        const targetLanguage = options.language || generationSettings.language || 'en'
        
        // Build the enhanced prompt
        const prompt = this.buildPromptFromTemplate(template, userInputs, generationSettings)
        
        // Generate cache key for future caching implementation
        const cacheKey = crypto.createHash('sha256')
          .update(prompt + JSON.stringify(generationSettings))
          .digest('hex')
        
        // Select AI provider with fallback
        const provider = this.selectProvider(options.preferredProvider)
        
        if (!provider) {
          throw new Error('No AI providers available for content generation')
        }
        
        let response = ''
        let tokenCount = 0
        let modelUsed = 'unknown'
        let costEstimate = 0
        
        if (provider === 'openai' && this.providers.openai) {
          const result = await this.generateWithOpenAI(template, prompt, generationSettings, options)
          response = result.content
          tokenCount = result.tokenCount
          modelUsed = result.model
          costEstimate = result.cost
          
        } else if (provider === 'anthropic' && this.providers.anthropic) {
          const result = await this.generateWithAnthropic(template, prompt, generationSettings, options)
          response = result.content
          tokenCount = result.tokenCount
          modelUsed = result.model
          costEstimate = result.cost
          
        } else {
          throw new Error(`Provider ${provider} not available or not initialized`)
        }
        
        // Validate and parse the generated content
        const parsedContent = this.parseGeneratedContent(response, template.output_structure)
        
        // Calculate generation metrics
        const generationTime = Date.now() - startTime
        const wordCount = this.countWords(response)
        const characterCount = response.length
        
        const result = {
          success: true,
          content: {
            sections: parsedContent.sections,
            raw_content: response,
            formatted_content: this.formatContent(parsedContent.sections, ['html', 'markdown'])
          },
          metadata: {
            templateId: template.template_id,
            provider,
            model: modelUsed,
            tokenCount,
            generationTime,
            costEstimate,
            wordCount,
            characterCount,
            estimatedReadingTime: Math.ceil(wordCount / 200),
            cacheKey,
            attempt,
            generatedAt: new Date().toISOString()
          },
          settings: generationSettings
        }
        
        logger.info(`✅ Content generation completed successfully`, {
          templateId: template.template_id,
          provider,
          model: modelUsed,
          wordCount,
          tokenCount,
          generationTime: `${generationTime}ms`,
          cost: `$${costEstimate.toFixed(4)}`,
          attempt
        })
        
        return result
        
      } catch (error) {
        logger.error(`❌ Content generation attempt ${attempt} failed:`, {
          templateId: template.template_id,
          error: error.message,
          stack: error.stack,
          attempt,
          maxRetries
        })
        
        // If this was the last attempt or a non-retryable error, throw
        if (attempt >= maxRetries || this.isNonRetryableError(error)) {
          const totalTime = Date.now() - startTime
          
          return {
            success: false,
            error: error.message,
            metadata: {
              templateId: template.template_id,
              totalAttempts: attempt,
              totalTime,
              lastError: error.message,
              failedAt: new Date().toISOString()
            }
          }
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10s
        logger.info(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Generate content using OpenAI GPT-4
   */
  async generateWithOpenAI(template, prompt, generationSettings, options = {}) {
    try {
      const modelUsed = options.model || generationSettings.model || 'gpt-4o'
      const temperature = Math.min(Math.max(generationSettings.temperature || 0.7, 0.0), 1.0)
      const maxTokens = this.calculateMaxTokens(
        generationSettings.maxTokens || template.estimated_words || 1000
      )
      
      logger.info(`🤖 Calling OpenAI API`, {
        model: modelUsed,
        temperature,
        maxTokens,
        promptLength: prompt.length
      })
      
      // Add language instruction to system message
      const targetLanguage = options.language || generationSettings.language || 'en'
      const languageInstructions = {
        en: ' Generate content in English. Use proper English grammar and idioms.',
        lt: ' Generuok turinį lietuvių kalba. Naudok taisyklingą lietuvių kalbos gramatiką ir idiomas.',
        es: ' Genera contenido en español. Usa gramática e idiomas españoles adecuados.',
        fr: ' Générez du contenu en français. Utilisez une grammaire et des idiomes français appropriés.',
        de: ' Generieren Sie Inhalte auf Deutsch. Verwenden Sie korrekte deutsche Grammatik und Redewendungen.'
      }
      const languageInstruction = languageInstructions[targetLanguage] || languageInstructions.en
      
      const completion = await this.providers.openai.chat.completions.create({
        model: modelUsed,
        messages: [
          {
            role: 'system',
            content: this.buildSystemMessage(template, generationSettings) + languageInstruction
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        stream: false
      })
      
      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('No content generated by OpenAI')
      }
      
      const content = completion.choices[0].message.content
      if (!content || content.trim().length === 0) {
        throw new Error('Empty content generated by OpenAI')
      }
      
      const tokenCount = completion.usage?.total_tokens || 0
      const cost = this.calculateCost('openai', tokenCount, modelUsed)
      
      return {
        content,
        tokenCount,
        model: modelUsed,
        cost,
        usage: completion.usage
      }
      
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      } else if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.')
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request to OpenAI: ${error.response.data?.error?.message || error.message}`)
      }
      
      logger.error('OpenAI API error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      
      throw new Error(`OpenAI generation failed: ${error.message}`)
    }
  }

  /**
   * Generate content using Anthropic Claude
   */
  async generateWithAnthropic(template, prompt, generationSettings, options = {}) {
    try {
      const modelUsed = options.model || generationSettings.model || 'claude-3-sonnet-20240229'
      const temperature = Math.min(Math.max(generationSettings.temperature || 0.7, 0.0), 1.0)
      const maxTokens = this.calculateMaxTokens(
        generationSettings.maxTokens || template.estimated_words || 1000
      )
      
      logger.info(`🤖 Calling Anthropic API`, {
        model: modelUsed,
        temperature,
        maxTokens,
        promptLength: prompt.length
      })
      
      const completion = await this.providers.anthropic.messages.create({
        model: modelUsed,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: `${this.buildSystemMessage(template, generationSettings)}\n\n${prompt}`
          }
        ]
      })
      
      if (!completion.content || completion.content.length === 0) {
        throw new Error('No content generated by Anthropic')
      }
      
      const content = completion.content[0].text
      if (!content || content.trim().length === 0) {
        throw new Error('Empty content generated by Anthropic')
      }
      
      const tokenCount = completion.usage?.input_tokens + completion.usage?.output_tokens || 0
      const cost = this.calculateCost('anthropic', tokenCount, modelUsed)
      
      return {
        content,
        tokenCount,
        model: modelUsed,
        cost,
        usage: completion.usage
      }
      
    } catch (error) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      } else if (error.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your configuration.')
      } else if (error.status === 400) {
        throw new Error(`Invalid request to Anthropic: ${error.message}`)
      }
      
      logger.error('Anthropic API error:', {
        status: error.status,
        message: error.message
      })
      
      throw new Error(`Anthropic generation failed: ${error.message}`)
    }
  }

  /**
   * Build enhanced system message for AI
   */
  buildSystemMessage(template, generationSettings) {
    const tone = generationSettings.tone || 'professional'
    const style = generationSettings.style || 'detailed'
    const audience = generationSettings.audience || 'general'
    const language = generationSettings.language || 'en'
    
    const languageInstructions = {
      'en': 'Write in clear, natural English.',
      'lt': 'Rašyk aiškia, natūralia lietuvių kalba.',
      'es': 'Escribe en español claro y natural.',
      'fr': 'Écrivez en français clair et naturel.',
      'de': 'Schreiben Sie in klarem, natürlichem Deutsch.'
    }
    
    return `You are a professional content writer specializing in ${template.category} content.

CONTENT REQUIREMENTS:
- Template: ${template.name} (${template.description})
- Tone: ${tone}
- Style: ${style}
- Target Audience: ${audience}
- Language: ${languageInstructions[language] || languageInstructions['en']}
- Estimated Length: ~${template.estimated_words || 500} words

WRITING GUIDELINES:
1. Create engaging, publication-ready content that requires minimal editing
2. Match the specified tone and style throughout
3. Write for the target audience's knowledge level and interests
4. Include specific, actionable calls-to-action where appropriate
5. Use clear structure with scannable headings and paragraphs
6. Ensure content flows naturally and maintains reader engagement
7. Include relevant examples or specifics when possible

CONTENT STRUCTURE:
Generate content following this exact structure:
${template.output_structure?.map(section => `- ${section.name} (${section.type})`).join('\n') || '- Main content sections as appropriate'}

QUALITY STANDARDS:
- Professional quality suitable for publication
- Engaging and informative content
- Clear value proposition
- Compelling calls-to-action
- SEO-friendly but natural language
- Brand-appropriate messaging

Generate comprehensive, high-quality content that exceeds expectations.`
  }

  /**
   * Validate generation inputs
   */
  validateGenerationInputs(template, userInputs, generationSettings) {
    if (!template) {
      throw new Error('Template is required for content generation')
    }
    
    if (!template.template_id) {
      throw new Error('Template must have a valid template_id')
    }
    
    // Check required fields
    const missingFields = template.input_fields?.filter(field => 
      field.required && (!userInputs[field.name] || userInputs[field.name].trim() === '')
    ) || []
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.map(f => f.label || f.name).join(', ')}`)
    }
    
    // Validate generation settings
    if (generationSettings.temperature !== undefined) {
      if (typeof generationSettings.temperature !== 'number' || 
          generationSettings.temperature < 0 || 
          generationSettings.temperature > 1) {
        throw new Error('Temperature must be a number between 0 and 1')
      }
    }
    
    if (generationSettings.maxTokens !== undefined) {
      if (typeof generationSettings.maxTokens !== 'number' || 
          generationSettings.maxTokens < 100 || 
          generationSettings.maxTokens > 4000) {
        throw new Error('Max tokens must be a number between 100 and 4000')
      }
    }
  }

  /**
   * Parse generated content into structured sections
   */
  parseGeneratedContent(rawContent, outputStructure) {
    try {
      logger.info('📝 Parsing generated content', {
        contentLength: rawContent.length,
        structureCount: outputStructure?.length || 0
      })
      
      // If no structure, return as single section
      if (!outputStructure || outputStructure.length === 0) {
        return {
          sections: [{
            id: 'content',
            name: 'Generated Content',
            type: 'paragraph',
            content: rawContent.trim(),
            editable: true,
            order: 1
          }]
        }
      }
      
      // Try to split by markdown headers first (most reliable)
      const headerRegex = /^#{1,3}\s+(.+)$/gm
      const headerMatches = [...rawContent.matchAll(headerRegex)]
      
      logger.info('🔍 Found markdown headers:', headerMatches.length)
      
      if (headerMatches.length >= outputStructure.length - 1) {
        // We have enough headers to split properly
        const sections = []
        let lastIndex = 0
        
        for (let i = 0; i < outputStructure.length; i++) {
          const structure = outputStructure[i]
          const nextMatch = headerMatches[i]
          
          let content = ''
          if (nextMatch) {
            const startIndex = nextMatch.index
            const endIndex = headerMatches[i + 1]?.index || rawContent.length
            content = rawContent.substring(startIndex, endIndex).trim()
          } else if (i === 0) {
            // First section, take everything before first header or all content
            const endIndex = headerMatches[0]?.index || rawContent.length
            content = rawContent.substring(0, endIndex).trim()
          } else {
            // Last section, take remaining content
            content = rawContent.substring(lastIndex).trim()
          }
          
          if (content) {
            sections.push({
              id: structure.id || `section_${i}`,
              name: structure.name,
              type: structure.type || 'paragraph',
              content: content,
              editable: structure.editable !== false,
              order: structure.order || i + 1
            })
          }
          
          if (nextMatch) {
            lastIndex = nextMatch.index + nextMatch[0].length
          }
        }
        
        if (sections.length > 0) {
          logger.info('✅ Parsed with markdown headers:', sections.length)
          return { sections }
        }
      }
      
      // Fallback 1: Split by double newlines (paragraph breaks)
      const paragraphs = rawContent.split(/\n\n+/).filter(p => p.trim())
      
      logger.info('📄 Splitting by paragraphs:', paragraphs.length)
      
      if (paragraphs.length >= outputStructure.length) {
        // Map paragraphs to structure
        const sections = outputStructure.map((struct, idx) => ({
          id: struct.id || `section_${idx}`,
          name: struct.name,
          type: struct.type || 'paragraph',
          content: paragraphs[idx] || '',
          editable: struct.editable !== false,
          order: struct.order || idx + 1
        })).filter(s => s.content.trim())
        
        if (sections.length > 0) {
          logger.info('✅ Parsed by paragraphs:', sections.length)
          return { sections }
        }
      }
      
      // Fallback 2: Distribute content evenly across sections
      const words = rawContent.split(/\s+/)
      const wordsPerSection = Math.ceil(words.length / outputStructure.length)
      
      logger.info('📊 Distributing words evenly:', { totalWords: words.length, wordsPerSection })
      
      const sections = outputStructure.map((struct, idx) => {
        const start = idx * wordsPerSection
        const end = Math.min((idx + 1) * wordsPerSection, words.length)
        const content = words.slice(start, end).join(' ')
        
        return {
          id: struct.id || `section_${idx}`,
          name: struct.name,
          type: struct.type || 'paragraph',
          content: content.trim(),
          editable: struct.editable !== false,
          order: struct.order || idx + 1
        }
      }).filter(s => s.content)
      
      if (sections.length > 0) {
        logger.info('✅ Distributed content across sections:', sections.length)
        return { sections }
      }
      
      // Ultimate fallback: Put all content in first section
      logger.warn('⚠️ Using ultimate fallback - single section with all content')
      return {
        sections: [{
          id: outputStructure[0]?.id || 'content',
          name: outputStructure[0]?.name || 'Content',
          type: outputStructure[0]?.type || 'paragraph',
          content: rawContent.trim(),
          editable: true,
          order: 1
        }]
      }
      
    } catch (error) {
      logger.error('❌ Error parsing generated content:', error)
      
      // Absolute fallback: return raw content as single section
      return {
        sections: [{
          id: 'content',
          name: 'Generated Content',
          type: 'paragraph',
          content: rawContent.trim(),
          editable: true,
          order: 1
        }]
      }
    }
  }

  /**
   * Format content for different export types
   */
  formatContent(sections, formats = ['html']) {
    const formatted = {}
    
    for (const format of formats) {
      switch (format) {
        case 'html':
          formatted.html = sections.map(section => {
            switch (section.type) {
              case 'heading':
                return `<h2>${section.content}</h2>`
              case 'paragraph':
                return `<p>${section.content}</p>`
              case 'list':
                const items = section.content.split('\n').filter(item => item.trim())
                return `<ul>${items.map(item => `<li>${item.replace(/^[•\-\*]\s*/, '')}</li>`).join('')}</ul>`
              case 'cta':
                return `<div class="cta"><strong>${section.content}</strong></div>`
              default:
                return `<div>${section.content}</div>`
            }
          }).join('\n\n')
          break
          
        case 'markdown':
          formatted.markdown = sections.map(section => {
            switch (section.type) {
              case 'heading':
                return `## ${section.content}`
              case 'paragraph':
                return section.content
              case 'list':
                return section.content.split('\n').filter(item => item.trim())
                  .map(item => `- ${item.replace(/^[•\-\*]\s*/, '')}`).join('\n')
              case 'cta':
                return `**${section.content}**`
              default:
                return section.content
            }
          }).join('\n\n')
          break
      }
    }
    
    return formatted
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Check if an error is non-retryable
   */
  isNonRetryableError(error) {
    const nonRetryableMessages = [
      'Invalid API key',
      'Missing required fields',
      'Template is required',
      'Invalid request to'
    ]
    
    return nonRetryableMessages.some(msg => error.message.includes(msg))
  }

  /**
   * Select the best available AI provider
   */
  selectProvider(preferredProvider = null) {
    // If a specific provider is requested and available, use it
    if (preferredProvider && this.providers[preferredProvider]) {
      return preferredProvider
    }
    
    // Fallback priority: OpenAI → Anthropic → Google
    if (this.providers.openai) return 'openai'
    if (this.providers.anthropic) return 'anthropic'
    if (this.providers.google) return 'google'
    
    return null
  }

  /**
   * Calculate maximum tokens based on word estimate
   */
  calculateMaxTokens(estimatedWords) {
    // Rule of thumb: 1 word ≈ 1.3 tokens
    // Add buffer for formatting and structure
    const baseTokens = Math.ceil(estimatedWords * 1.3)
    const bufferedTokens = Math.ceil(baseTokens * 1.5) // 50% buffer
    
    // Clamp between reasonable limits
    return Math.min(Math.max(bufferedTokens, 500), 4000)
  }

  /**
   * Calculate estimated cost for AI generation
   */
  calculateCost(provider, tokenCount, model = '') {
    // Pricing as of 2024 (approximate, per 1K tokens)
    const pricing = {
      openai: {
        'gpt-4o': { input: 0.0025, output: 0.01 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
      },
      anthropic: {
        'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
        'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
      },
      google: {
        'gemini-pro': { input: 0.001, output: 0.002 }
      }
    }
    
    try {
      const providerPricing = pricing[provider]
      if (!providerPricing) {
        return (tokenCount / 1000) * 0.002 // Default rate
      }
      
      const modelPricing = providerPricing[model] || Object.values(providerPricing)[0]
      // Assume 50/50 input/output split for simplicity
      const avgRate = (modelPricing.input + modelPricing.output) / 2
      return (tokenCount / 1000) * avgRate
      
    } catch (error) {
      return (tokenCount / 1000) * 0.002 // Default rate
    }
  }

  /**
   * Generate content for a specific section (for regeneration)
   */
  async regenerateSection(template, sectionId, userInputs, generationSettings = {}, options = {}) {
    try {
      logger.info(`🔄 Regenerating section: ${sectionId} for template: ${template.template_id}`)
      
      // Find the specific section structure
      const sectionStructure = template.output_structure?.find(s => s.id === sectionId)
      if (!sectionStructure) {
        throw new Error(`Section ${sectionId} not found in template structure`)
      }
      
      // Build focused prompt for this section
      const sectionPrompt = this.buildSectionPrompt(template, sectionStructure, userInputs, generationSettings)
      
      // Create a mini-template for just this section
      const sectionTemplate = {
        ...template,
        output_structure: [sectionStructure],
        estimated_words: Math.ceil(template.estimated_words / template.output_structure.length)
      }
      
      // Generate content for this section
      const result = await this.generateContent(sectionTemplate, userInputs, generationSettings, options)
      
      if (result.success) {
        logger.info(`✅ Section regeneration completed: ${sectionId}`)
        return {
          success: true,
          section: {
            id: sectionId,
            ...sectionStructure,
            content: result.content.sections[0]?.content || result.content.raw_content
          },
          metadata: result.metadata
        }
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      logger.error(`❌ Section regeneration failed for ${sectionId}:`, error)
      
      return {
        success: false,
        error: error.message,
        sectionId
      }
    }
  }

  /**
   * Build a focused prompt for section regeneration
   */
  buildSectionPrompt(template, sectionStructure, userInputs, generationSettings) {
    const basePrompt = this.buildPromptFromTemplate(template, userInputs, generationSettings)
    
    return `${basePrompt}\n\nFocus specifically on generating content for the "${sectionStructure.name}" section (${sectionStructure.type}). This section should be approximately ${Math.ceil(template.estimated_words / template.output_structure.length)} words and should integrate well with the overall content theme.`
  }
}

// Create and export singleton instance
export const contentGenerationService = new ContentGenerationService()