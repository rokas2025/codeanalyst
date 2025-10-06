/**
 * SSL Labs Service - SSL/TLS Analysis
 * 100% FREE but RATE LIMITED: Max 1 scan per hostname every 2 hours!
 * 
 * IMPORTANT: This service includes client-side and server-side rate limiting
 * to prevent getting banned by SSL Labs API
 */

import axios from 'axios';
import logger from '../utils/logger.js';

// In-memory cache to track recent scans (prevents abuse)
const scanCache = new Map();
const COOLDOWN_PERIOD = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export class SSLLabsService {
  constructor() {
    this.baseUrl = 'https://api.ssllabs.com/api/v3';
  }

  /**
   * Check if hostname can be scanned (rate limiting check)
   */
  canScan(hostname) {
    const lastScan = scanCache.get(hostname);
    
    if (!lastScan) {
      return { allowed: true };
    }

    const timeSinceLastScan = Date.now() - lastScan.timestamp;
    const remainingTime = COOLDOWN_PERIOD - timeSinceLastScan;

    if (remainingTime > 0) {
      const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
      return {
        allowed: false,
        remainingMinutes: remainingMinutes,
        nextScanTime: new Date(lastScan.timestamp + COOLDOWN_PERIOD).toISOString(),
        cachedResult: lastScan.result
      };
    }

    return { allowed: true };
  }

  /**
   * Analyze SSL/TLS configuration
   * @param {string} hostname - Hostname to analyze (without https://)
   * @param {boolean} fromCache - Use cached results if available (recommended)
   * @returns {Object} SSL analysis results
   */
  async analyzeSSL(hostname, fromCache = true) {
    try {
      // Remove protocol if present
      hostname = hostname.replace(/^https?:\/\//, '').split('/')[0];

      // Check rate limiting
      const rateCheck = this.canScan(hostname);
      if (!rateCheck.allowed) {
        logger.warn(`SSL Labs rate limit: ${hostname} was scanned recently`);
        
        // Return cached result if available
        if (rateCheck.cachedResult) {
          return {
            success: true,
            ...rateCheck.cachedResult,
            fromCache: true,
            rateLimited: true,
            message: `Results from cache. Next scan available in ${rateCheck.remainingMinutes} minutes.`
          };
        }

        return {
          success: false,
          error: `Rate limit: This hostname was scanned recently. Please wait ${rateCheck.remainingMinutes} minutes.`,
          code: 'RATE_LIMITED',
          remainingMinutes: rateCheck.remainingMinutes,
          nextScanTime: rateCheck.nextScanTime
        };
      }

      logger.info(`Starting SSL Labs analysis for ${hostname}`);

      // Step 1: Check if there's a cached report (if fromCache is true)
      if (fromCache) {
        const cachedReport = await this.checkCachedReport(hostname);
        if (cachedReport) {
          logger.info(`Using cached SSL Labs report for ${hostname}`);
          
          // Update our cache
          scanCache.set(hostname, {
            timestamp: Date.now(),
            result: cachedReport
          });

          return {
            success: true,
            ...cachedReport,
            fromCache: true,
            timestamp: new Date().toISOString()
          };
        }
      }

      // Step 2: Start new analysis (only if no cache or fromCache = false)
      const startResponse = await axios.get(`${this.baseUrl}/analyze`, {
        params: {
          host: hostname,
          startNew: fromCache ? 'off' : 'on', // Don't start new if using cache
          fromCache: fromCache ? 'on' : 'off',
          all: 'done'
        },
        timeout: 30000
      });

      if (startResponse.data.status === 'ERROR') {
        throw new Error(startResponse.data.statusMessage || 'SSL Labs API error');
      }

      // Step 3: Poll for results (if analysis is in progress)
      const results = await this.pollResults(hostname);
      
      // Step 4: Process results
      const processedResults = this.processResults(results);

      // Cache the results
      scanCache.set(hostname, {
        timestamp: Date.now(),
        result: processedResults
      });

      return {
        success: true,
        ...processedResults,
        fromCache: false,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('SSL Labs analysis error:', error.message);
      
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'SSL Labs API rate limit exceeded. Please try again later.',
          code: 'API_RATE_LIMIT'
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
   * Check for cached report
   */
  async checkCachedReport(hostname) {
    try {
      const response = await axios.get(`${this.baseUrl}/analyze`, {
        params: {
          host: hostname,
          fromCache: 'on',
          all: 'done'
        },
        timeout: 30000
      });

      if (response.data.status === 'READY' && response.data.endpoints) {
        return this.processResults(response.data);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Poll for analysis results
   */
  async pollResults(hostname, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const response = await axios.get(`${this.baseUrl}/analyze`, {
          params: {
            host: hostname,
            all: 'done'
          },
          timeout: 30000
        });

        const status = response.data.status;
        logger.info(`SSL Labs scan status: ${status} (attempt ${i + 1}/${maxAttempts})`);

        if (status === 'READY') {
          return response.data;
        } else if (status === 'ERROR') {
          throw new Error(response.data.statusMessage || 'Analysis failed');
        }
        
        // Status is IN_PROGRESS or DNS, continue polling
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('SSL analysis timeout - took too long to complete (5+ minutes)');
  }

  /**
   * Process SSL Labs results
   */
  processResults(data) {
    if (!data.endpoints || data.endpoints.length === 0) {
      throw new Error('No SSL/TLS endpoints found');
    }

    const endpoint = data.endpoints[0]; // Use first endpoint
    const details = endpoint.details;

    return {
      host: data.host,
      grade: endpoint.grade,
      gradeTrustIgnored: endpoint.gradeTrustIgnored,
      hasWarnings: endpoint.hasWarnings || false,
      isExceptional: endpoint.grade === 'A+',
      ipAddress: endpoint.ipAddress,
      certificate: {
        subject: details?.cert?.subject || 'Unknown',
        commonNames: details?.cert?.commonNames || [],
        altNames: details?.cert?.altNames || [],
        notBefore: details?.cert?.notBefore ? new Date(details.cert.notBefore).toISOString() : null,
        notAfter: details?.cert?.notAfter ? new Date(details.cert.notAfter).toISOString() : null,
        issuerLabel: details?.cert?.issuerLabel || 'Unknown',
        sigAlg: details?.cert?.sigAlg || 'Unknown',
        keyAlg: details?.cert?.keyAlg || 'Unknown',
        keySize: details?.cert?.keySize || 0,
        validDays: details?.cert?.notAfter ? Math.floor((details.cert.notAfter - Date.now()) / (24 * 60 * 60 * 1000)) : 0
      },
      protocols: details?.protocols?.map(p => ({
        name: p.name,
        version: p.version,
        isSecure: p.version >= '1.2'
      })) || [],
      vulnerabilities: this.checkVulnerabilities(endpoint, details),
      recommendations: this.getRecommendations(endpoint, details),
      riskLevel: this.getRiskLevel(endpoint.grade)
    };
  }

  /**
   * Check for known vulnerabilities
   */
  checkVulnerabilities(endpoint, details) {
    const vulns = [];

    if (details?.heartbleed) {
      vulns.push({ 
        name: 'Heartbleed', 
        severity: 'critical',
        description: 'OpenSSL Heartbleed vulnerability (CVE-2014-0160)'
      });
    }

    if (details?.poodle) {
      vulns.push({ 
        name: 'POODLE', 
        severity: 'high',
        description: 'POODLE attack vulnerability (SSLv3)'
      });
    }

    if (details?.freak) {
      vulns.push({ 
        name: 'FREAK', 
        severity: 'high',
        description: 'FREAK attack vulnerability'
      });
    }

    if (details?.logjam) {
      vulns.push({ 
        name: 'Logjam', 
        severity: 'medium',
        description: 'Logjam attack vulnerability'
      });
    }

    if (details?.drownVulnerable) {
      vulns.push({ 
        name: 'DROWN', 
        severity: 'high',
        description: 'DROWN attack vulnerability'
      });
    }

    // Check for weak protocols
    if (details?.protocols?.some(p => p.version < '1.2')) {
      vulns.push({
        name: 'Weak TLS Protocol',
        severity: 'medium',
        description: 'TLS 1.0/1.1 is deprecated. Use TLS 1.2 or higher.'
      });
    }

    return vulns;
  }

  /**
   * Get recommendations
   */
  getRecommendations(endpoint, details) {
    const recommendations = [];

    if (endpoint.grade !== 'A+' && endpoint.grade !== 'A') {
      recommendations.push({
        priority: 'high',
        message: 'SSL/TLS configuration needs improvement to achieve A+ grade',
        action: 'Review cipher suites and enable HSTS'
      });
    }

    if (details?.cert?.validDays < 30) {
      recommendations.push({
        priority: 'critical',
        message: `Certificate expires in ${details.cert.validDays} days`,
        action: 'Renew SSL certificate immediately'
      });
    }

    if (details?.protocols?.some(p => p.version < '1.2')) {
      recommendations.push({
        priority: 'high',
        message: 'Disable TLS 1.0 and 1.1',
        action: 'Use TLS 1.2 and 1.3 only'
      });
    }

    if (!details?.hstsPolicy || details.hstsPolicy.status !== 'present') {
      recommendations.push({
        priority: 'medium',
        message: 'HSTS not enabled',
        action: 'Enable HTTP Strict Transport Security (HSTS)'
      });
    }

    return recommendations;
  }

  /**
   * Get risk level
   */
  getRiskLevel(grade) {
    if (grade === 'A+' || grade === 'A') {
      return { level: 'low', color: 'green', message: 'Excellent SSL/TLS configuration' };
    }
    if (grade === 'B') {
      return { level: 'medium', color: 'yellow', message: 'Good SSL/TLS, minor improvements possible' };
    }
    if (grade === 'C') {
      return { level: 'high', color: 'orange', message: 'Moderate SSL/TLS risks' };
    }
    return { level: 'critical', color: 'red', message: 'Significant SSL/TLS vulnerabilities' };
  }

  /**
   * Get cached scan info (for rate limiting display)
   */
  getCachedScanInfo(hostname) {
    hostname = hostname.replace(/^https?:\/\//, '').split('/')[0];
    const rateCheck = this.canScan(hostname);
    
    return {
      hostname: hostname,
      canScanNow: rateCheck.allowed,
      remainingMinutes: rateCheck.remainingMinutes || 0,
      nextScanTime: rateCheck.nextScanTime || null,
      hasCachedResult: !!rateCheck.cachedResult
    };
  }
}

export default SSLLabsService;

