/**
 * Mozilla Observatory Service
 * Security headers and best practices analysis
 * 100% FREE, no API key required!
 */

import axios from 'axios';
import logger from '../utils/logger.js';

export class MozillaObservatoryService {
  constructor() {
    this.baseUrl = 'https://http-observatory.security.mozilla.org/api/v1';
  }

  /**
   * Analyze website security
   * @param {string} url - URL to analyze
   * @returns {Object} Security analysis results
   */
  async analyzeSecurity(url) {
    try {
      const hostname = new URL(url).hostname;
      
      logger.info(`Starting Mozilla Observatory scan for ${hostname}`);

      // Step 1: Start the scan
      const scanResponse = await axios.post(`${this.baseUrl}/analyze`, null, {
        params: {
          host: hostname,
          rescan: 'false', // Use cached results if available
          hidden: 'true'   // Don't display on public results page
        },
        timeout: 30000
      });

      const scanId = scanResponse.data.scan_id;
      
      // Step 2: Wait for scan to complete
      const results = await this.waitForScan(hostname, scanId);
      
      // Step 3: Get detailed test results
      const testsResponse = await axios.get(`${this.baseUrl}/getScanResults`, {
        params: { scan: scanId },
        timeout: 30000
      });

      return {
        success: true,
        grade: results.grade,
        score: results.score,
        scanId: scanId,
        summary: {
          grade: results.grade,
          score: results.score,
          testsPassed: results.tests_passed || 0,
          testsFailed: results.tests_failed || 0,
          testsQuantity: results.tests_quantity || 0
        },
        tests: this.parseTests(testsResponse.data),
        headers: this.analyzeHeaders(testsResponse.data),
        recommendations: this.getRecommendations(testsResponse.data, results),
        riskLevel: this.getRiskLevel(results.score),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Mozilla Observatory analysis error:', error.message);
      
      return {
        success: false,
        error: error.message,
        code: 'ANALYSIS_FAILED'
      };
    }
  }

  /**
   * Wait for scan to complete (with polling)
   */
  async waitForScan(hostname, scanId, maxAttempts = 15) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const response = await axios.get(`${this.baseUrl}/analyze`, {
          params: { host: hostname },
          timeout: 30000
        });

        const state = response.data.state;
        
        if (state === 'FINISHED') {
          return response.data;
        } else if (state === 'FAILED') {
          throw new Error('Scan failed');
        }
        
        logger.info(`Scan state: ${state}, attempt ${i + 1}/${maxAttempts}`);
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('Scan timeout - took too long to complete');
  }

  /**
   * Parse test results
   */
  parseTests(testsData) {
    const tests = {};
    
    for (const [testName, testResult] of Object.entries(testsData)) {
      if (testResult && typeof testResult === 'object' && testResult.pass !== undefined) {
        tests[testName] = {
          name: this.getTestDisplayName(testName),
          passed: testResult.pass,
          score: testResult.score_modifier || 0,
          description: testResult.score_description || '',
          result: testResult.result || 'unknown'
        };
      }
    }
    
    return tests;
  }

  /**
   * Analyze security headers
   */
  analyzeHeaders(testsData) {
    const headers = {
      contentSecurityPolicy: {
        present: testsData['content-security-policy']?.pass || false,
        status: testsData['content-security-policy']?.result || 'missing',
        description: 'Prevents XSS attacks and data injection'
      },
      strictTransportSecurity: {
        present: testsData['strict-transport-security']?.pass || false,
        status: testsData['strict-transport-security']?.result || 'missing',
        description: 'Forces HTTPS connections'
      },
      xFrameOptions: {
        present: testsData['x-frame-options']?.pass || false,
        status: testsData['x-frame-options']?.result || 'missing',
        description: 'Prevents clickjacking attacks'
      },
      xContentTypeOptions: {
        present: testsData['x-content-type-options']?.pass || false,
        status: testsData['x-content-type-options']?.result || 'missing',
        description: 'Prevents MIME type sniffing'
      },
      referrerPolicy: {
        present: testsData['referrer-policy']?.pass || false,
        status: testsData['referrer-policy']?.result || 'missing',
        description: 'Controls referrer information'
      },
      cookies: {
        secure: testsData['cookies']?.pass || false,
        status: testsData['cookies']?.result || 'unknown',
        description: 'Cookie security attributes'
      }
    };

    return headers;
  }

