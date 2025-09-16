// Real URL to File Structure Converter
// Converts actual website content into analyzable file structures

import { RealURLScanResult } from '../services/urlFetcher'

export interface AnalyzableFile {
  path: string
  content: string
  size: number
}

export class RealUrlToFileConverter {
  
  /**
   * Convert real URL scan results to file structure for analysis
   */
  convertToFileStructure(scanResult: RealURLScanResult): AnalyzableFile[] {
    const files: AnalyzableFile[] = []
    
    console.log(`🔄 Converting real website data to analyzable files...`)
    
    // 1. Main HTML file
    files.push(this.createHTMLFile(scanResult))
    
    // 2. Extract and create CSS files
    files.push(...this.createCSSFiles(scanResult))
    
    // 3. Extract and create JavaScript files  
    files.push(...this.createJavaScriptFiles(scanResult))
    
    // 4. Create package.json with detected technologies
    files.push(this.createPackageJson(scanResult))
    
    // 5. Create README with analysis summary
    files.push(this.createReadme(scanResult))
    
    // 6. Create SEO configuration file
    files.push(this.createSEOConfig(scanResult))
    
    // 7. Create accessibility report
    files.push(this.createAccessibilityReport(scanResult))
    
    // 8. Create security analysis file
    files.push(this.createSecurityReport(scanResult))
    
    console.log(`✅ Created ${files.length} analyzable files from real website data`)
    
    return files
  }
  
  /**
   * Create main HTML file with actual content
   */
  private createHTMLFile(scanResult: RealURLScanResult): AnalyzableFile {
    // Use the actual HTML content fetched from the website
    const content = scanResult.html
    
    return {
      path: 'index.html',
      content,
      size: content.length
    }
  }
  
  /**
   * Create CSS files from actual stylesheets
   */
  private createCSSFiles(scanResult: RealURLScanResult): AnalyzableFile[] {
    const cssFiles: AnalyzableFile[] = []
    
    scanResult.stylesheets.forEach((stylesheet, index) => {
      if (stylesheet.content) {
        // Inline CSS content
        cssFiles.push({
          path: `styles/inline-${index + 1}.css`,
          content: stylesheet.content,
          size: stylesheet.content.length
        })
      } else if (stylesheet.href) {
        // External CSS - create a placeholder with metadata
        const cssMetadata = this.createCSSMetadata(stylesheet.href, stylesheet.media)
        cssFiles.push({
          path: `styles/${this.extractFilename(stylesheet.href, 'style.css')}`,
          content: cssMetadata,
          size: cssMetadata.length
        })
      }
    })
    
    // If no CSS found, create basic styles analysis
    if (cssFiles.length === 0) {
      const basicStyles = this.analyzeInlineStyles(scanResult.html)
      cssFiles.push({
        path: 'styles/extracted-styles.css',
        content: basicStyles,
        size: basicStyles.length
      })
    }
    
    return cssFiles
  }
  
  /**
   * Create JavaScript files from actual scripts
   */
  private createJavaScriptFiles(scanResult: RealURLScanResult): AnalyzableFile[] {
    const jsFiles: AnalyzableFile[] = []
    
    scanResult.scripts.forEach((script, index) => {
      if (script.content && script.content.trim()) {
        // Inline JavaScript content
        jsFiles.push({
          path: `scripts/inline-${index + 1}.js`,
          content: script.content,
          size: script.content.length
        })
      } else if (script.src) {
        // External JavaScript - create metadata file
        const jsMetadata = this.createJSMetadata(script.src, script.type)
        jsFiles.push({
          path: `scripts/${this.extractFilename(script.src, 'script.js')}`,
          content: jsMetadata,
          size: jsMetadata.length
        })
      }
    })
    
    // Create main analysis file with technology detection
    const mainJS = this.createMainJSAnalysis(scanResult)
    jsFiles.push({
      path: 'scripts/technology-analysis.js',
      content: mainJS,
      size: mainJS.length
    })
    
    return jsFiles
  }
  
