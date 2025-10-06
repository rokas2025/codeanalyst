/**
 * Google PageSpeed Insights Service
 * Provides performance, SEO, accessibility, and best practices analysis
 * FREE: 25,000 requests/day!
 */

import axios from 'axios';
import logger from '../utils/logger.js';

export class PageSpeedService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  }

  /**
   * Analyze URL with PageSpeed Insights
   * @param {string} url - URL to analyze
   * @param {string} strategy - 'mobile' or 'desktop'
   * @returns {Object} Analysis results
   */
  async analyzeUrl(url, strategy = 'mobile') {
    try {
      if (!this.apiKey) {
        throw new Error('Google PageSpeed API key not configured');
      }

      logger.info(`Analyzing ${url} with PageSpeed Insights (${strategy})`);

      const response = await axios.get(this.baseUrl, {
        params: {
          url: url,
          key: this.apiKey,
          strategy: strategy,
          category: ['performance', 'accessibility', 'best-practices', 'seo']
        },
        timeout: 60000 // 60 seconds
      });

      const lighthouse = response.data.lighthouseResult;
      const categories = lighthouse.categories;
      const audits = lighthouse.audits;

      return {
        success: true,
        strategy: strategy,
        scores: {
          performance: Math.round((categories.performance?.score || 0) * 100),
          accessibility: Math.round((categories.accessibility?.score || 0) * 100),
          bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
          seo: Math.round((categories.seo?.score || 0) * 100)
        },
        coreWebVitals: {
          lcp: {
            value: audits['largest-contentful-paint']?.displayValue || 'N/A',
            score: audits['largest-contentful-paint']?.score || 0,
            numericValue: audits['largest-contentful-paint']?.numericValue || 0,
            description: 'Largest Contentful Paint',
            passing: (audits['largest-contentful-paint']?.numericValue || 9999) < 2500
          },
          fid: {
            value: audits['max-potential-fid']?.displayValue || 'N/A',
            score: audits['max-potential-fid']?.score || 0,
            numericValue: audits['max-potential-fid']?.numericValue || 0,
            description: 'Max Potential First Input Delay',
            passing: (audits['max-potential-fid']?.numericValue || 9999) < 100
          },
          cls: {
            value: audits['cumulative-layout-shift']?.displayValue || 'N/A',
            score: audits['cumulative-layout-shift']?.score || 0,
            numericValue: audits['cumulative-layout-shift']?.numericValue || 0,
            description: 'Cumulative Layout Shift',
            passing: (audits['cumulative-layout-shift']?.numericValue || 9999) < 0.1
          },
          fcp: {
            value: audits['first-contentful-paint']?.displayValue || 'N/A',
            score: audits['first-contentful-paint']?.score || 0,
            numericValue: audits['first-contentful-paint']?.numericValue || 0,
            description: 'First Contentful Paint'
          },
          tti: {
            value: audits['interactive']?.displayValue || 'N/A',
            score: audits['interactive']?.score || 0,
            numericValue: audits['interactive']?.numericValue || 0,
            description: 'Time to Interactive'
          },
          tbt: {
            value: audits['total-blocking-time']?.displayValue || 'N/A',
            score: audits['total-blocking-time']?.score || 0,
            numericValue: audits['total-blocking-time']?.numericValue || 0,
            description: 'Total Blocking Time'
          },
          speedIndex: {
            value: audits['speed-index']?.displayValue || 'N/A',
            score: audits['speed-index']?.score || 0,
            numericValue: audits['speed-index']?.numericValue || 0,
            description: 'Speed Index'
          }
        },
        opportunities: this.extractOpportunities(audits),
        diagnostics: this.extractDiagnostics(audits),
        loadingExperience: response.data.loadingExperience || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('PageSpeed analysis error:', error.message);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT'
        };
      }
      
      return {
        success: false,
        error: error.message,
        code: 'ANALYSIS_FAILED'
      };
    }
  }

  /**
   * Analyze with both mobile and desktop strategies
   */
  async analyzeWithBothStrategies(url) {
    try {
      const [mobile, desktop] = await Promise.all([
        this.analyzeUrl(url, 'mobile'),
        this.analyzeUrl(url, 'desktop')
      ]);

      return {
        success: true,
        mobile: mobile,
        desktop: desktop,
        comparison: this.compareStrategies(mobile, desktop),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract optimization opportunities
   */
  extractOpportunities(audits) {
    const opportunityKeys = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript'
    ];

    return opportunityKeys
      .filter(key => audits[key] && audits[key].score !== null && audits[key].score < 1)
      .map(key => ({
        title: audits[key].title,
        description: audits[key].description,
        score: audits[key].score,
        displayValue: audits[key].displayValue,
        savings: {
          ms: audits[key].details?.overallSavingsMs || 0,
          bytes: audits[key].details?.overallSavingsBytes || 0
        }
      }))
      .sort((a, b) => b.savings.ms - a.savings.ms)
      .slice(0, 10); // Top 10 opportunities
  }

  /**
   * Extract diagnostic information
   */
  extractDiagnostics(audits) {
    const diagnosticKeys = [
      'mainthread-work-breakdown',
      'bootup-time',
      'uses-long-cache-ttl',
      'total-byte-weight',
      'dom-size',
      'critical-request-chains',
      'user-timings',
      'network-rtt',
      'network-server-latency'
    ];

    return diagnosticKeys
      .filter(key => audits[key])
      .map(key => ({
        id: key,
        title: audits[key].title,
        description: audits[key].description,
        displayValue: audits[key].displayValue,
        score: audits[key].score
      }));
  }

  /**
   * Compare mobile vs desktop performance
   */
  compareStrategies(mobile, desktop) {
    if (!mobile.success || !desktop.success) {
      return null;
    }

    return {
      performance: {
        mobile: mobile.scores.performance,
        desktop: desktop.scores.performance,
        difference: desktop.scores.performance - mobile.scores.performance,
        winner: desktop.scores.performance > mobile.scores.performance ? 'desktop' : 'mobile'
      },
      accessibility: {
        mobile: mobile.scores.accessibility,
        desktop: desktop.scores.accessibility,
        difference: desktop.scores.accessibility - mobile.scores.accessibility
      },
      seo: {
        mobile: mobile.scores.seo,
        desktop: desktop.scores.seo,
        difference: desktop.scores.seo - mobile.scores.seo
      },
      recommendations: this.getComparisonRecommendations(mobile, desktop)
    };
  }

  /**
   * Get recommendations based on comparison
   */
  getComparisonRecommendations(mobile, desktop) {
    const recommendations = [];
    
    const perfDiff = desktop.scores.performance - mobile.scores.performance;
    if (perfDiff > 20) {
      recommendations.push({
        priority: 'high',
        message: 'Mobile performance is significantly lower than desktop. Optimize for mobile first.',
        focus: 'mobile'
      });
    }

    if (mobile.scores.performance < 50) {
      recommendations.push({
        priority: 'critical',
        message: 'Mobile performance is poor. This affects user experience and SEO rankings.',
        focus: 'mobile'
      });
    }

    if (mobile.scores.seo < 90) {
      recommendations.push({
        priority: 'high',
        message: 'Mobile SEO score can be improved. Check mobile-friendliness and page structure.',
        focus: 'seo'
      });
    }

    return recommendations;
  }

  /**
   * Get overall grade (A-F)
   */
  getOverallGrade(scores) {
    const avg = (scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4;
    
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B';
    if (avg >= 70) return 'C';
    if (avg >= 60) return 'D';
    return 'F';
  }
}

export default PageSpeedService;