  /**
   * Get actionable recommendations
   */
  getRecommendations(testsData, results) {
    const recommendations = [];

    // CSP
    if (!testsData['content-security-policy']?.pass) {
      recommendations.push({
        severity: 'high',
        header: 'Content-Security-Policy',
        issue: 'Missing or weak Content Security Policy',
        fix: "Add 'Content-Security-Policy' header to prevent XSS attacks",
        example: "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'",
        priority: 1
      });
    }

    // HSTS
    if (!testsData['strict-transport-security']?.pass) {
      recommendations.push({
        severity: 'high',
        header: 'Strict-Transport-Security',
        issue: 'Missing HSTS header',
        fix: "Add 'Strict-Transport-Security' header to enforce HTTPS",
        example: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
        priority: 2
      });
    }

    // X-Frame-Options
    if (!testsData['x-frame-options']?.pass) {
      recommendations.push({
        severity: 'medium',
        header: 'X-Frame-Options',
        issue: 'Missing X-Frame-Options header',
        fix: "Add 'X-Frame-Options' to prevent clickjacking",
        example: "X-Frame-Options: DENY",
        priority: 3
      });
    }

    // X-Content-Type-Options
    if (!testsData['x-content-type-options']?.pass) {
      recommendations.push({
        severity: 'medium',
        header: 'X-Content-Type-Options',
        issue: 'Missing X-Content-Type-Options header',
        fix: "Add 'X-Content-Type-Options' to prevent MIME sniffing",
        example: "X-Content-Type-Options: nosniff",
        priority: 4
      });
    }

    // Referrer Policy
    if (!testsData['referrer-policy']?.pass) {
      recommendations.push({
        severity: 'low',
        header: 'Referrer-Policy',
        issue: 'Missing Referrer-Policy header',
        fix: "Add 'Referrer-Policy' to control referrer information",
        example: "Referrer-Policy: strict-origin-when-cross-origin",
        priority: 5
      });
    }

    // Cookies
    if (!testsData['cookies']?.pass) {
      recommendations.push({
        severity: 'medium',
        header: 'Set-Cookie',
        issue: 'Cookies missing security attributes',
        fix: "Add 'Secure', 'HttpOnly', and 'SameSite' attributes to cookies",
        example: "Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict",
        priority: 3
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score >= 90) return { level: 'low', color: 'green', message: 'Excellent security posture' };
    if (score >= 70) return { level: 'medium', color: 'yellow', message: 'Good security, some improvements possible' };
    if (score >= 50) return { level: 'high', color: 'orange', message: 'Moderate security risks present' };
    return { level: 'critical', color: 'red', message: 'Significant security vulnerabilities' };
  }

  /**
   * Get display name for test
   */
  getTestDisplayName(testName) {
    const names = {
      'content-security-policy': 'Content Security Policy',
      'strict-transport-security': 'HTTP Strict Transport Security (HSTS)',
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'referrer-policy': 'Referrer Policy',
      'cookies': 'Cookie Security',
      'subresource-integrity': 'Subresource Integrity',
      'cross-origin-resource-sharing': 'Cross-Origin Resource Sharing (CORS)',
      'public-key-pinning': 'HTTP Public Key Pinning'
    };
    
    return names[testName] || testName;
  }

  /**
   * Get overall security grade interpretation
   */
  getGradeInterpretation(grade) {
    const interpretations = {
      'A+': 'Exceptional - Best-in-class security',
      'A': 'Excellent - Strong security posture',
      'B': 'Good - Security is adequate with minor issues',
      'C': 'Fair - Multiple security improvements needed',
      'D': 'Poor - Significant security vulnerabilities',
      'F': 'Fail - Critical security issues must be addressed'
    };
    
    return interpretations[grade] || 'Unknown';
  }
}

export default MozillaObservatoryService;