  /**
   * Create package.json with real detected technologies
   */
  private createPackageJson(scanResult: RealURLScanResult): AnalyzableFile {
    const packageData = {
      name: this.extractDomainName(scanResult.url),
      version: "1.0.0",
      description: scanResult.seo.description || `Website analysis for ${scanResult.url}`,
      keywords: scanResult.seo.keywords ? scanResult.seo.keywords.split(',').map(k => k.trim()) : [],
      homepage: scanResult.url,
      technologies: scanResult.technologies,
      scripts: this.extractScriptReferences(scanResult),
      metadata: {
        title: scanResult.title,
        domElements: scanResult.performance.domElements,
        resourceCount: scanResult.performance.resourceCount,
        pageSize: scanResult.performance.pageSize,
        isHttps: scanResult.security.isHttps,
        hasSecurityHeaders: scanResult.security.hasSecurityHeaders,
        seoScore: this.calculateSEOScore(scanResult.seo),
        accessibilityScore: this.calculateAccessibilityScore(scanResult.accessibility)
      },
      analysis: {
        scannedAt: new Date().toISOString(),
        userAgent: "CodeAnalyst-Bot/1.0",
        realDataConfidence: 100
      }
    }
    
    const content = JSON.stringify(packageData, null, 2)
    
    return {
      path: 'package.json',
      content,
      size: content.length
    }
  }
  
  /**
   * Create README with website analysis summary
   */
  private createReadme(scanResult: RealURLScanResult): AnalyzableFile {
    const content = `# Website Analysis Report

## 🌐 URL: ${scanResult.url}
**Title:** ${scanResult.title}

## 📊 Overview
- **DOM Elements:** ${scanResult.performance.domElements.toLocaleString()}
- **Page Size:** ${Math.round(scanResult.performance.pageSize / 1024)}KB
- **Resources:** ${scanResult.performance.resourceCount}
- **Technologies:** ${scanResult.technologies.join(', ')}

## 🔒 Security
- **HTTPS:** ${scanResult.security.isHttps ? '✅ Yes' : '❌ No'}
- **Security Headers:** ${scanResult.security.hasSecurityHeaders.length > 0 ? scanResult.security.hasSecurityHeaders.join(', ') : 'None detected'}
- **Mixed Content:** ${scanResult.security.mixedContent ? '⚠️ Detected' : '✅ Clean'}
- **Outdated Libraries:** ${scanResult.security.outdatedLibraries.length > 0 ? scanResult.security.outdatedLibraries.join(', ') : 'None detected'}

## 🎯 SEO Analysis
- **Title Length:** ${scanResult.seo.titleLength} characters
- **Description Length:** ${scanResult.seo.descriptionLength} characters
- **H1 Tags:** ${scanResult.seo.h1Tags.length}
- **H2 Tags:** ${scanResult.seo.h2Tags.length}
- **Open Graph:** ${scanResult.seo.hasOpenGraph ? '✅ Yes' : '❌ No'}
- **Structured Data:** ${scanResult.seo.hasStructuredData ? '✅ Yes' : '❌ No'}

## ♿ Accessibility
- **Images with Alt Text:** ${scanResult.accessibility.altTexts}/${scanResult.accessibility.altTexts + scanResult.accessibility.missingAltTexts}
- **ARIA Labels:** ${scanResult.accessibility.ariaLabels}
- **Proper Heading Structure:** ${scanResult.accessibility.headingStructure ? '✅ Yes' : '❌ No'}
- **Form Labels:** ${scanResult.accessibility.formLabels}

## 🔗 Links Analysis
- **Total Links:** ${scanResult.links.length}
- **External Links:** ${scanResult.links.filter(link => !link.href.includes(this.extractDomainName(scanResult.url))).length}
- **Internal Links:** ${scanResult.links.filter(link => link.href.includes(this.extractDomainName(scanResult.url))).length}

## 📱 Resources
- **Scripts:** ${scanResult.scripts.length}
- **Stylesheets:** ${scanResult.stylesheets.length}
- **Images:** ${scanResult.images.length}

---
*Analysis performed on ${new Date().toISOString()} using CodeAnalyst Real URL Scanner*
`
    
    return {
      path: 'README.md',
      content,
      size: content.length
    }
  }
  
