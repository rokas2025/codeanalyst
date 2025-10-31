// HTML Generator for Content Creator Preview
// Generates production-ready HTML with embedded styling

import { ContentSection } from '../types/contentCreator'
import { Theme } from './previewThemes'

export type Viewport = 'desktop' | 'tablet' | 'mobile'

export interface HTMLGenerationOptions {
  theme: Theme
  viewport: Viewport
  includeResponsive?: boolean
  includeAnimations?: boolean
}

/**
 * Generate complete styled HTML document from content sections
 */
export function generateStyledHTML(
  sections: ContentSection[],
  theme: Theme,
  viewport: Viewport = 'desktop',
  options: Partial<HTMLGenerationOptions> = {}
): string {
  const { includeResponsive = true, includeAnimations = true } = options

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Preview</title>
  <style>
    ${generateCSS(theme, viewport, includeResponsive, includeAnimations)}
  </style>
</head>
<body>
  <div class="preview-container">
    ${renderSections(sections, theme)}
  </div>
</body>
</html>`
}

/**
 * Generate CSS styles based on theme and viewport
 */
export function generateCSS(
  theme: Theme,
  viewport: Viewport,
  includeResponsive: boolean = true,
  includeAnimations: boolean = true
): string {
  const maxWidth = getMaxWidth(viewport)
  
  return `
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${theme.font};
      color: ${theme.text};
      background-color: ${theme.background};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .preview-container {
      max-width: ${maxWidth}px;
      margin: 0 auto;
      padding: 2rem;
      background-color: ${theme.background};
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: ${theme.headingFont};
      color: ${theme.text};
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: ${theme.primary};
    }

    h2 {
      font-size: 2rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: ${theme.primary};
    }

    h3 {
      font-size: 1.5rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    h4 {
      font-size: 1.25rem;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }

    p {
      margin-bottom: 1rem;
      color: ${theme.text};
      font-size: 1rem;
      line-height: 1.75;
    }

    /* Links */
    a {
      color: ${theme.primary};
      text-decoration: none;
      transition: color 0.2s ease;
    }

    a:hover {
      color: ${theme.secondary};
      text-decoration: underline;
    }

    /* Lists */
    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 0.5rem;
      color: ${theme.text};
      line-height: 1.6;
    }

    ul li {
      list-style-type: disc;
    }

    ol li {
      list-style-type: decimal;
    }

    /* Content Sections */
    .content-section {
      margin-bottom: 2rem;
      ${includeAnimations ? 'animation: fadeIn 0.5s ease-in;' : ''}
    }

    .content-section:last-child {
      margin-bottom: 0;
    }

    /* Heading Section */
    .section-heading {
      padding: 1.5rem 0;
      border-bottom: 2px solid ${theme.border};
      margin-bottom: 1.5rem;
    }

    /* Paragraph Section */
    .section-paragraph {
      padding: 1rem 0;
    }

    /* List Section */
    .section-list {
      background-color: ${theme.surface};
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid ${theme.primary};
    }

    .section-list h3 {
      margin-top: 0;
    }

    /* CTA Section */
    .section-cta {
      background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      margin: 2rem 0;
      ${includeAnimations ? 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);' : ''}
      ${includeAnimations ? 'transition: transform 0.3s ease, box-shadow 0.3s ease;' : ''}
    }

    ${includeAnimations ? `
    .section-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    ` : ''}

    .section-cta h2,
    .section-cta h3,
    .section-cta p {
      color: white;
      margin-bottom: 1rem;
    }

    .cta-button {
      display: inline-block;
      background-color: white;
      color: ${theme.primary};
      padding: 0.75rem 2rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1rem;
      margin-top: 1rem;
      cursor: pointer;
      border: none;
      ${includeAnimations ? 'transition: all 0.3s ease;' : ''}
    }

    ${includeAnimations ? `
    .cta-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    ` : ''}

    /* Quote Section */
    .section-quote {
      background-color: ${theme.surface};
      border-left: 4px solid ${theme.accent};
      padding: 1.5rem 2rem;
      margin: 2rem 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }

    .section-quote p {
      font-size: 1.25rem;
      color: ${theme.textSecondary};
      margin-bottom: 0.5rem;
    }

    .quote-author {
      font-size: 0.9rem;
      color: ${theme.textSecondary};
      font-style: normal;
      margin-top: 1rem;
      font-weight: 600;
    }

    /* Image Section */
    .section-image {
      margin: 2rem 0;
      text-align: center;
    }

    .section-image img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      ${includeAnimations ? 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);' : ''}
    }

    .image-caption {
      font-size: 0.9rem;
      color: ${theme.textSecondary};
      margin-top: 0.5rem;
      font-style: italic;
    }

    /* Animations */
    ${includeAnimations ? `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    ` : ''}

    /* Responsive Breakpoints */
    ${includeResponsive ? `
    @media (max-width: 768px) {
      .preview-container {
        padding: 1rem;
      }

      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      h3 {
        font-size: 1.25rem;
      }

      .section-cta {
        padding: 1.5rem;
      }

      .section-quote {
        padding: 1rem 1.5rem;
      }

      .section-quote p {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 480px) {
      .preview-container {
        padding: 0.75rem;
      }

      h1 {
        font-size: 1.75rem;
      }

      h2 {
        font-size: 1.25rem;
      }

      h3 {
        font-size: 1.1rem;
      }

      p {
        font-size: 0.95rem;
      }

      .section-cta {
        padding: 1rem;
      }

      .cta-button {
        padding: 0.625rem 1.5rem;
        font-size: 0.9rem;
      }
    }
    ` : ''}

    /* Print Styles */
    @media print {
      .preview-container {
        max-width: 100%;
        padding: 0;
      }

      .section-cta {
        background: ${theme.surface};
        color: ${theme.text};
        border: 2px solid ${theme.primary};
      }

      .section-cta h2,
      .section-cta h3,
      .section-cta p {
        color: ${theme.text};
      }
    }
  `
}

/**
 * Render content sections as HTML
 */
export function renderSections(sections: ContentSection[], theme: Theme): string {
  if (!sections || sections.length === 0) {
    return '<p>No content to display</p>'
  }

  return sections
    .sort((a, b) => a.order - b.order)
    .map(section => renderSection(section, theme))
    .join('\n')
}

/**
 * Render a single content section
 */
export function renderSection(section: ContentSection, theme: Theme): string {
  const sectionClass = `content-section section-${section.type}`
  
  switch (section.type) {
    case 'heading':
      return `<div class="${sectionClass}">
        ${formatHeading(section.content)}
      </div>`
    
    case 'paragraph':
      return `<div class="${sectionClass}">
        ${formatParagraph(section.content)}
      </div>`
    
    case 'list':
      return `<div class="${sectionClass}">
        ${formatList(section.content)}
      </div>`
    
    case 'cta':
      return `<div class="${sectionClass}">
        ${formatCTA(section.content)}
      </div>`
    
    case 'quote':
      return `<div class="${sectionClass}">
        ${formatQuote(section.content)}
      </div>`
    
    case 'image':
      return `<div class="${sectionClass}">
        ${formatImage(section.content)}
      </div>`
    
    default:
      return `<div class="${sectionClass}">
        ${escapeHTML(section.content)}
      </div>`
  }
}

/**
 * Parse markdown formatting (bold, italic, links, etc.)
 */
function parseMarkdown(text: string): string {
  let formatted = text
  
  // Bold text: **text** or __text__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>')
  
  // Italic text: *text* or _text_
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>')
  
  // Links: [text](url)
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Inline code: `code`
  formatted = formatted.replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">$1</code>')
  
  return formatted
}

/**
 * Format heading content
 */
function formatHeading(content: string): string {
  const lines = content.split('\n').filter(l => l.trim())
  
  // Detect heading level from first line or default to h2
  let level = 2
  let text = lines[0] || content
  
  if (text.startsWith('#### ')) {
    level = 4
    text = text.substring(5)
  } else if (text.startsWith('### ')) {
    level = 3
    text = text.substring(4)
  } else if (text.startsWith('## ')) {
    level = 2
    text = text.substring(3)
  } else if (text.startsWith('# ')) {
    level = 1
    text = text.substring(2)
  }
  
  // Parse markdown in heading text
  const formattedText = parseMarkdown(text.trim())
  const heading = `<h${level}>${formattedText}</h${level}>`
  
  // If there are additional lines, format them as paragraphs
  if (lines.length > 1) {
    const restLines = lines.slice(1)
    const paragraphs = restLines.map(line => {
      const formatted = parseMarkdown(line.trim())
      return `<p>${formatted}</p>`
    }).join('\n')
    return `${heading}\n${paragraphs}`
  }
  
  return heading
}

/**
 * Format paragraph content
 */
function formatParagraph(content: string): string {
  // First try splitting by double newlines (proper paragraphs)
  let paragraphs = content.split('\n\n').filter(p => p.trim())
  
  // If no double newlines, split by single newlines
  if (paragraphs.length === 1 && content.includes('\n')) {
    paragraphs = content.split('\n').filter(p => p.trim())
  }
  
  return paragraphs.map(p => {
    // Parse markdown formatting
    const formatted = parseMarkdown(p.trim())
    return `<p>${formatted}</p>`
  }).join('\n')
}

/**
 * Format list content
 */
function formatList(content: string): string {
  const lines = content.split('\n').filter(line => line.trim())
  
  // Check if it's an ordered or unordered list
  const isOrdered = lines[0]?.match(/^\d+\./)
  const listTag = isOrdered ? 'ol' : 'ul'
  
  const items = lines
    .map(line => {
      // Remove markdown list markers
      const cleaned = line.replace(/^[\d\-\*\+]+\.?\s*/, '').trim()
      // Parse markdown in list items
      const formatted = parseMarkdown(cleaned)
      return formatted ? `<li>${formatted}</li>` : ''
    })
    .filter(item => item)
    .join('\n')
  
  return `<${listTag}>\n${items}\n</${listTag}>`
}

/**
 * Format CTA content
 */
function formatCTA(content: string): string {
  // Parse CTA content (heading + text + button)
  const lines = content.split('\n').filter(line => line.trim())
  
  let heading = ''
  let textParts: string[] = []
  let buttonText = 'Learn More'
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      const headingText = line.replace(/^#+\s*/, '')
      heading = parseMarkdown(headingText)
    } else if (line.toLowerCase().includes('button:') || line.toLowerCase().includes('cta:')) {
      buttonText = line.replace(/^(button|cta):\s*/i, '').trim()
    } else if (line.trim()) {
      const formatted = parseMarkdown(line)
      textParts.push(`<p>${formatted}</p>`)
    }
  }
  
  return `
    ${heading ? `<h2>${heading}</h2>` : ''}
    ${textParts.join('\n')}
    <button class="cta-button">${buttonText}</button>
  `
}

/**
 * Format quote content
 */
function formatQuote(content: string): string {
  const lines = content.split('\n').filter(line => line.trim())
  
  let quoteParts: string[] = []
  let author = ''
  
  for (const line of lines) {
    if (line.startsWith('—') || line.startsWith('-') || line.toLowerCase().includes('author:')) {
      author = line.replace(/^[—\-]\s*|^author:\s*/i, '').trim()
    } else if (line.trim()) {
      quoteParts.push(line)
    }
  }
  
  const quoteText = quoteParts.join(' ')
  const formattedQuote = parseMarkdown(quoteText.trim())
  
  return `
    <p>${formattedQuote}</p>
    ${author ? `<div class="quote-author">— ${author}</div>` : ''}
  `
}

/**
 * Format image content
 */
function formatImage(content: string): string {
  // Parse image URL and caption
  const lines = content.split('\n').filter(line => line.trim())
  
  let imageUrl = ''
  let caption = ''
  
  for (const line of lines) {
    if (line.match(/^https?:\/\//)) {
      imageUrl = line.trim()
    } else if (line.trim()) {
      caption = line.trim()
    }
  }
  
  if (!imageUrl) {
    return `<div class="image-placeholder" style="background: #f0f0f0; padding: 4rem 2rem; text-align: center; border-radius: 8px;">
      <p style="color: #999;">Image: ${escapeHTML(caption || 'No image URL provided')}</p>
    </div>`
  }
  
  return `
    <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(caption)}" />
    ${caption ? `<div class="image-caption">${escapeHTML(caption)}</div>` : ''}
  `
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}

/**
 * Get max width based on viewport
 */
function getMaxWidth(viewport: Viewport): number {
  switch (viewport) {
    case 'mobile':
      return 375
    case 'tablet':
      return 768
    case 'desktop':
    default:
      return 1440
  }
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(viewport: Viewport): { width: number; height: number } {
  switch (viewport) {
    case 'mobile':
      return { width: 375, height: 667 }
    case 'tablet':
      return { width: 768, height: 1024 }
    case 'desktop':
    default:
      return { width: 1440, height: 900 }
  }
}

