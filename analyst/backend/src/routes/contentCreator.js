// Content Creator Routes - AI-powered content generation
import express from 'express'
import { logger } from '../utils/logger.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Template data for development (will be moved to database later)
const templates = [
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
    promptTemplate: "Create a professional {companyName} about us page for a {industry} company founded in {foundedYear}. Include their mission: {mission}, core values: {values}, and team size: {teamSize}. Write in a {tone} tone for {audience} audience.",
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
    promptTemplate: "Write a compelling product description for {productName}, a {productType} product. Highlight key features: {keyFeatures}, benefits: {benefits}, targeting {targetAudience} in the {priceRange} price range. Use {tone} tone and {style} style for {audience}.",
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
    promptTemplate: "Write a {wordCount} blog post about {topic} targeting {audience}. Focus on keywords: {keywords}. The purpose is to {purpose}. Use {tone} tone and {style} style.",
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

/**
 * GET /api/content-creator/templates
 * Get available content templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query
    
    logger.info('📋 Fetching content templates', { 
      category: category || 'all',
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    })

    let filteredTemplates = templates

    // Filter by category if specified
    if (category && category !== 'all') {
      filteredTemplates = templates.filter(template => template.category === category)
      logger.info(`🔍 Filtered templates by category: ${category}`, { 
        totalTemplates: templates.length,
        filteredCount: filteredTemplates.length 
      })
    }

    // Add user favorites (placeholder for now)
    const templatesWithUserData = filteredTemplates.map(template => ({
      ...template,
      isFavorite: false, // TODO: Check user favorites from database
      lastUsed: null     // TODO: Get last usage from database
    }))

    res.json({
      success: true,
      templates: templatesWithUserData,
      meta: {
        totalCount: filteredTemplates.length,
        categories: [...new Set(templates.map(t => t.category))],
        timestamp: new Date().toISOString()
      }
    })

    logger.info('✅ Templates fetched successfully', { 
      count: filteredTemplates.length,
      categories: [...new Set(filteredTemplates.map(t => t.category))]
    })

  } catch (error) {
    logger.error('❌ Error fetching templates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: 'An error occurred while retrieving content templates'
    })
  }
})

/**
 * GET /api/content-creator/templates/:id
 * Get a specific template by ID
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    logger.info('📋 Fetching template by ID', { 
      templateId: id,
      userId: req.user?.id 
    })

    const template = templates.find(t => t.id === id)
    
    if (!template) {
      logger.warn('⚠️ Template not found', { templateId: id })
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${id}' does not exist`
      })
    }

    // Add user-specific data (placeholder for now)
    const templateWithUserData = {
      ...template,
      isFavorite: false, // TODO: Check user favorites from database
      lastUsed: null,    // TODO: Get last usage from database
      usageCount: 0      // TODO: Get usage count from database
    }

    res.json({
      success: true,
      template: templateWithUserData,
      meta: {
        timestamp: new Date().toISOString()
      }
    })

    logger.info('✅ Template fetched successfully', { 
      templateId: id,
      templateName: template.name
    })

  } catch (error) {
    logger.error('❌ Error fetching template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
      message: 'An error occurred while retrieving the template'
    })
  }
})

export default router