  /**
   * Create SEO configuration analysis
   */
  private createSEOConfig(scanResult: RealURLScanResult): AnalyzableFile {
    const seoConfig = {
      meta: scanResult.metaTags,
      title: {
        content: scanResult.seo.title,
        length: scanResult.seo.titleLength,
        recommendations: this.getSEOTitleRecommendations(scanResult.seo.titleLength)
      },
      description: {
        content: scanResult.seo.description,
        length: scanResult.seo.descriptionLength,
        recommendations: this.getSEODescriptionRecommendations(scanResult.seo.descriptionLength)
      },
      headings: {
        h1: scanResult.seo.h1Tags,
        h2: scanResult.seo.h2Tags,
        recommendations: this.getHeadingRecommendations(scanResult.seo.h1Tags, scanResult.seo.h2Tags)
      },
      openGraph: {
        detected: scanResult.seo.hasOpenGraph,
        tags: Object.entries(scanResult.metaTags).filter(([key]) => key.startsWith('og:')),
        recommendations: !scanResult.seo.hasOpenGraph ? ['Add Open Graph meta tags for social sharing'] : []
      },
      structuredData: {
        detected: scanResult.seo.hasStructuredData,
        recommendations: !scanResult.seo.hasStructuredData ? ['Add JSON-LD structured data'] : []
      },
      overallScore: this.calculateSEOScore(scanResult.seo),
      improvements: this.getSEOImprovements(scanResult.seo)
    }
    
    const content = `// SEO Configuration Analysis
// Real data extracted from ${scanResult.url}

export const seoAnalysis = ${JSON.stringify(seoConfig, null, 2)};

// SEO Implementation Recommendations
export const seoRecommendations = {
  immediate: [
    ${seoConfig.improvements.immediate.map(imp => `"${imp}"`).join(',\n    ')}
  ],
  shortTerm: [
    ${seoConfig.improvements.shortTerm.map(imp => `"${imp}"`).join(',\n    ')}
  ],
  longTerm: [
    ${seoConfig.improvements.longTerm.map(imp => `"${imp}"`).join(',\n    ')}
  ]
};`
    
    return {
      path: 'config/seo-analysis.js',
      content,
      size: content.length
    }
  }
  
  /**
   * Create accessibility analysis report
   */
  private createAccessibilityReport(scanResult: RealURLScanResult): AnalyzableFile {
    const accessibilityData = {
      score: this.calculateAccessibilityScore(scanResult.accessibility),
      issues: this.getAccessibilityIssues(scanResult.accessibility),
      improvements: this.getAccessibilityImprovements(scanResult.accessibility),
      compliance: this.checkWCAGCompliance(scanResult.accessibility),
      details: scanResult.accessibility
    }
    
    const content = `// Accessibility Analysis Report
// Based on real content analysis of ${scanResult.url}

export const accessibilityReport = ${JSON.stringify(accessibilityData, null, 2)};

// WCAG 2.1 Compliance Checker
export function checkCompliance(level = 'AA') {
  const issues = [];
  
  // Check alt text compliance
  if (${scanResult.accessibility.missingAltTexts} > 0) {
    issues.push({
      level: 'A',
      criterion: '1.1.1 Non-text Content',
      issue: '${scanResult.accessibility.missingAltTexts} images missing alt text',
      impact: 'high'
    });
  }
  
  // Check heading structure
  if (!${scanResult.accessibility.headingStructure}) {
    issues.push({
      level: 'AA',
      criterion: '1.3.1 Info and Relationships',
      issue: 'Improper heading structure detected',
      impact: 'medium'
    });
  }
  
  // Check form labels
  if (${scanResult.accessibility.formLabels} === 0) {
    issues.push({
      level: 'A',
      criterion: '1.3.1 Info and Relationships',
      issue: 'Form elements may be missing labels',
      impact: 'high'
    });
  }
  
  return {
    level,
    compliant: issues.filter(i => i.level === 'A').length === 0,
    issues,
    score: ${accessibilityData.score}
  };
}`
    
    return {
      path: 'reports/accessibility-analysis.js',
      content,
      size: content.length
    }
  }
  
