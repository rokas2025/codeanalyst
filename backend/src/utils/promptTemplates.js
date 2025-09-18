// Optimized prompt templates for different content types
import { logger } from './logger.js'

/**
 * Enhanced prompt templates for AI content generation
 * These templates are optimized for specific content types and use cases
 */
export class PromptTemplateEngine {
  constructor() {
    this.templates = {
      'about-us': this.createAboutUsTemplate(),
      'product-description': this.createProductTemplate(),
      'service-description': this.createServiceTemplate(),
      'blog-post': this.createBlogPostTemplate(),
      'landing-page': this.createLandingPageTemplate(),
      'press-release': this.createPressReleaseTemplate(),
      'email-campaign': this.createEmailCampaignTemplate(),
      'social-media': this.createSocialMediaTemplate()
    }
  }

  /**
   * Get enhanced prompt for a specific template
   */
  getPrompt(templateId, userInputs, generationSettings) {
    const template = this.templates[templateId]
    if (!template) {
      logger.warn(`No prompt template found for: ${templateId}`)
      return this.createGenericTemplate()
    }

    return this.processTemplate(template, userInputs, generationSettings)
  }

  /**
   * Process template with user inputs and settings
   */
  processTemplate(template, userInputs, generationSettings) {
    const context = {
      ...userInputs,
      ...generationSettings,
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toLocaleDateString()
    }

    let prompt = template.prompt
    
    // Replace all placeholders
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      prompt = prompt.replace(regex, value || '[NOT PROVIDED]')
    })

    // Add optimization hints based on settings
    if (generationSettings.tone) {
      prompt += `\n\nTONE: Write in a ${generationSettings.tone} tone throughout.`
    }
    
    if (generationSettings.audience) {
      prompt += `\nAUDIENCE: Target this content for ${generationSettings.audience} readers.`
    }
    
    if (generationSettings.ctaStrength) {
      prompt += `\nCALL-TO-ACTION: Use ${generationSettings.ctaStrength} call-to-action language.`
    }

    return prompt
  }

  /**
   * About Us page template
   */
  createAboutUsTemplate() {
    return {
      prompt: `Create a compelling "About Us" page for {companyName}, a {industry} company founded in {foundedYear}.

COMPANY DETAILS:
- Company Name: {companyName}
- Industry: {industry}
- Founded: {foundedYear}
- Mission: {mission}
- Core Values: {values}
- Team Size: {teamSize}

CONTENT REQUIREMENTS:
Write a professional, engaging About Us page that:
1. Starts with a compelling hook about the company's purpose
2. Tells the company's story and journey
3. Clearly articulates the mission and vision
4. Highlights core values and what makes the company unique
5. Introduces the team or leadership (appropriate to team size)
6. Includes a strong call-to-action to connect or learn more

STRUCTURE:
- Hero Statement (compelling opening)
- Company Story (background and journey)
- Mission & Vision (purpose and goals)
- Core Values (what drives the company)
- Team Introduction (leadership or team overview)
- Call to Action (next steps for visitors)

TONE GUIDELINES:
- Professional yet approachable
- Authentic and trustworthy
- Inspiring without being overly promotional
- Human and relatable

Make the content memorable and help visitors understand why they should choose this company.`,
      
      optimization: {
        keywords: ['about us', 'company story', 'mission', 'values', 'team'],
        readability: 'medium',
        engagement: 'high'
      }
    }
  }

  /**
   * Product description template
   */
  createProductTemplate() {
    return {
      prompt: `Create a compelling product description for {productName}, a {productType} targeted at {targetAudience}.

PRODUCT DETAILS:
- Product Name: {productName}
- Category: {productType}
- Target Audience: {targetAudience}
- Key Features: {keyFeatures}
- Price Range: {priceRange}
- Unique Selling Point: {uniqueSellingPoint}

CONTENT REQUIREMENTS:
Write a persuasive product description that:
1. Captures attention with a compelling headline
2. Clearly explains what the product is and does
3. Highlights key features and benefits
4. Addresses target audience pain points
5. Emphasizes the unique selling proposition
6. Includes social proof or credibility markers
7. Ends with a strong call-to-action

STRUCTURE:
- Product Headline (attention-grabbing title)
- Product Overview (what it is and primary benefit)
- Key Features (main functionality and specifications)
- Benefits (how it improves the customer's life)
- Unique Value (what sets it apart)
- Call to Action (encouraging purchase)

PERSUASION TECHNIQUES:
- Focus on benefits over features
- Use sensory language where appropriate
- Include specific details and numbers
- Address objections proactively
- Create urgency if appropriate

Write copy that converts browsers into buyers.`,
      
      optimization: {
        keywords: ['product', 'features', 'benefits', 'purchase', 'quality'],
        readability: 'easy',
        engagement: 'very high',
        conversion: 'optimized'
      }
    }
  }

  /**
   * Service description template
   */
  createServiceTemplate() {
    return {
      prompt: `Create a professional service description for {serviceName}, a {serviceType} service.

SERVICE DETAILS:
- Service Name: {serviceName}
- Service Type: {serviceType}
- Problem Solved: {problemSolved}
- Service Process: {process}
- Deliverables: {deliverables}
- Experience: {experience}

CONTENT REQUIREMENTS:
Write a trustworthy service description that:
1. Clearly identifies the problem or need
2. Positions the service as the ideal solution
3. Explains the service process and approach
4. Details what clients will receive
5. Demonstrates expertise and experience
6. Builds trust and credibility
7. Includes a clear next step for potential clients

STRUCTURE:
- Service Headline (clear value proposition)
- Problem Statement (customer pain point)
- Solution Overview (how the service helps)
- Process Description (how we work)
- Deliverables (what clients get)
- Expertise & Experience (why choose us)
- Call to Action (how to get started)

TRUST BUILDING ELEMENTS:
- Professional language and expertise demonstration
- Clear process and expectations
- Specific deliverables and outcomes
- Experience and credibility markers
- Risk reduction (guarantees, consultations)

Create content that positions the service provider as the trusted expert choice.`,
      
      optimization: {
        keywords: ['service', 'solution', 'process', 'expertise', 'results'],
        readability: 'medium',
        engagement: 'high',
        trust: 'optimized'
      }
    }
  }

  /**
   * Blog post template
   */
  createBlogPostTemplate() {
    return {
      prompt: `Write an engaging blog post titled "{title}" about {topic} for {audience}.

BLOG POST DETAILS:
- Title: {title}
- Topic: {topic}
- Target Audience: {audience}
- Key Points: {keyPoints}
- Call to Action: {callToAction}
- Tone: {tone}

CONTENT REQUIREMENTS:
Create an informative and engaging blog post that:
1. Hooks readers with a compelling introduction
2. Delivers valuable, actionable content
3. Covers all specified key points thoroughly
4. Uses examples and practical insights
5. Maintains reader engagement throughout
6. Includes relevant subheadings for scanability
7. Ends with a clear call-to-action

STRUCTURE:
- Introduction (hook + value proposition)
- Main Content (key points with examples)
- Practical Tips/Actionables
- Conclusion (summary + next steps)
- Call to Action

ENGAGEMENT TECHNIQUES:
- Start with a question, statistic, or story
- Use subheadings and bullet points
- Include practical examples and case studies
- Write in second person ("you") when appropriate
- Use transitions between sections
- End with actionable advice

SEO CONSIDERATIONS:
- Use the main topic naturally throughout
- Include relevant subtopics and keywords
- Write compelling subheadings
- Aim for comprehensive coverage of the topic

Create content that provides real value and keeps readers engaged until the end.`,
      
      optimization: {
        keywords: ['blog', 'content', 'information', 'tips', 'guide'],
        readability: 'easy',
        engagement: 'very high',
        seo: 'optimized'
      }
    }
  }

  /**
   * Landing page template
   */
  createLandingPageTemplate() {
    return {
      prompt: `Create a high-converting landing page for {productService} targeting {targetPain}.

LANDING PAGE DETAILS:
- Product/Service: {productService}
- Main Benefit: {mainBenefit}
- Target Pain Point: {targetPain}
- Social Proof: {socialProof}
- Special Offer: {offer}
- Urgency Element: {urgency}

CONTENT REQUIREMENTS:
Write a persuasive landing page that:
1. Immediately addresses the target pain point
2. Presents a clear value proposition
3. Explains the main benefit compellingly
4. Includes strong social proof elements
5. Features an irresistible offer
6. Creates appropriate urgency
7. Has multiple strategic call-to-action placements

STRUCTURE:
- Main Headline (big promise/benefit)
- Sub-headline (clarification/detail)
- Problem Statement (pain point identification)
- Solution Overview (product/service introduction)
- Key Benefits (why it's valuable)
- Social Proof (testimonials/statistics)
- Offer Details (special deal/value)
- Urgency/Scarcity (limited time/quantity)
- Primary Call-to-Action (main conversion goal)

CONVERSION OPTIMIZATION:
- Use benefit-focused headlines
- Address objections preemptively
- Create emotional connection
- Use specific numbers and details
- Include risk reversal elements
- Make the CTA clear and compelling
- Use power words and emotional triggers

Write copy that compels immediate action and maximizes conversions.`,
      
      optimization: {
        keywords: ['landing page', 'conversion', 'offer', 'benefit', 'action'],
        readability: 'easy',
        engagement: 'maximum',
        conversion: 'highly optimized'
      }
    }
  }

  /**
   * Press release template
   */
  createPressReleaseTemplate() {
    return {
      prompt: `Write a professional press release for {companyName} about {announcement}.

PRESS RELEASE DETAILS:
- Company: {companyName}
- Announcement: {announcement}
- Key Details: {keyDetails}
- Quote Source: {quoteSource}
- Contact Information: {contactInfo}
- Release Date: {currentDate}

CONTENT REQUIREMENTS:
Create a newsworthy press release that:
1. Follows standard press release format
2. Includes a compelling headline and dateline
3. Covers the who, what, when, where, why
4. Features relevant quotes from key stakeholders
5. Provides background company information
6. Includes proper contact information
7. Uses professional, journalistic tone

STRUCTURE:
- Headline (newsworthy and attention-grabbing)
- Dateline (location and date)
- Lead Paragraph (key announcement details)
- Body Paragraphs (supporting information)
- Quotes (stakeholder perspectives)
- Company Boilerplate (background info)
- Contact Information (media contact details)

JOURNALISTIC STANDARDS:
- Use third-person perspective
- Include factual, verifiable information
- Write in inverted pyramid style
- Use active voice and clear language
- Include relevant industry context
- Maintain objective, professional tone

Create a press release that media outlets will want to cover.`,
      
      optimization: {
        keywords: ['press release', 'news', 'announcement', 'company', 'media'],
        readability: 'professional',
        engagement: 'medium',
        credibility: 'high'
      }
    }
  }

  /**
   * Email campaign template
   */
  createEmailCampaignTemplate() {
    return {
      prompt: `Create an effective email campaign for {campaignGoal} targeting {targetAudience}.

EMAIL CAMPAIGN DETAILS:
- Campaign Goal: {campaignGoal}
- Target Audience: {targetAudience}
- Main Message: {mainMessage}
- Offer/Value: {offer}
- Call to Action: {callToAction}
- Brand Voice: {brandVoice}

CONTENT REQUIREMENTS:
Write an engaging email that:
1. Uses a compelling subject line
2. Personalizes the message appropriately
3. Delivers the main message clearly
4. Provides genuine value to recipients
5. Includes a clear, action-oriented CTA
6. Maintains consistent brand voice
7. Optimizes for mobile reading

STRUCTURE:
- Subject Line (compelling reason to open)
- Preheader Text (supporting subject line)
- Personal Greeting (when appropriate)
- Opening Hook (engagement element)
- Main Message (core content/value)
- Supporting Details (benefits/features)
- Call to Action (clear next step)
- Closing/Signature

EMAIL BEST PRACTICES:
- Keep subject line under 50 characters
- Use scannable format with short paragraphs
- Include one primary CTA
- Personalize when data available
- Test different approaches
- Ensure mobile responsiveness
- Include clear unsubscribe option

Create an email that recipients will want to read and act upon.`,
      
      optimization: {
        keywords: ['email', 'campaign', 'message', 'action', 'engagement'],
        readability: 'very easy',
        engagement: 'high',
        deliverability: 'optimized'
      }
    }
  }

  /**
   * Social media template
   */
  createSocialMediaTemplate() {
    return {
      prompt: `Create engaging social media content for {platform} about {topic}.

SOCIAL MEDIA DETAILS:
- Platform: {platform}
- Topic: {topic}
- Post Type: {postType}
- Target Audience: {targetAudience}
- Brand Voice: {brandVoice}
- Call to Action: {callToAction}
- Hashtags: {hashtags}

CONTENT REQUIREMENTS:
Create platform-appropriate content that:
1. Matches platform best practices and character limits
2. Engages the target audience effectively
3. Maintains consistent brand voice
4. Includes relevant hashtags strategically
5. Encourages interaction and engagement
6. Provides value or entertainment
7. Includes appropriate call-to-action

PLATFORM OPTIMIZATION:
- Instagram: Visual storytelling, hashtags, stories
- Facebook: Community engagement, longer form
- Twitter: Concise, trending topics, threads
- LinkedIn: Professional insights, industry news
- TikTok: Entertaining, trending audio/effects
- YouTube: Educational, entertainment value

ENGAGEMENT STRATEGIES:
- Ask questions to encourage comments
- Use trending hashtags appropriately
- Share behind-the-scenes content
- Create shareable, valuable content
- Engage with community feedback
- Post at optimal times for audience

Create content that stops the scroll and drives engagement.`,
      
      optimization: {
        keywords: ['social media', 'engagement', 'content', 'audience', 'platform'],
        readability: 'very easy',
        engagement: 'maximum',
        shareability: 'high'
      }
    }
  }

  /**
   * Generic fallback template
   */
  createGenericTemplate() {
    return {
      prompt: `Create high-quality, engaging content based on the provided requirements.

CONTENT REQUIREMENTS:
Analyze the provided information and create content that:
1. Meets the specific needs and goals
2. Engages the target audience effectively
3. Maintains appropriate tone and style
4. Provides genuine value to readers
5. Includes relevant calls-to-action
6. Follows best practices for the content type
7. Is ready for publication with minimal editing

QUALITY STANDARDS:
- Professional and polished writing
- Clear structure and organization
- Compelling and persuasive language
- Accurate and relevant information
- Appropriate length and depth
- SEO-friendly when applicable
- Conversion-optimized when applicable

Create exceptional content that exceeds expectations.`,
      
      optimization: {
        keywords: ['content', 'quality', 'professional', 'engaging'],
        readability: 'medium',
        engagement: 'high'
      }
    }
  }

  /**
   * Get all available template IDs
   */
  getAvailableTemplates() {
    return Object.keys(this.templates)
  }

  /**
   * Add custom template
   */
  addTemplate(templateId, template) {
    this.templates[templateId] = template
    logger.info(`Added custom prompt template: ${templateId}`)
  }

  /**
   * Validate template structure
   */
  validateTemplate(template) {
    return template && 
           typeof template.prompt === 'string' && 
           template.prompt.length > 0
  }
}

// Create and export singleton instance
export const promptTemplateEngine = new PromptTemplateEngine()

// Export individual template getters for direct use
export const getPromptTemplate = (templateId, userInputs = {}, generationSettings = {}) => {
  return promptTemplateEngine.getPrompt(templateId, userInputs, generationSettings)
}

export default promptTemplateEngine
