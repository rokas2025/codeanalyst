import type { 
  ContentTemplate, 
  GeneratedContent, 
  GenerationRequest, 
  GenerationResponse,
  GenerationSettings,
  ContentExportOptions
} from '../types/contentCreator'

export class ContentCreatorService {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'ngrok-skip-browser-warning': 'true'
    }
  }

  /**
   * Get available content templates
   */
  async getTemplates(category?: string): Promise<ContentTemplate[]> {
    try {
      const url = new URL(`${this.baseUrl}/content-creator/templates`)
      if (category) {
        url.searchParams.set('category', category)
      }

      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      return data.templates
    } catch (error) {
      console.error('Error fetching templates:', error)
      // Return mock templates for development
      return this.getMockTemplates()
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<ContentTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/content-creator/templates/${id}`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch template')
      }

      return data.template
    } catch (error) {
      console.error('Error fetching template:', error)
      // Return mock template for development
      const templates = this.getMockTemplates()
      const template = templates.find(t => t.id === id)
      if (!template) {
        throw new Error('Template not found')
      }
      return template
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('🚀 Generating content with request:', request)

      const response = await fetch(`${this.baseUrl}/content-creator/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content')
      }

      console.log('✅ Content generated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Error generating content:', error)
      
      // Return mock response for development/demo
      return this.getMockGenerationResponse(request)
    }
  }

  /**
   * Save generated content
   */
  async saveContent(content: GeneratedContent): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/content-creator/content`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(content)
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save content')
      }

      return data.id
    } catch (error) {
      console.error('Error saving content:', error)
      // Return mock ID for development
      return 'mock-' + Date.now()
    }
  }

  /**
   * Get user's content history
   */
  async getContentHistory(limit = 20): Promise<GeneratedContent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/content-creator/content?limit=${limit}`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch content history')
      }

      return data.content
    } catch (error) {
      console.error('Error fetching content history:', error)
      return []
    }
  }

  /**
   * Export content in different formats
   */
  async exportContent(
    contentId: string, 
    options: ContentExportOptions
  ): Promise<{ content: string; filename: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/content-creator/content/${contentId}/export`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(options)
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export content')
      }

      return {
        content: data.content,
        filename: data.filename
      }
    } catch (error) {
      console.error('Error exporting content:', error)
      throw error
    }
  }

  /**
   * Validate API configuration
   */
  async validateApiConfig(): Promise<{ valid: boolean; provider: string; model?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/content-creator/validate-config`, {
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      return {
        valid: data.success,
        provider: data.provider || 'openai',
        model: data.model
      }
    } catch (error) {
      console.error('Error validating API config:', error)
      return { valid: false, provider: 'openai' }
    }
  }

  /**
   * Mock templates for development
   */
  private getMockTemplates(): ContentTemplate[] {
    return [
      {
        id: 'about-us',
        name: 'About Us Page',
        description: 'Professional company introduction and story',
        category: 'website',
        icon: '🏢',
        inputFields: [
          {
            name: 'companyName',
            type: 'text',
            label: 'Company Name',
            placeholder: 'e.g., TechCorp Solutions',
            required: true
          },
          {
            name: 'industry',
            type: 'text',
            label: 'Industry',
            placeholder: 'e.g., Software Development, Marketing, Healthcare',
            required: true
          },
          {
            name: 'foundedYear',
            type: 'number',
            label: 'Founded Year',
            placeholder: '2020',
            required: false
          },
          {
            name: 'mission',
            type: 'textarea',
            label: 'Mission/Purpose',
            placeholder: 'What does your company do and why?',
            required: true
          },
          {
            name: 'values',
            type: 'textarea',
            label: 'Core Values',
            placeholder: 'List 3-5 core company values',
            required: false
          },
          {
            name: 'teamSize',
            type: 'select',
            label: 'Team Size',
            placeholder: 'Select team size',
            required: false,
            options: ['1-5 employees', '6-20 employees', '21-50 employees', '51-200 employees', '200+ employees']
          }
        ],
        promptTemplate: `Write a professional "About Us" page for {{companyName}}, a {{industry}} company founded in {{foundedYear}}. 

Company mission: {{mission}}
Core values: {{values}}
Team size: {{teamSize}}

The content should include:
1. Company introduction and story
2. Mission and purpose
3. Core values and what makes us unique
4. Brief team introduction
5. Call-to-action for potential clients/customers

Tone: {{tone}}
Style: {{style}}
Target audience: {{audience}}`,
        outputStructure: [
          { id: 'hero', name: 'Hero Section', type: 'heading', content: '', editable: true, order: 1 },
          { id: 'story', name: 'Company Story', type: 'paragraph', content: '', editable: true, order: 2 },
          { id: 'mission', name: 'Mission Statement', type: 'paragraph', content: '', editable: true, order: 3 },
          { id: 'values', name: 'Core Values', type: 'list', content: '', editable: true, order: 4 },
          { id: 'team', name: 'Team Introduction', type: 'paragraph', content: '', editable: true, order: 5 },
          { id: 'cta', name: 'Call to Action', type: 'cta', content: '', editable: true, order: 6 }
        ],
        defaultSettings: {
          temperature: 0.7,
          tone: 'professional',
          style: 'detailed',
          audience: 'general'
        },
        estimatedWords: 800,
        difficulty: 'beginner'
      },
      {
        id: 'product-description',
        name: 'Product Description',
        description: 'Compelling product descriptions that convert',
        category: 'ecommerce',
        icon: '📦',
        inputFields: [
          {
            name: 'productName',
            type: 'text',
            label: 'Product Name',
            placeholder: 'e.g., Wireless Bluetooth Headphones',
            required: true
          },
          {
            name: 'productType',
            type: 'text',
            label: 'Product Category',
            placeholder: 'e.g., Electronics, Clothing, Home & Garden',
            required: true
          },
          {
            name: 'keyFeatures',
            type: 'textarea',
            label: 'Key Features',
            placeholder: 'List the main features and specifications',
            required: true
          },
          {
            name: 'benefits',
            type: 'textarea',
            label: 'Benefits',
            placeholder: 'How does this product help customers?',
            required: true
          },
          {
            name: 'targetAudience',
            type: 'text',
            label: 'Target Audience',
            placeholder: 'e.g., Fitness enthusiasts, Business professionals',
            required: true
          },
          {
            name: 'priceRange',
            type: 'select',
            label: 'Price Range',
            placeholder: 'Select price range',
            required: false,
            options: ['Budget ($0-50)', 'Mid-range ($50-200)', 'Premium ($200-500)', 'Luxury ($500+)']
          }
        ],
        promptTemplate: `Write a compelling product description for {{productName}}, a {{productType}} product.

Key features: {{keyFeatures}}
Benefits: {{benefits}}
Target audience: {{targetAudience}}
Price range: {{priceRange}}

The description should:
1. Hook the reader with the main benefit
2. Highlight key features and specifications
3. Explain benefits and use cases
4. Address potential objections
5. Include a strong call-to-action

Tone: {{tone}}
Style: {{style}}
CTA strength: {{ctaStrength}}`,
        outputStructure: [
          { id: 'headline', name: 'Product Headline', type: 'heading', content: '', editable: true, order: 1 },
          { id: 'hook', name: 'Opening Hook', type: 'paragraph', content: '', editable: true, order: 2 },
          { id: 'features', name: 'Key Features', type: 'list', content: '', editable: true, order: 3 },
          { id: 'benefits', name: 'Benefits', type: 'paragraph', content: '', editable: true, order: 4 },
          { id: 'social-proof', name: 'Social Proof', type: 'quote', content: '', editable: true, order: 5 },
          { id: 'cta', name: 'Call to Action', type: 'cta', content: '', editable: true, order: 6 }
        ],
        defaultSettings: {
          temperature: 0.8,
          tone: 'persuasive',
          style: 'detailed',
          audience: 'consumer',
          ctaStrength: 'strong'
        },
        estimatedWords: 600,
        difficulty: 'intermediate'
      },
      {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'SEO-optimized blog posts that engage readers',
        category: 'blog',
        icon: '📝',
        inputFields: [
          {
            name: 'topic',
            type: 'text',
            label: 'Blog Topic',
            placeholder: 'e.g., 10 Tips for Remote Work Productivity',
            required: true
          },
          {
            name: 'keywords',
            type: 'text',
            label: 'Target Keywords',
            placeholder: 'e.g., remote work, productivity, work from home',
            required: true
          },
          {
            name: 'audience',
            type: 'text',
            label: 'Target Audience',
            placeholder: 'e.g., Remote workers, Entrepreneurs, Students',
            required: true
          },
          {
            name: 'wordCount',
            type: 'select',
            label: 'Article Length',
            placeholder: 'Select preferred length',
            required: true,
            options: ['Short (500-800 words)', 'Medium (800-1500 words)', 'Long (1500-3000 words)']
          },
          {
            name: 'purpose',
            type: 'select',
            label: 'Article Purpose',
            placeholder: 'What should this article achieve?',
            required: true,
            options: ['Educate/Inform', 'Entertain', 'Persuade/Convert', 'Inspire/Motivate', 'How-to Guide']
          }
        ],
        promptTemplate: `Write a {{wordCount}} blog post about "{{topic}}" targeting {{audience}}.

Target keywords: {{keywords}}
Purpose: {{purpose}}

The blog post should include:
1. Compelling headline with target keyword
2. Engaging introduction that hooks the reader
3. Well-structured main content with subheadings
4. Practical tips or actionable advice
5. Conclusion with key takeaways
6. Call-to-action for reader engagement

Tone: {{tone}}
Style: {{style}}
Optimize for SEO while maintaining readability.`,
        outputStructure: [
          { id: 'headline', name: 'Blog Headline', type: 'heading', content: '', editable: true, order: 1 },
          { id: 'introduction', name: 'Introduction', type: 'paragraph', content: '', editable: true, order: 2 },
          { id: 'main-content', name: 'Main Content', type: 'paragraph', content: '', editable: true, order: 3 },
          { id: 'tips', name: 'Key Tips/Points', type: 'list', content: '', editable: true, order: 4 },
          { id: 'conclusion', name: 'Conclusion', type: 'paragraph', content: '', editable: true, order: 5 },
          { id: 'cta', name: 'Call to Action', type: 'cta', content: '', editable: true, order: 6 }
        ],
        defaultSettings: {
          temperature: 0.7,
          tone: 'conversational',
          style: 'detailed',
          audience: 'general'
        },
        estimatedWords: 1200,
        difficulty: 'intermediate'
      },
      {
        id: 'landing-page',
        name: 'Landing Page',
        description: 'High-converting landing pages for campaigns',
        category: 'marketing',
        icon: '🎯',
        inputFields: [
          {
            name: 'offer',
            type: 'text',
            label: 'Main Offer',
            placeholder: 'e.g., Free 30-day trial, 50% discount, Free eBook',
            required: true
          },
          {
            name: 'product',
            type: 'text',
            label: 'Product/Service',
            placeholder: 'e.g., Project management software, Marketing course',
            required: true
          },
          {
            name: 'targetPain',
            type: 'textarea',
            label: 'Target Pain Point',
            placeholder: 'What problem does your product solve?',
            required: true
          },
          {
            name: 'benefits',
            type: 'textarea',
            label: 'Key Benefits',
            placeholder: 'List 3-5 main benefits customers get',
            required: true
          },
          {
            name: 'urgency',
            type: 'select',
            label: 'Urgency Level',
            placeholder: 'How urgent is the offer?',
            required: false,
            options: ['Low urgency', 'Medium urgency', 'High urgency (limited time)', 'Extreme urgency (today only)']
          }
        ],
        promptTemplate: `Create a high-converting landing page for {{product}} with the offer: {{offer}}

Target pain point: {{targetPain}}
Key benefits: {{benefits}}
Urgency level: {{urgency}}

The landing page should include:
1. Attention-grabbing headline with the main benefit
2. Subheadline explaining the offer
3. Problem/pain point identification
4. Solution presentation with benefits
5. Social proof elements
6. Strong call-to-action with urgency
7. Risk reversal or guarantee

Tone: {{tone}}
CTA strength: {{ctaStrength}}
Focus on conversion optimization.`,
        outputStructure: [
          { id: 'headline', name: 'Main Headline', type: 'heading', content: '', editable: true, order: 1 },
          { id: 'subheadline', name: 'Subheadline', type: 'paragraph', content: '', editable: true, order: 2 },
          { id: 'problem', name: 'Problem Statement', type: 'paragraph', content: '', editable: true, order: 3 },
          { id: 'solution', name: 'Solution & Benefits', type: 'list', content: '', editable: true, order: 4 },
          { id: 'social-proof', name: 'Social Proof', type: 'quote', content: '', editable: true, order: 5 },
          { id: 'cta-primary', name: 'Primary CTA', type: 'cta', content: '', editable: true, order: 6 },
          { id: 'guarantee', name: 'Risk Reversal', type: 'paragraph', content: '', editable: true, order: 7 }
        ],
        defaultSettings: {
          temperature: 0.8,
          tone: 'persuasive',
          style: 'detailed',
          audience: 'consumer',
          ctaStrength: 'aggressive'
        },
        estimatedWords: 1000,
        difficulty: 'advanced'
      },
      {
        id: 'service-description',
        name: 'Service Description',
        description: 'Professional service pages that build trust',
        category: 'website',
        icon: '🛠️',
        inputFields: [
          {
            name: 'serviceName',
            type: 'text',
            label: 'Service Name',
            placeholder: 'e.g., Digital Marketing Consulting, Web Development',
            required: true
          },
          {
            name: 'serviceType',
            type: 'select',
            label: 'Service Type',
            placeholder: 'What type of service is this?',
            required: true,
            options: ['Consulting', 'Development', 'Design', 'Marketing', 'Support', 'Training', 'Other']
          },
          {
            name: 'process',
            type: 'textarea',
            label: 'Service Process',
            placeholder: 'Describe how you deliver this service (3-5 steps)',
            required: true
          },
          {
            name: 'deliverables',
            type: 'textarea',
            label: 'What You Deliver',
            placeholder: 'What will clients receive?',
            required: true
          },
          {
            name: 'experience',
            type: 'text',
            label: 'Years of Experience',
            placeholder: 'e.g., 5+ years, Over a decade',
            required: false
          }
        ],
        promptTemplate: `Write a professional service page for {{serviceName}}, a {{serviceType}} service.

Service process: {{process}}
What we deliver: {{deliverables}}
Experience: {{experience}}

The service page should include:
1. Service overview and value proposition
2. Clear explanation of what's included
3. Step-by-step process description
4. Benefits and outcomes for clients
5. Trust indicators and experience
6. Clear next steps and contact information

Tone: {{tone}}
Style: {{style}}
Target audience: {{audience}}`,
        outputStructure: [
          { id: 'overview', name: 'Service Overview', type: 'paragraph', content: '', editable: true, order: 1 },
          { id: 'included', name: 'What\'s Included', type: 'list', content: '', editable: true, order: 2 },
          { id: 'process', name: 'Our Process', type: 'list', content: '', editable: true, order: 3 },
          { id: 'benefits', name: 'Benefits & Outcomes', type: 'paragraph', content: '', editable: true, order: 4 },
          { id: 'experience', name: 'Experience & Trust', type: 'paragraph', content: '', editable: true, order: 5 },
          { id: 'cta', name: 'Get Started', type: 'cta', content: '', editable: true, order: 6 }
        ],
        defaultSettings: {
          temperature: 0.6,
          tone: 'professional',
          style: 'detailed',
          audience: 'executive'
        },
        estimatedWords: 700,
        difficulty: 'intermediate'
      }
    ]
  }

  /**
   * Mock generation response for development
   */
  private getMockGenerationResponse(request: GenerationRequest): GenerationResponse {
    const template = this.getMockTemplates().find(t => t.id === request.templateId)
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      }
    }

    // Simulate AI generation delay
    setTimeout(() => {}, 2000)

    const mockContent: GeneratedContent = {
      id: 'generated-' + Date.now(),
      templateId: request.templateId,
      title: `Generated ${template.name}`,
      content: template.outputStructure.map(section => ({
        ...section,
        content: this.generateMockContent(section.type, request.inputs, template.name)
      })),
      settings: request.settings,
      inputs: request.inputs,
      metadata: {
        wordCount: Math.floor(Math.random() * 500) + 500,
        readingTime: 3,
        seoScore: Math.floor(Math.random() * 30) + 70,
        generatedAt: new Date().toISOString(),
        tokensUsed: Math.floor(Math.random() * 1000) + 500,
        cost: 0.02
      },
      status: 'generated',
      versions: []
    }

    return {
      success: true,
      content: mockContent,
      usage: {
        promptTokens: 150,
        completionTokens: 350,
        totalTokens: 500,
        estimatedCost: 0.02
      }
    }
  }

  private generateMockContent(type: string, inputs: Record<string, any>, templateName: string): string {
    const companyName = inputs.companyName || 'Your Company'
    const productName = inputs.productName || 'Your Product'
    
    switch (type) {
      case 'heading':
        if (templateName.includes('About')) {
          return `About ${companyName}: Building the Future of ${inputs.industry || 'Innovation'}`
        }
        if (templateName.includes('Product')) {
          return `${productName}: The Ultimate Solution for Your Needs`
        }
        return `Welcome to ${companyName}`
        
      case 'paragraph':
        return `This is a professionally generated paragraph for your ${templateName.toLowerCase()}. It includes relevant information based on your inputs and follows best practices for web content. The content is optimized for readability and engagement while maintaining a ${inputs.tone || 'professional'} tone throughout.`
        
      case 'list':
        return `• Key benefit number one that addresses your audience's needs
• Important feature that sets you apart from competitors  
• Valuable outcome that customers can expect
• Additional advantage that builds trust and credibility`

      case 'cta':
        return `Ready to get started? Contact us today to learn how we can help you achieve your goals.`
        
      case 'quote':
        return `"This solution has transformed how we work. Highly recommended!" - Satisfied Customer`
        
      default:
        return 'Generated content will appear here based on your template and settings.'
    }
  }
}

export const contentCreatorService = new ContentCreatorService()