  /**
   * Create security analysis report
   */
  private createSecurityReport(scanResult: RealURLScanResult): AnalyzableFile {
    const securityData = {
      score: this.calculateSecurityScore(scanResult.security),
      vulnerabilities: this.getSecurityVulnerabilities(scanResult.security),
      recommendations: this.getSecurityRecommendations(scanResult.security),
      headers: scanResult.rawData.headers,
      details: scanResult.security
    }
    
    const content = `// Security Analysis Report
// Real security assessment of ${scanResult.url}

export const securityReport = ${JSON.stringify(securityData, null, 2)};

// Security Headers Checker
export function checkSecurityHeaders() {
  const headers = ${JSON.stringify(scanResult.rawData.headers, null, 2)};
  const required = [
    'strict-transport-security',
    'content-security-policy', 
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy'
  ];
  
  const missing = required.filter(header => !headers[header]);
  const present = required.filter(header => headers[header]);
  
  return {
    score: Math.round((present.length / required.length) * 100),
    missing,
    present,
    recommendations: missing.map(h => \`Add \${h} header\`)
  };
}

// Mixed Content Detection
export const mixedContentCheck = {
  detected: ${scanResult.security.mixedContent},
  https: ${scanResult.security.isHttps},
  recommendations: ${scanResult.security.mixedContent} ? [
    'Fix mixed content issues',
    'Ensure all resources load over HTTPS'
  ] : []
};`
    
    return {
      path: 'reports/security-analysis.js',
      content,
      size: content.length
    }
  }
  
  // Helper methods
  
  private extractFilename(url: string, fallback: string): string {
    try {
      const pathname = new URL(url).pathname
      const filename = pathname.split('/').pop() || fallback
      return filename.includes('.') ? filename : fallback
    } catch {
      return fallback
    }
  }
  
