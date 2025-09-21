import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageRendererProps {
  content: string
  onFileClick?: (filePath: string) => void
}

// Common file extensions and their colors
const fileExtensionColors: Record<string, string> = {
  '.js': 'text-yellow-600',
  '.jsx': 'text-yellow-600',
  '.ts': 'text-blue-600',
  '.tsx': 'text-blue-600',
  '.py': 'text-green-600',
  '.java': 'text-orange-600',
  '.cpp': 'text-purple-600',
  '.c': 'text-purple-600',
  '.css': 'text-pink-600',
  '.scss': 'text-pink-600',
  '.html': 'text-red-600',
  '.json': 'text-gray-600',
  '.md': 'text-indigo-600',
  '.yml': 'text-teal-600',
  '.yaml': 'text-teal-600',
  '.xml': 'text-orange-500',
  '.sql': 'text-blue-500',
  '.sh': 'text-gray-700',
  '.bat': 'text-gray-700',
  '.env': 'text-green-500',
  '.config': 'text-purple-500',
  '.vue': 'text-green-500',
  '.php': 'text-indigo-500',
  '.rb': 'text-red-500',
  '.go': 'text-cyan-600',
  '.rs': 'text-orange-700',
  '.swift': 'text-orange-600',
  '.kt': 'text-purple-600'
}

const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(lastDot) : ''
}

const getFileColor = (filename: string): string => {
  const extension = getFileExtension(filename)
  return fileExtensionColors[extension] || 'text-blue-600'
}

export function MessageRenderer({ content, onFileClick }: MessageRendererProps) {
  // Enhanced regex patterns for better file detection
  const filePatterns = [
    // Standard file paths
    /([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]{1,6})(?=\s|$|[^\w\.])/g,
    // Files with specific patterns like src/components/File.tsx
    /((?:src\/|components\/|pages\/|utils\/|lib\/|api\/|backend\/|frontend\/)[a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]{1,6})/g,
    // Relative paths starting with ./
    /(\.\/.+?\.[a-zA-Z0-9]{1,6})(?=\s|$|[^\w\.])/g,
    // Absolute paths
    /([C-Z]:\\.+?\.[a-zA-Z0-9]{1,6})(?=\s|$|[^\w\.])/g
  ]

  const processContent = (text: string): string => {
    let processedText = text

    // Apply all file patterns
    filePatterns.forEach(pattern => {
      processedText = processedText.replace(pattern, (match, filePath) => {
        // Skip if it's already in a code block or link
        const beforeMatch = processedText.substring(0, processedText.indexOf(match))
        const inCodeBlock = (beforeMatch.match(/```/g) || []).length % 2 !== 0
        const inInlineCode = (beforeMatch.match(/`/g) || []).length % 2 !== 0
        
        if (inCodeBlock || inInlineCode) {
          return match
        }

        const color = getFileColor(filePath)
        return `<span class="file-link ${color} hover:${color.replace('text-', 'bg-').replace('-600', '-100')} cursor-pointer font-medium underline decoration-dotted" data-file-path="${filePath}">${filePath}</span>`
      })
    })

    return processedText
  }

  const handleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.classList.contains('file-link')) {
      const filePath = target.getAttribute('data-file-path')
      if (filePath && onFileClick) {
        onFileClick(filePath)
      }
    }
  }

  return (
    <div className="prose prose-sm max-w-none" onClick={handleClick}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom code block renderer with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (!inline && language) {
              return (
                <div className="rounded-lg overflow-hidden my-4 border border-gray-200">
                  <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 border-b border-gray-200">
                    {language.toUpperCase()}
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              )
            }

            return (
              <code 
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            )
          },

          // Enhanced paragraph renderer
          p({ children }) {
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === 'string') {
                const processed = processContent(child)
                return <span dangerouslySetInnerHTML={{ __html: processed }} />
              }
              return child
            })

            return (
              <p className="mb-3 leading-relaxed text-gray-700 last:mb-0">
                {processedChildren}
              </p>
            )
          },

          // Enhanced heading renderers
          h1({ children }) {
            return <h1 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-5">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-gray-900 mb-2 mt-4">{children}</h3>
          },

          // Enhanced list renderers
          ul({ children }) {
            return <ul className="list-disc list-outside mb-4 space-y-2 text-gray-700 pl-6">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside mb-4 space-y-2 text-gray-700 pl-6">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },

          // Enhanced blockquote renderer
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                {children}
              </blockquote>
            )
          },

          // Enhanced table renderers
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="bg-gray-100">{children}</thead>
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                {children}
              </td>
            )
          },

          // Enhanced link renderer
          a({ href, children }) {
            return (
              <a 
                href={href} 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },

          // Strong and emphasis
          strong({ children }) {
            return <strong className="font-semibold text-gray-900">{children}</strong>
          },
          em({ children }) {
            return <em className="italic text-gray-600">{children}</em>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
