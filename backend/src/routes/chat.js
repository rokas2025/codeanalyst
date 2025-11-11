import express from 'express'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { messages, project } = req.body
    const userId = req.user.id

    logger.info('Chat request received', { 
      userId, 
      messageCount: messages?.length,
      hasProject: !!project
    })

    // Ensure we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build enhanced system message with project context
    let systemContent = `You are AutoProgrammer, an AI coding assistant that helps developers implement features, fix bugs, and improve code quality.

When helping with code:
1. Always provide specific, actionable solutions
2. Include actual code examples when relevant
3. Explain your reasoning and approach
4. Consider performance, security, and maintainability
5. Suggest tests when implementing new features

You can help with:
- Implementing new features
- Fixing bugs and security issues
- Writing tests and improving coverage
- Refactoring and reducing technical debt
- Architecture improvements
- Performance optimizations`

    // Add project-specific context if available
    if (project) {
      if (project.isWordPress) {
        // WordPress-specific context
        systemContent += `

CURRENT WORDPRESS PAGE CONTEXT:
- Site: ${project.site?.name || 'Unknown'}
- Site URL: ${project.site?.url || 'Unknown'}
- Page: ${project.page?.title || 'Unknown'}
- Page URL: ${project.page?.url || 'Unknown'}
- Builder Type: ${project.page?.builder || 'Unknown'}
- Theme: ${project.site?.theme || 'Unknown'}
- WordPress Version: ${project.site?.wordpress_version || 'Unknown'}

IMPORTANT WORDPRESS INSTRUCTIONS:
You are working with a WordPress page built with ${project.page?.builder || 'Classic Editor'}. This is PREVIEW-ONLY mode - you cannot directly edit the WordPress site.

When the user asks to add sections or modify the page:
1. First, ask for any required inputs (title, text, image URLs, etc.) if not provided
2. Generate clean, semantic HTML code for the section
3. Include inline CSS styling for a modern, professional look
4. Make it responsive (mobile-friendly)
5. Provide clear instructions on how to add it to WordPress:
   ${project.page?.builder === 'Elementor' ? '- Open the page in Elementor editor\n   - Add an HTML widget\n   - Paste the generated code' : 
     project.page?.builder === 'Gutenberg' ? '- Open the page in WordPress editor\n   - Add a Custom HTML block\n   - Paste the generated code' :
     '- Open the page in WordPress editor\n   - Switch to HTML/Text mode\n   - Paste the generated code at the desired location'}

EXAMPLE INTERACTION:
User: "Add an About Us section with title, text, and image"
You: "I'll create an About Us section for you! Please provide:
1. Section title (e.g., 'About Our Company')
2. Description text (2-3 paragraphs)
3. Image URL

Once you provide these, I'll generate the complete HTML code with styling."

Then after user provides inputs, generate:
\`\`\`html
<section class="about-us-section" style="padding: 60px 20px; background: #f8f9fa;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <h2 style="font-size: 2.5rem; margin-bottom: 30px; text-align: center;">[User's Title]</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
      <div>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #333;">[User's Text]</p>
      </div>
      <div>
        <img src="[User's Image URL]" alt="About Us" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      </div>
    </div>
  </div>
</section>
\`\`\`

Always generate production-ready code with proper styling, not just placeholders.`
      } else {
        // GitHub project context
        systemContent += `

CURRENT PROJECT CONTEXT:
- Project: ${project.name}
- Languages: ${project.languages?.join(', ') || 'Unknown'}
- Total Files: ${project.totalFiles || 0}
- Code Quality Score: ${project.codeQuality || 'N/A'}/100
- Files in codebase: ${project.fileStructure?.length || 0}`

        // Add selected file context
        if (project.selectedFile) {
          systemContent += `

CURRENTLY VIEWING FILE: ${project.selectedFile.path}
- Functions/Methods found: ${project.selectedFile.functions?.length || 0}
${project.selectedFile.functions?.map(f => `  - ${f.name} (${f.type})`).join('\n') || ''}

When the user asks for help, analyze this specific file and provide targeted suggestions based on the actual code content.`
        }

        systemContent += `

Use this context to provide specific, relevant suggestions for THIS codebase. Reference actual file names, functions, and patterns you can see in the project structure.`
      }
    }

    // Add structured code change format instructions (only for non-WordPress projects)
    if (!project?.isWordPress) {
      systemContent += `

CRITICAL: When the user asks for help with code, you MUST provide actual code changes in this structured format:

FILE: path/to/file.tsx
ACTION: create|modify|delete
CODE:
\`\`\`typescript
// Your actual code here
export function MyComponent() {
  return <div>Hello</div>
}
\`\`\`

Then explain what the change does and how it will improve the project.

Example:
FILE: src/components/Button.tsx
ACTION: create
CODE:
\`\`\`typescript
import React from 'react'

interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} className="btn-primary">
      {label}
    </button>
  )
}
\`\`\`

This creates a reusable Button component with TypeScript props for better type safety.

DO NOT just provide recommendations or suggestions without actual code. Always include specific, actionable code changes in the FILE/ACTION/CODE format above. This enables visual preview of changes before applying them.`
    }

    // Convert UI messages to OpenAI format
    const openaiMessages = [
      {
        role: 'system',
        content: systemContent
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.parts?.map(part => part.text).join('') || msg.content || ''
      }))
    ]

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    })

    // Generate unique ID for the message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Start with message metadata
    res.write(`0:{"type":"ui-message-start","id":"${messageId}","role":"assistant"}\n`)

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        // Send text delta with properly escaped JSON
        res.write(`0:${JSON.stringify({type:"text-delta",textDelta:content})}\n`)
      }
    }

    // End with message finish
    res.write(`0:{"type":"ui-message-finish","finishReason":"stop"}\n`)
    res.write(`d:{"type":"finish"}\n`)
    res.end()

  } catch (error) {
    logger.error('Chat API error:', error)
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process chat request',
        details: error.message 
      })
    } else {
      res.write(`0:{"type":"error","error":"${error.message}"}\n`)
      res.end()
    }
  }
})

export default router 