  private extractDomainName(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return 'unknown-domain'
    }
  }
  
  private createCSSMetadata(href: string, media?: string): string {
    return `/* External CSS: ${href} */
/* Media: ${media || 'all'} */
/* This is a reference to an external stylesheet */
/* The actual content would need to be fetched separately */

@import url("${href}");

/* Analysis metadata */
:root {
  --external-css-source: "${href}";
  --media-query: "${media || 'all'}";
  --analysis-note: "External stylesheet detected";
}`
  }
  
  private createJSMetadata(src: string, type?: string): string {
    return `// External JavaScript: ${src}
// Type: ${type || 'text/javascript'}
// This is a reference to an external script

/* Analysis metadata */
const scriptMetadata = {
  source: "${src}",
  type: "${type || 'text/javascript'}",
  analysisNote: "External script detected",
  loadingBehavior: "async/defer detection needed"
};

// Technology detection based on script source
${this.detectTechnologyFromScript(src)}`
  }
  
  private detectTechnologyFromScript(src: string): string {
    const detections = []
    
    if (src.includes('jquery')) detections.push('jQuery')
    if (src.includes('react')) detections.push('React')
    if (src.includes('vue')) detections.push('Vue.js')
    if (src.includes('angular')) detections.push('Angular')
    if (src.includes('bootstrap')) detections.push('Bootstrap')
    if (src.includes('google-analytics') || src.includes('gtag')) detections.push('Google Analytics')
    
    return detections.length > 0 
      ? `\n// Detected technologies: ${detections.join(', ')}`
      : '\n// No specific technologies detected from this script'
  }
  
  private createMainJSAnalysis(scanResult: RealURLScanResult): string {
    return `// Website Technology Analysis
// Based on real content from ${scanResult.url}

const websiteAnalysis = {
  url: "${scanResult.url}",
  technologies: ${JSON.stringify(scanResult.technologies, null, 2)},
  scripts: {
    total: ${scanResult.scripts.length},
    external: ${scanResult.scripts.filter(s => s.src).length},
    inline: ${scanResult.scripts.filter(s => s.content).length}
  },
  performance: ${JSON.stringify(scanResult.performance, null, 2)},
  analysisTimestamp: "${new Date().toISOString()}"
};

// Framework Detection
export function detectFramework() {
  const technologies = websiteAnalysis.technologies;
  
  if (technologies.includes('React')) return 'React';
  if (technologies.includes('Vue.js')) return 'Vue.js';
  if (technologies.includes('Angular')) return 'Angular';
  if (technologies.includes('WordPress')) return 'WordPress';
  if (technologies.includes('jQuery')) return 'jQuery-based';
  
  return 'Vanilla JavaScript';
}

// Performance Analysis
export function analyzePerformance() {
  const perf = websiteAnalysis.performance;
  
  return {
    domComplexity: perf.domElements > 1000 ? 'high' : perf.domElements > 500 ? 'medium' : 'low',
    resourceLoad: perf.resourceCount > 50 ? 'heavy' : perf.resourceCount > 20 ? 'moderate' : 'light',
    pageWeight: perf.pageSize > 1000000 ? 'large' : perf.pageSize > 500000 ? 'medium' : 'small'
  };
}

export default websiteAnalysis;`
  }
  
  private analyzeInlineStyles(html: string): string {
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
    const inlineStyles = styleMatches.map(match => 
      match.replace(/<\/?style[^>]*>/gi, '')
    ).join('\n\n')
    
    if (inlineStyles.trim()) {
      return `/* Extracted inline styles from HTML */\n\n${inlineStyles}`
    }
    
    return `/* No inline styles detected */
/* This indicates the website likely uses external CSS files */
body {
  /* Placeholder for external styles analysis */
}`
  }
  
  private extractScriptReferences(scanResult: RealURLScanResult): Record<string, string> {
    const scripts: Record<string, string> = {}
    
    scanResult.scripts.forEach((script, index) => {
      if (script.src) {
        const key = this.extractFilename(script.src, `script-${index}`)
        scripts[key] = script.src
      }
    })
    
    return scripts
  }
  
  private calculateSEOScore(seo: RealURLScanResult['seo']): number {
    let score = 0
    
    // Title optimization (25 points)
    if (seo.title) score += 10
    if (seo.titleLength >= 30 && seo.titleLength <= 60) score += 15
    
    // Description optimization (25 points)  
    if (seo.description) score += 10
    if (seo.descriptionLength >= 120 && seo.descriptionLength <= 160) score += 15
    
    // Heading structure (20 points)
    if (seo.h1Tags.length === 1) score += 10
    if (seo.h2Tags.length > 0) score += 10
    
    // Technical SEO (30 points)
    if (seo.hasOpenGraph) score += 15
    if (seo.hasStructuredData) score += 15
    
    return Math.min(score, 100)
  }
  
  private calculateAccessibilityScore(accessibility: RealURLScanResult['accessibility']): number {
    let score = 0
    
    // Alt text compliance (40 points)
    const totalImages = accessibility.altTexts + accessibility.missingAltTexts
    if (totalImages > 0) {
      score += Math.round((accessibility.altTexts / totalImages) * 40)
    } else {
      score += 40 // No images is good for this metric
    }
    
    // ARIA labels (20 points)
    if (accessibility.ariaLabels > 0) score += 20
    
    // Heading structure (20 points)
    if (accessibility.headingStructure) score += 20
    
    // Form labels (20 points)
    if (accessibility.formLabels > 0) score += 20
    
    return Math.min(score, 100)
  }
  
  private calculateSecurityScore(security: RealURLScanResult['security']): number {
    let score = 0
    
    // HTTPS (30 points)
    if (security.isHttps) score += 30
    
    // Security headers (40 points)
    score += Math.min(security.hasSecurityHeaders.length * 8, 40)
    
    // Mixed content (15 points)
    if (!security.mixedContent) score += 15
    
    // Outdated libraries (15 points)
    if (security.outdatedLibraries.length === 0) score += 15
    
    return Math.min(score, 100)
  }
  
  private getSEOTitleRecommendations(length: number): string[] {
    const recommendations = []
    
    if (length === 0) recommendations.push('Add a page title')
    else if (length < 30) recommendations.push('Title is too short, aim for 30-60 characters')
    else if (length > 60) recommendations.push('Title is too long, keep it under 60 characters')
    
    return recommendations
  }
  
  private getSEODescriptionRecommendations(length: number): string[] {
    const recommendations = []
    
    if (length === 0) recommendations.push('Add a meta description')
    else if (length < 120) recommendations.push('Description is too short, aim for 120-160 characters')
    else if (length > 160) recommendations.push('Description is too long, keep it under 160 characters')
    
    return recommendations
  }
  
  private getHeadingRecommendations(h1Tags: string[], h2Tags: string[]): string[] {
    const recommendations = []
    
    if (h1Tags.length === 0) recommendations.push('Add an H1 tag')
    else if (h1Tags.length > 1) recommendations.push('Use only one H1 tag per page')
    
    if (h2Tags.length === 0) recommendations.push('Add H2 tags for better content structure')
    
    return recommendations
  }
  
  private getSEOImprovements(seo: RealURLScanResult['seo']): {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  } {
    const immediate = []
    const shortTerm = []
    const longTerm = []
    
    // Immediate fixes
    if (!seo.title) immediate.push('Add page title')
    if (!seo.description) immediate.push('Add meta description')
    if (seo.h1Tags.length === 0) immediate.push('Add H1 heading')
    
    // Short-term improvements
    if (!seo.hasOpenGraph) shortTerm.push('Add Open Graph meta tags')
    if (seo.titleLength < 30 || seo.titleLength > 60) shortTerm.push('Optimize title length')
    if (seo.descriptionLength < 120 || seo.descriptionLength > 160) shortTerm.push('Optimize description length')
    
    // Long-term strategy
    if (!seo.hasStructuredData) longTerm.push('Implement structured data')
    if (seo.h2Tags.length < 2) longTerm.push('Improve content structure with more headings')
    longTerm.push('Regular content optimization and keyword research')
    
    return { immediate, shortTerm, longTerm }
  }
  
  private getAccessibilityIssues(accessibility: RealURLScanResult['accessibility']): string[] {
    const issues = []
    
    if (accessibility.missingAltTexts > 0) {
      issues.push(`${accessibility.missingAltTexts} images missing alt text`)
    }
    
    if (!accessibility.headingStructure) {
      issues.push('Improper heading structure')
    }
    
    if (accessibility.ariaLabels === 0) {
      issues.push('No ARIA labels detected')
    }
    
    if (accessibility.formLabels === 0) {
      issues.push('Form elements may be missing labels')
    }
    
    return issues
  }
  
  private getAccessibilityImprovements(accessibility: RealURLScanResult['accessibility']): string[] {
    const improvements = []
    
    if (accessibility.missingAltTexts > 0) {
      improvements.push('Add alt text to all images')
    }
    
    if (!accessibility.headingStructure) {
      improvements.push('Implement proper heading hierarchy')
    }
    
    if (accessibility.ariaLabels === 0) {
      improvements.push('Add ARIA labels for better screen reader support')
    }
    
    improvements.push('Test with screen readers')
    improvements.push('Ensure keyboard navigation works')
    improvements.push('Check color contrast ratios')
    
    return improvements
  }
  
  private checkWCAGCompliance(accessibility: RealURLScanResult['accessibility']): {
    level: 'A' | 'AA' | 'AAA'
    compliant: boolean
    issues: number
  } {
    let issues = 0
    
    if (accessibility.missingAltTexts > 0) issues++
    if (!accessibility.headingStructure) issues++
    if (accessibility.formLabels === 0) issues++
    
    return {
      level: 'AA',
      compliant: issues === 0,
      issues
    }
  }
  
  private getSecurityVulnerabilities(security: RealURLScanResult['security']): string[] {
    const vulnerabilities = []
    
    if (!security.isHttps) {
      vulnerabilities.push('Site not using HTTPS')
    }
    
    if (security.hasSecurityHeaders.length < 3) {
      vulnerabilities.push('Missing important security headers')
    }
    
    if (security.mixedContent) {
      vulnerabilities.push('Mixed content detected')
    }
    
    if (security.outdatedLibraries.length > 0) {
      vulnerabilities.push('Outdated libraries detected')
    }
    
    return vulnerabilities
  }
  
  private getSecurityRecommendations(security: RealURLScanResult['security']): string[] {
    const recommendations = []
    
    if (!security.isHttps) {
      recommendations.push('Implement HTTPS')
    }
    
    const missingHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ].filter(header => !security.hasSecurityHeaders.includes(header))
    
    missingHeaders.forEach(header => {
      recommendations.push(`Add ${header} header`)
    })
    
    if (security.mixedContent) {
      recommendations.push('Fix mixed content issues')
    }
    
    if (security.outdatedLibraries.length > 0) {
      recommendations.push('Update outdated libraries')
    }
    
    return recommendations
  }
}

// Export singleton instance
export const realUrlConverter = new RealUrlToFileConverter() 