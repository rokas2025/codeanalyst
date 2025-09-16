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
        // Send text delta
        res.write(`0:{"type":"text-delta","textDelta":"${content.replace(/"/g, '\\"')}"}\n`)
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