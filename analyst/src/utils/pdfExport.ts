import { AdoreInoResults } from '../types'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  title?: string
  includeTimestamp?: boolean
  includeTechnicalDetails?: boolean
  format?: 'business' | 'technical' | 'executive'
}

/**
 * Export analysis results to PDF format
 * Note: This is a simplified implementation using HTML to PDF conversion
 * For production, consider using jsPDF or puppeteer for better formatting
 */
export async function exportToPDF(
  results: AdoreInoResults, 
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'AdoreIno Code Analysis Report',
    includeTimestamp = true,
    includeTechnicalDetails = true,
    format = 'business'
  } = options

  // Create HTML content for PDF
  const htmlContent = generateHTMLReport(results, {
    title,
    includeTimestamp,
    includeTechnicalDetails,
    format
  })

  // Convert HTML to PDF using browser's print functionality
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.')
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Wait for content to load
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 1000)
}

function generateHTMLReport(
  results: AdoreInoResults,
  options: PDFExportOptions
): string {
  const timestamp = new Date().toLocaleDateString()
  const { title, includeTimestamp, includeTechnicalDetails, format } = options

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .score-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            color: ${getScoreColor(results.systemOverview.overallScore)};
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
        }
        .risk-item {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
        }
        .risk-high { border-left: 4px solid #dc3545; }
        .risk-medium { border-left: 4px solid #ffc107; }
        .risk-low { border-left: 4px solid #28a745; }
        .tech-tag {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 2px;
            font-size: 12px;
        }
        .recommendation {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        ${includeTimestamp ? `<p>Generated on: ${timestamp}</p>` : ''}
        <p>Powered by AdoreIno AI Code Analysis</p>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <h2>Executive Summary</h2>
        <div class="score-card">
            <div class="score">${results.systemOverview.overallScore}/100</div>
            <h3>Overall Quality Score</h3>
            <p><strong>Quality Rating:</strong> ${results.systemOverview.qualityRating.toUpperCase()}</p>
            <p><strong>Project Type:</strong> ${results.systemOverview.projectType}</p>
            <p><strong>Risk Level:</strong> ${results.riskAssessment.overallRisk.toUpperCase()}</p>
        </div>
    </div>

    <!-- Technology Stack -->
    <div class="section">
        <h2>Technology Stack</h2>
        <p><strong>Main Technologies:</strong></p>
        <div>
            ${results.systemOverview.mainTechnologies.map(tech => 
                `<span class="tech-tag">${tech}</span>`
            ).join('')}
        </div>
        <div class="grid">
            <div>
                <p><strong>Modernity Score:</strong> ${results.systemOverview.modernityScore}/100</p>
                <p><strong>Competitiveness:</strong> ${results.systemOverview.competitivenessRating}</p>
            </div>
            <div>
                <p><strong>Complexity:</strong> ${results.systemOverview.estimatedComplexity}</p>
                <p><strong>Confidence Level:</strong> ${results.confidenceLevel}%</p>
            </div>
        </div>
    </div>

    ${format !== 'executive' ? `
    <!-- Business Recommendations -->
    <div class="section">
        <h2>Business Recommendations</h2>
        ${results.businessRecommendations.map(rec => `
            <div class="recommendation">
                <h3>${rec.title}</h3>
                <p><strong>Category:</strong> ${rec.category.toUpperCase()}</p>
                <p>${rec.description}</p>
                <div class="grid">
                    <div>
                        <p><strong>Cost Estimate:</strong> ${rec.costEstimate}</p>
                        <p><strong>Timeline:</strong> ${rec.timeline}</p>
                    </div>
                    <div>
                        <p><strong>Business Impact:</strong> ${rec.businessImpact}</p>
                        <p><strong>Priority:</strong> ${rec.priority}</p>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>

    <!-- Risk Assessment -->
    <div class="section">
        <h2>Risk Assessment</h2>
        <p><strong>Overall Risk Level:</strong> ${results.riskAssessment.overallRisk.toUpperCase()}</p>
        ${results.riskAssessment.risks.map(risk => `
            <div class="risk-item risk-${risk.impact}">
                <h4>${risk.title}</h4>
                <p><strong>Impact:</strong> ${risk.impact.toUpperCase()} | <strong>Likelihood:</strong> ${risk.likelihood.toUpperCase()}</p>
                <p>${risk.description}</p>
                <p><strong>Affected Files:</strong> ${risk.affectedFiles.join(', ')}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${includeTechnicalDetails && format !== 'business' ? `
    <div class="page-break"></div>
    <!-- Technical Details -->
    <div class="section">
        <h2>Technical Analysis</h2>
        <div class="grid">
            <div>
                <p><strong>Total Files:</strong> ${results.technicalStructure.codeMetrics.totalFiles.toLocaleString()}</p>
                <p><strong>Lines of Code:</strong> ${results.technicalStructure.codeMetrics.totalLines.toLocaleString()}</p>
                <p><strong>Complexity Score:</strong> ${results.technicalStructure.codeMetrics.complexity}</p>
            </div>
            <div>
                <p><strong>Test Coverage:</strong> ${results.technicalStructure.codeMetrics.testCoverage ? `${results.technicalStructure.codeMetrics.testCoverage.toFixed(1)}%` : 'N/A'}</p>
                <p><strong>Technical Debt:</strong> ${results.technicalStructure.codeMetrics.technicalDebt.toFixed(1)}%</p>
                <p><strong>Architecture:</strong> ${results.technicalStructure.architecture.pattern}</p>
            </div>
        </div>
    </div>

    <!-- System Modules -->
    <div class="section">
        <h2>System Modules</h2>
        ${results.technicalStructure.modules.map(module => `
            <div class="risk-item">
                <h4>${module.name} (${module.type})</h4>
                <p>${module.description}</p>
                <p><strong>Lines of Code:</strong> ${module.linesOfCode.toLocaleString()}</p>
                <p><strong>Dependencies:</strong> ${module.dependencies.length}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <!-- Maintenance Tasks -->
    <div class="section">
        <h2>Recommended Actions</h2>
        <p><strong>Priority Level:</strong> ${results.maintenanceNeeds.priorityLevel.toUpperCase()}</p>
        <p><strong>Estimated Effort:</strong> ${results.maintenanceNeeds.estimatedEffort}</p>
        
        ${results.maintenanceNeeds.urgentTasks.length > 0 ? `
            <h3>Urgent Tasks</h3>
            ${results.maintenanceNeeds.urgentTasks.map(task => `
                <div class="risk-item risk-high">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
                    <p><strong>Files:</strong> ${task.files.join(', ')}</p>
                </div>
            `).join('')}
        ` : ''}

        ${results.maintenanceNeeds.recommendedTasks.length > 0 ? `
            <h3>Recommended Tasks</h3>
            ${results.maintenanceNeeds.recommendedTasks.map(task => `
                <div class="risk-item risk-medium">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
                    <p><strong>Files:</strong> ${task.files.join(', ')}</p>
                </div>
            `).join('')}
        ` : ''}
    </div>

    <div class="section">
        <p style="text-align: center; color: #666; font-size: 12px;">
            This report was generated by AdoreIno AI Code Analysis Platform<br>
            For more information, visit: adorino.com
        </p>
    </div>
</body>
</html>
  `
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#28a745' // Green
  if (score >= 60) return '#ffc107' // Yellow
  return '#dc3545' // Red
}

/**
 * Generate a simplified business-focused PDF report
 */
export async function exportBusinessReport(results: AdoreInoResults): Promise<void> {
  return exportToPDF(results, {
    title: 'Business Impact Analysis Report',
    format: 'business',
    includeTechnicalDetails: false
  })
}

/**
 * Generate a comprehensive technical PDF report
 */
export async function exportTechnicalReport(results: AdoreInoResults): Promise<void> {
  return exportToPDF(results, {
    title: 'Technical Analysis Report',
    format: 'technical',
    includeTechnicalDetails: true
  })
}

/**
 * Generate an executive summary PDF report
 */
export async function exportExecutiveReport(results: AdoreInoResults): Promise<void> {
  return exportToPDF(results, {
    title: 'Executive Summary Report',
    format: 'executive',
    includeTechnicalDetails: false
  })
}

export const exportAnalysisToPDF = async (analysisId: string, analysisData: any): Promise<{ success: boolean; filename: string }> => {
  try {
    // Create a clean version of the content for PDF export
    const contentElement = document.querySelector('#analysis-report') as HTMLElement
    
    if (!contentElement) {
      throw new Error('Content not found for PDF export')
    }

    // Create a temporary container for PDF content
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = '800px' // Fixed width for better control
    tempContainer.style.maxWidth = '800px'
    tempContainer.style.backgroundColor = 'white'
    tempContainer.style.padding = '40px'
    tempContainer.style.fontFamily = 'Arial, sans-serif'
    tempContainer.style.lineHeight = '1.6'
    tempContainer.style.fontSize = '14px'
    
    // Clone the content and clean it up for PDF
    const clonedContent = contentElement.cloneNode(true) as HTMLElement
    
    // Remove interactive elements and adjust styles for PDF
    const buttons = clonedContent.querySelectorAll('button')
    buttons.forEach(button => button.remove())
    
    // Remove any hover classes and interactions
    const hoverElements = clonedContent.querySelectorAll('[class*="hover:"]')
    hoverElements.forEach(element => {
      element.className = element.className.replace(/hover:[^\s]*/g, '')
    })
    
    // Adjust styles for PDF
    const cards = clonedContent.querySelectorAll('.bg-white')
    cards.forEach(card => {
      (card as HTMLElement).style.boxShadow = 'none'
      ;(card as HTMLElement).style.border = '1px solid #e5e7eb'
      ;(card as HTMLElement).style.marginBottom = '20px'
      ;(card as HTMLElement).style.pageBreakInside = 'avoid'
      ;(card as HTMLElement).style.padding = '20px'
      ;(card as HTMLElement).style.width = '100%'
      ;(card as HTMLElement).style.boxSizing = 'border-box'
    })
    
    // Style gradients for better PDF printing
    const gradients = clonedContent.querySelectorAll('[class*="gradient"]')
    gradients.forEach(gradient => {
      (gradient as HTMLElement).style.background = '#f8fafc'
      ;(gradient as HTMLElement).style.border = '1px solid #e2e8f0'
      ;(gradient as HTMLElement).style.width = '100%'
      ;(gradient as HTMLElement).style.boxSizing = 'border-box'
    })
    
    // Fix flexbox layouts for PDF
    const flexElements = clonedContent.querySelectorAll('[class*="flex"]')
    flexElements.forEach(element => {
      (element as HTMLElement).style.display = 'block'
      ;(element as HTMLElement).style.width = '100%'
    })
    
    // Fix grid layouts
    const gridElements = clonedContent.querySelectorAll('[class*="grid"]')
    gridElements.forEach(element => {
      (element as HTMLElement).style.display = 'block'
      ;(element as HTMLElement).style.width = '100%'
    })
    
    // Ensure proper text contrast and sizing
    const textElements = clonedContent.querySelectorAll('*')
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element)
      if (styles.color === 'rgb(107, 114, 128)') { // gray-500
        (element as HTMLElement).style.color = '#374151' // gray-700 for better PDF readability
      }
      // Ensure text doesn't wrap awkwardly
      ;(element as HTMLElement).style.wordWrap = 'break-word'
      ;(element as HTMLElement).style.maxWidth = '100%'
    })
    
    // Fix spacing issues
    const spaceElements = clonedContent.querySelectorAll('[class*="space-"]')
    spaceElements.forEach(element => {
      (element as HTMLElement).style.width = '100%'
    })

    // Add header to PDF
    const header = document.createElement('div')
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #3b82f6; background: #f8fafc; width: 100%; box-sizing: border-box;">
        <h1 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px; font-weight: bold; line-height: 1.2;">📋 Code Analysis Report</h1>
        <div style="color: #6b7280; font-size: 13px; line-height: 1.4;">
          <div style="margin-bottom: 8px;">
            <strong>Analysis ID:</strong> ${analysisId} • <strong>Generated:</strong> ${new Date().toLocaleDateString()}
          </div>
          <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
            <span><strong>Quality Score:</strong> ${analysisData.results?.codeQualityScore || analysisData.code_quality_score || 0}/100</span>
            <span><strong>Files:</strong> ${analysisData.results?.totalFiles || analysisData.total_files || 0}</span>
            <span><strong>Lines:</strong> ${(analysisData.results?.totalLines || analysisData.total_lines || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `
    
    tempContainer.appendChild(header)
    tempContainer.appendChild(clonedContent)
    document.body.appendChild(tempContainer)

    // Generate canvas from the content
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    // Remove temporary container
    document.body.removeChild(tempContainer)

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margins = 10 // 10mm margins
    const contentWidth = pdfWidth - (margins * 2)
    const contentHeight = pdfHeight - (margins * 2)
    
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // Calculate proper scaling to fit page width
    const scale = contentWidth / (imgWidth * 0.264583) // Convert pixels to mm
    const scaledWidth = contentWidth
    const scaledHeight = (imgHeight * 0.264583) * scale
    
    // Add content across multiple pages
    let yPosition = 0
    let pageNumber = 0
    
    while (yPosition < scaledHeight) {
      if (pageNumber > 0) {
        pdf.addPage()
      }
      
      const remainingHeight = scaledHeight - yPosition
      const currentPageHeight = Math.min(contentHeight, remainingHeight)
      
      // Calculate source area of the image for this page
      const sourceY = yPosition / scale / 0.264583
      const sourceHeight = currentPageHeight / scale / 0.264583
      
      // Create a cropped canvas for this page
      const pageCanvas = document.createElement('canvas')
      const pageCtx = pageCanvas.getContext('2d')!
      pageCanvas.width = imgWidth
      pageCanvas.height = Math.min(sourceHeight, imgHeight - sourceY)
      
      pageCtx.drawImage(
        canvas,
        0, sourceY, imgWidth, pageCanvas.height,
        0, 0, imgWidth, pageCanvas.height
      )
      
      const pageImgData = pageCanvas.toDataURL('image/png')
      
      pdf.addImage(
        pageImgData,
        'PNG',
        margins,
        margins,
        scaledWidth,
        (pageCanvas.height * 0.264583) * scale
      )
      
      yPosition += contentHeight
      pageNumber++
    }

    // Generate filename
    const repoName = analysisData.source_reference?.split('/').pop() || 'analysis'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${repoName}_analysis_${date}.pdf`
    
    // Download PDF
    pdf.save(filename)
    
    return { success: true, filename }
    
  } catch (error) {
    console.error('PDF export failed:', error)
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const exportDocumentationToPDF = async (analysisId: string, analysisData: any): Promise<{ success: boolean; filename: string }> => {
  try {
    // Find the documentation section specifically
    const docSection = document.querySelector('[data-section="documentation"]') as HTMLElement
    
    if (!docSection) {
      // Fallback to full report if documentation section not found
      return exportAnalysisToPDF(analysisId, analysisData)
    }

    // Create a clean documentation-only PDF
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = '210mm'
    tempContainer.style.backgroundColor = 'white'
    tempContainer.style.padding = '20px'
    tempContainer.style.fontFamily = 'Arial, sans-serif'
    
    // Add header
    const header = document.createElement('div')
    header.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #10b981;">
        <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">📋 Technical Documentation</h1>
        <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
          Analysis ID: ${analysisId} • Generated: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `
    
    const clonedDoc = docSection.cloneNode(true) as HTMLElement
    
    // Remove buttons and interactive elements
    const buttons = clonedDoc.querySelectorAll('button')
    buttons.forEach(button => button.remove())
    
    tempContainer.appendChild(header)
    tempContainer.appendChild(clonedDoc)
    document.body.appendChild(tempContainer)

    const canvas = await html2canvas(tempContainer, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    document.body.removeChild(tempContainer)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const scaledWidth = imgWidth * ratio
    const scaledHeight = imgHeight * ratio
    
    let position = 0
    
    while (position < scaledHeight) {
      if (position > 0) {
        pdf.addPage()
      }
      
      pdf.addImage(
        imgData,
        'PNG',
        0,
        -position,
        scaledWidth,
        scaledHeight
      )
      
      position += pdfHeight
    }

    const repoName = analysisData.source_reference?.split('/').pop() || 'analysis'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${repoName}_documentation_${date}.pdf`
    
    pdf.save(filename)
    
    return { success: true, filename }
    
  } catch (error) {
    console.error('Documentation PDF export failed:', error)
    throw new Error(`Documentation PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}