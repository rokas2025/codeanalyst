/**
 * Yoast SEO Service - Content SEO Analysis
 * Based on Yoast SEO's open-source analysis
 * 100% FREE, no API key required!
 * Used by 5+ million WordPress sites
 */

import { Paper } from 'yoastseo';
import logger from '../utils/logger.js';

export class YoastSEOService {
  /**
   * Analyze content for SEO
   * @param {string} content - The content to analyze
   * @param {string} keyword - Focus keyword/phrase
   * @param {string} title - Page title
   * @param {string} metaDescription - Meta description
   * @param {string} url - Page URL (optional)
   * @returns {Object} SEO analysis results
   */
  analyzeSEO(content, keyword, title = '', metaDescription = '', url = '') {
    try {
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: 'No content provided for analysis'
        };
      }

      if (!keyword || keyword.trim().length === 0) {
        return {
          success: false,
          error: 'No focus keyword provided'
        };
      }

      const paper = new Paper(content, {
        keyword: keyword,
        title: title,
        description: metaDescription,
        url: url,
        locale: 'en_US'
      });

      const seoScore = this.calculateSEOScore(paper);
      
      return {
        success: true,
        overallScore: seoScore.score,
        grade: seoScore.grade,
        analysis: {
          keywordDensity: this.analyzeKeywordDensity(paper),
          titleAnalysis: this.analyzeTitleTag(paper),
          metaDescription: this.analyzeMetaDescription(paper),
          contentLength: this.analyzeContentLength(paper),
          headings: this.analyzeHeadings(content, keyword),
          links: this.analyzeLinks(content),
          images: this.analyzeImages(content),
          keywordPosition: this.analyzeKeywordPosition(content, keyword),
          readability: this.analyzeReadability(content)
        },
        recommendations: this.getRecommendations(paper, content, keyword),
        passedChecks: seoScore.passedChecks,
        failedChecks: seoScore.failedChecks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Yoast SEO analysis error:', error.message);
      
      return {
        success: false,
        error: error.message,
        code: 'ANALYSIS_FAILED'
      };
    }
  }

  /**
   * Analyze keyword density
   */
  analyzeKeywordDensity(paper) {
    const wordCount = paper.getWordCount();
    const keyword = paper.getKeyword().toLowerCase();
    const content = paper.getText().toLowerCase();
    
    // Count exact matches and variations
    const keywordRegex = new RegExp(keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    const matches = content.match(keywordRegex) || [];
    const occurrences = matches.length;
    const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
    
    // Optimal density: 0.5% - 2.5%
    let status = 'good';
    let message = 'Keyword density is optimal';
    
    if (density < 0.5) {
      status = 'warning';
      message = 'Keyword appears too few times. Add it a few more times naturally.';
    } else if (density > 2.5) {
      status = 'error';
      message = 'Keyword density too high! Risk of keyword stuffing. Remove some occurrences.';
    }

    return {
      keyword: keyword,
      occurrences: occurrences,
      density: density.toFixed(2) + '%',
      status: status,
      message: message,
      optimal: density >= 0.5 && density <= 2.5
    };
  }

  /**
   * Analyze title tag
   */
  analyzeTitleTag(paper) {
    const title = paper.getTitle();
    const keyword = paper.getKeyword().toLowerCase();
    const titleLength = title.length;
    const hasKeyword = title.toLowerCase().includes(keyword);
    
    // Optimal: 30-60 characters
    let status = 'good';
    const issues = [];

    if (titleLength < 30) {
      status = 'warning';
      issues.push(`Title is too short (${titleLength} chars). Aim for 30-60 characters.`);
    } else if (titleLength > 60) {
      status = 'warning';
      issues.push(`Title is too long (${titleLength} chars). It may be truncated in search results.`);
    }

    if (!hasKeyword) {
      status = 'error';
      issues.push('Focus keyword not found in title. Add it for better SEO.');
    } else {
      // Check keyword position (earlier is better)
      const keywordPosition = title.toLowerCase().indexOf(keyword);
      if (keywordPosition > title.length / 2) {
        issues.push('Consider moving focus keyword closer to the beginning of the title.');
      }
    }

    return {
      title: title,
      length: titleLength,
      hasKeyword: hasKeyword,
      status: status,
      optimal: titleLength >= 30 && titleLength <= 60 && hasKeyword,
      issues: issues,
      recommendation: issues.length === 0 ? 'Title is well optimized!' : issues.join(' ')
    };
  }

  /**
   * Analyze meta description
   */
  analyzeMetaDescription(paper) {
    const description = paper.getDescription();
    const keyword = paper.getKeyword().toLowerCase();
    const length = description.length;
    const hasKeyword = description.toLowerCase().includes(keyword);
    
    // Optimal: 120-160 characters
    let status = 'good';
    const issues = [];

    if (length < 120) {
      status = 'warning';
      issues.push(`Meta description is too short (${length} chars). Aim for 120-160 characters.`);
    } else if (length > 160) {
      status = 'warning';
      issues.push(`Meta description is too long (${length} chars). It may be truncated.`);
    }

    if (!hasKeyword) {
      status = 'warning';
      issues.push('Focus keyword not found in meta description.');
    }

    return {
      description: description,
      length: length,
      hasKeyword: hasKeyword,
      status: status,
      optimal: length >= 120 && length <= 160 && hasKeyword,
      issues: issues,
      recommendation: issues.length === 0 ? 'Meta description is well optimized!' : issues.join(' ')
    };
  }

  /**
   * Analyze content length
   */
  analyzeContentLength(paper) {
    const wordCount = paper.getWordCount();
    
    // Minimum 300 words for SEO
    let status = 'good';
    let message = 'Content length is sufficient';
    
    if (wordCount < 300) {
      status = 'error';
      message = `Content is too short (${wordCount} words). Add at least ${300 - wordCount} more words for better SEO.`;
    } else if (wordCount < 600) {
      status = 'warning';
      message = `Content is acceptable but could be longer. Aim for 600+ words for comprehensive coverage.`;
    } else {
      message = `Excellent! ${wordCount} words provide comprehensive content.`;
    }

    return {
      wordCount: wordCount,
      status: status,
      message: message,
      optimal: wordCount >= 600
    };
  }

  /**
   * Analyze headings structure
   */
  analyzeHeadings(content, keyword) {
    const h1Matches = content.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
    
    const h1Texts = h1Matches.map(h => h.replace(/<[^>]*>/g, ''));
    const h2Texts = h2Matches.map(h => h.replace(/<[^>]*>/g, ''));
    
    const h1HasKeyword = h1Texts.some(h => 
      h.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const h2HasKeyword = h2Texts.some(h => 
      h.toLowerCase().includes(keyword.toLowerCase())
    );

    let status = 'good';
    const issues = [];

    if (h1Matches.length === 0) {
      status = 'error';
      issues.push('Add one H1 heading (main title)');
    } else if (h1Matches.length > 1) {
      status = 'warning';
      issues.push('Multiple H1 headings found. Use only one H1 per page.');
    }

    if (h2Matches.length === 0) {
      status = 'warning';
      issues.push('Add H2 subheadings to structure your content');
    }

    if (!h1HasKeyword && h1Matches.length > 0) {
      issues.push('Include focus keyword in H1 heading');
    }

    return {
      h1Count: h1Matches.length,
      h2Count: h2Matches.length,
      h3Count: h3Matches.length,
      h1HasKeyword: h1HasKeyword,
      h2HasKeyword: h2HasKeyword,
      status: status,
      issues: issues,
      optimal: h1Matches.length === 1 && h2Matches.length > 0 && h1HasKeyword
    };
  }

  /**
   * Analyze links
   */
  analyzeLinks(content) {
    // Internal links (relative URLs)
    const internalLinks = (content.match(/<a[^>]*href=["'](?!http)[^"']*["'][^>]*>/gi) || []).length;
    
    // External links (http/https)
    const externalLinks = (content.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || []).length;
    
    let status = 'good';
    const issues = [];

    if (internalLinks === 0) {
      status = 'warning';
      issues.push('Add internal links to related content on your site');
    }

    if (externalLinks === 0) {
      issues.push('Consider adding 1-2 external links to authoritative sources');
    }

    return {
      internalLinks: internalLinks,
      externalLinks: externalLinks,
      totalLinks: internalLinks + externalLinks,
      status: status,
      issues: issues,
      optimal: internalLinks > 0
    };
  }

  /**
   * Analyze images
   */
  analyzeImages(content) {
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = (content.match(/<img[^>]*alt=["'][^"']+["'][^>]*>/gi) || []).length;
    const imagesWithoutAlt = images.length - imagesWithAlt;
    
    let status = 'good';
    const issues = [];

    if (images.length === 0) {
      status = 'warning';
      issues.push('Consider adding images to enhance your content');
    }

    if (imagesWithoutAlt > 0) {
      status = 'warning';
      issues.push(`${imagesWithoutAlt} image(s) missing alt text. Add descriptive alt text for SEO and accessibility.`);
    }

    return {
      totalImages: images.length,
      imagesWithAlt: imagesWithAlt,
      imagesWithoutAlt: imagesWithoutAlt,
      status: status,
      issues: issues,
      optimal: images.length > 0 && imagesWithoutAlt === 0
    };
  }

  /**
   * Analyze keyword position in content
   */
  analyzeKeywordPosition(content, keyword) {
    const cleanContent = content.replace(/<[^>]*>/g, ' ').trim();
    const firstParagraph = cleanContent.split(/\n\n/)[0] || '';
    const words = cleanContent.split(/\s+/);
    const firstHundredWords = words.slice(0, 100).join(' ');
    
    const keywordInFirst100 = firstHundredWords.toLowerCase().includes(keyword.toLowerCase());
    const keywordInFirstParagraph = firstParagraph.toLowerCase().includes(keyword.toLowerCase());
    
    let status = 'good';
    let message = 'Focus keyword appears early in content';
    
    if (!keywordInFirst100) {
      status = 'warning';
      message = 'Consider including focus keyword in the first 100 words';
    }

    return {
      inFirst100Words: keywordInFirst100,
      inFirstParagraph: keywordInFirstParagraph,
      status: status,
      message: message,
      optimal: keywordInFirst100
    };
  }

  /**
   * Basic readability analysis
   */
  analyzeReadability(content) {
    const cleanContent = content.replace(/<[^>]*>/g, ' ');
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    
    let status = 'good';
    let message = 'Content is readable';
    
    if (avgWordsPerSentence > 25) {
      status = 'warning';
      message = 'Sentences are quite long. Try breaking them into shorter sentences.';
    } else if (avgWordsPerSentence > 20) {
      status = 'warning';
      message = 'Some sentences are long. Consider shortening them for better readability.';
    }

    return {
      averageWordsPerSentence: avgWordsPerSentence.toFixed(1),
      status: status,
      message: message
    };
  }

  /**
   * Calculate overall SEO score
   */
  calculateSEOScore(paper) {
    let score = 100;
    let passedChecks = 0;
    let failedChecks = 0;

    // Title (15 points)
    const title = paper.getTitle();
    const keyword = paper.getKeyword().toLowerCase();
    if (title.length < 30 || title.length > 60) {
      score -= 7;
      failedChecks++;
    } else passedChecks++;
    
    if (!title.toLowerCase().includes(keyword)) {
      score -= 8;
      failedChecks++;
    } else passedChecks++;

    // Content length (15 points)
    const wordCount = paper.getWordCount();
    if (wordCount < 300) {
      score -= 15;
      failedChecks++;
    } else if (wordCount < 600) {
      score -= 5;
      passedChecks++;
    } else passedChecks++;

    // Meta description (10 points)
    const desc = paper.getDescription();
    if (desc.length < 120 || desc.length > 160) {
      score -= 5;
      failedChecks++;
    } else passedChecks++;
    
    if (!desc.toLowerCase().includes(keyword)) {
      score -= 5;
      failedChecks++;
    } else passedChecks++;

    // Keyword density (15 points)
    const content = paper.getText();
    const matches = (content.toLowerCase().match(new RegExp(keyword, 'gi')) || []).length;
    const density = (matches / wordCount) * 100;
    if (density < 0.5 || density > 2.5) {
      score -= 15;
      failedChecks++;
    } else passedChecks++;

    score = Math.max(0, score);
    
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return {
      score: score,
      grade: grade,
      passedChecks: passedChecks,
      failedChecks: failedChecks
    };
  }

  /**
   * Get actionable recommendations
   */
  getRecommendations(paper, content, keyword) {
    const recommendations = [];
    
    const titleAnalysis = this.analyzeTitleTag(paper);
    const metaAnalysis = this.analyzeMetaDescription(paper);
    const contentAnalysis = this.analyzeContentLength(paper);
    const headingsAnalysis = this.analyzeHeadings(content, keyword);
    const linksAnalysis = this.analyzeLinks(content);
    const imagesAnalysis = this.analyzeImages(content);

    // Priority recommendations
    if (!titleAnalysis.optimal) {
      recommendations.push({
        priority: 'high',
        category: 'Title Tag',
        message: titleAnalysis.recommendation
      });
    }

    if (!contentAnalysis.optimal) {
      recommendations.push({
        priority: 'high',
        category: 'Content Length',
        message: contentAnalysis.message
      });
    }

    if (!metaAnalysis.optimal) {
      recommendations.push({
        priority: 'medium',
        category: 'Meta Description',
        message: metaAnalysis.recommendation
      });
    }

    if (!headingsAnalysis.optimal) {
      recommendations.push({
        priority: 'medium',
        category: 'Headings',
        message: headingsAnalysis.issues.join(' ')
      });
    }

    if (linksAnalysis.issues.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'Links',
        message: linksAnalysis.issues.join(' ')
      });
    }

    if (imagesAnalysis.issues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Images',
        message: imagesAnalysis.issues.join(' ')
      });
    }

    return recommendations;
  }
}

export default YoastSEOService;

