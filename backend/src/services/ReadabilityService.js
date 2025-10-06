/**
 * Readability Service - Content Analysis
 * Provides 6 professional readability metrics using text-readability package
 * 100% FREE, no API key required
 */

import rs from 'text-readability';

export class ReadabilityService {
  /**
   * Analyze text and return comprehensive readability metrics
   * @param {string} text - The text content to analyze
   * @returns {Object} Readability analysis results
   */
  analyzeText(text) {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided for analysis'
      };
    }

    // Clean text (remove HTML, extra spaces)
    const cleanText = this.cleanText(text);
    
    if (cleanText.split(/\s+/).length < 10) {
      return {
        success: false,
        error: 'Text is too short for meaningful analysis (minimum 10 words)'
      };
    }

    const fleschScore = rs.fleschReadingEase(cleanText);
    
    return {
      success: true,
      scores: {
        fleschReadingEase: {
          score: Math.round(fleschScore * 10) / 10,
          interpretation: this.interpretFlesch(fleschScore),
          description: 'Higher is easier to read (0-100)',
          grade: this.getFleschGrade(fleschScore)
        },
        fleschKincaidGrade: {
          score: Math.round(rs.fleschKincaidGrade(cleanText) * 10) / 10,
          interpretation: `US Grade ${Math.round(rs.fleschKincaidGrade(cleanText))}`,
          description: 'US school grade level required to understand',
          grade: this.getGradeLevel(rs.fleschKincaidGrade(cleanText))
        },
        gunningFog: {
          score: Math.round(rs.gunningFog(cleanText) * 10) / 10,
          interpretation: `Grade ${Math.round(rs.gunningFog(cleanText))} level`,
          description: 'Years of formal education needed',
          grade: this.getGradeLevel(rs.gunningFog(cleanText))
        },
        smog: {
          score: Math.round(rs.smogIndex(cleanText) * 10) / 10,
          interpretation: `Grade ${Math.round(rs.smogIndex(cleanText))} level`,
          description: 'Simple Measure of Gobbledygook',
          grade: this.getGradeLevel(rs.smogIndex(cleanText))
        },
        automatedReadability: {
          score: Math.round(rs.automatedReadabilityIndex(cleanText) * 10) / 10,
          interpretation: `Grade ${Math.round(rs.automatedReadabilityIndex(cleanText))}`,
          description: 'Based on characters per word and words per sentence',
          grade: this.getGradeLevel(rs.automatedReadabilityIndex(cleanText))
        },
        colemanLiau: {
          score: Math.round(rs.colemanLiauIndex(cleanText) * 10) / 10,
          interpretation: `Grade ${Math.round(rs.colemanLiauIndex(cleanText))}`,
          description: 'Coleman-Liau Index',
          grade: this.getGradeLevel(rs.colemanLiauIndex(cleanText))
        }
      },
      statistics: this.getTextStatistics(cleanText),
      recommendation: this.getRecommendation(fleschScore),
      overallGrade: this.calculateOverallGrade(cleanText)
    };
  }

  /**
   * Clean text by removing HTML tags and normalizing whitespace
   */
  cleanText(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Interpret Flesch Reading Ease score
   */
  interpretFlesch(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College level)';
    return 'Very Difficult (College graduate+)';
  }

  /**
   * Get grade level interpretation
   */
  getGradeLevel(score) {
    const grade = Math.round(score);
    if (grade <= 5) return 'Elementary';
    if (grade <= 8) return 'Middle School';
    if (grade <= 12) return 'High School';
    if (grade <= 16) return 'College';
    return 'Graduate Level';
  }

  /**
   * Get Flesch grade (A-F)
   */
  getFleschGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Calculate text statistics
   */
  getTextStatistics(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    const characters = text.replace(/\s/g, '').length;
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      syllableCount: syllables,
      characterCount: characters,
      averageWordsPerSentence: sentences.length > 0 ? (words.length / sentences.length).toFixed(1) : 0,
      averageSyllablesPerWord: words.length > 0 ? (syllables / words.length).toFixed(1) : 0,
      averageCharactersPerWord: words.length > 0 ? (characters / words.length).toFixed(1) : 0
    };
  }

  /**
   * Count syllables in a word (simple algorithm)
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove silent 'e' at the end
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    // Count vowel groups
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Get actionable recommendations
   */
  getRecommendation(fleschScore) {
    if (fleschScore < 50) {
      return {
        level: 'warning',
        message: 'Text is difficult to read. Consider simplifying for broader audience.',
        tips: [
          'Break long sentences into shorter ones (aim for 15-20 words per sentence)',
          'Replace complex words with simpler alternatives',
          'Use active voice instead of passive voice',
          'Add more transition words for better flow',
          'Target: 60-70 Flesch score for general audience'
        ],
        priority: 'high'
      };
    } else if (fleschScore < 70) {
      return {
        level: 'good',
        message: 'Text readability is acceptable for most audiences.',
        tips: [
          'Consider simplifying some complex sentences',
          'Add more examples and explanations where needed',
          'Target: 70-80 for even easier reading'
        ],
        priority: 'medium'
      };
    } else {
      return {
        level: 'excellent',
        message: 'Text is easy to read and accessible to most audiences!',
        tips: [
          'Maintain this level of clarity',
          'Ensure content depth matches readability',
          'Great job making content accessible!'
        ],
        priority: 'low'
      };
    }
  }

  /**
   * Calculate overall grade (A-F)
   */
  calculateOverallGrade(text) {
    const flesch = fleschReadingEase(text);
    const fk = fleschKincaidGrade(text);
    const fog = gunningFog(text);
    
    // Average the normalized scores
    const avgGrade = (fk + fog + smogIndex(text)) / 3;
    
    // Convert to letter grade
    if (flesch >= 70 && avgGrade <= 9) return 'A';
    if (flesch >= 60 && avgGrade <= 12) return 'B';
    if (flesch >= 50 && avgGrade <= 14) return 'C';
    if (flesch >= 30 && avgGrade <= 16) return 'D';
    return 'F';
  }
}

export default ReadabilityService;

