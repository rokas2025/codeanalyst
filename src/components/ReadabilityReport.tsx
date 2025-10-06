import React from 'react'
import { BookOpenIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ReadabilityReportProps {
  data: {
    success: boolean
    scores: {
      fleschReadingEase: { score: number; interpretation: string; grade: string }
      fleschKincaidGrade: { score: number; interpretation: string; grade: string }
      gunningFog: { score: number; interpretation: string; grade: string }
      smog: { score: number; interpretation: string; grade: string }
      automatedReadability: { score: number; interpretation: string; grade: string }
      colemanLiau: { score: number; interpretation: string; grade: string }
    }
    statistics: {
      wordCount: number
      sentenceCount: number
      paragraphCount: number
      averageWordsPerSentence: string
      averageSyllablesPerWord: string
    }
    recommendation: {
      level: string
      message: string
      tips: string[]
    }
    overallGrade: string
  }
}

export function ReadabilityReport({ data }: ReadabilityReportProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Failed to load readability analysis</p>
      </div>
    )
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (grade === 'B') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade === 'D') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const getLevelIcon = (level: string) => {
    if (level === 'excellent') return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    if (level === 'good') return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
    return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Readability Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Professional readability metrics for your content
            </p>
          </div>
        </div>
        <div className={`px-6 py-3 rounded-lg font-bold text-2xl ${getGradeColor(data.overallGrade)}`}>
          {data.overallGrade}
        </div>
      </div>

      {/* Readability Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data.scores).map(([key, score]) => (
          <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
              <span className={`px-2 py-1 text-xs font-bold rounded ${getGradeColor(score.grade)}`}>
                {score.grade}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {score.score}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {score.interpretation}
            </div>
          </div>
        ))}
      </div>

      {/* Text Statistics */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Text Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.statistics.wordCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Words</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.statistics.sentenceCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sentences</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.statistics.paragraphCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Paragraphs</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {data.statistics.averageWordsPerSentence}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Words/Sentence</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.statistics.averageSyllablesPerWord}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Syllables/Word</div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`rounded-lg p-6 border ${
        data.recommendation.level === 'excellent' 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : data.recommendation.level === 'good'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-start space-x-3">
          {getLevelIcon(data.recommendation.level)}
          <div className="flex-1">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
              {data.recommendation.message}
            </h4>
            <ul className="space-y-1">
              {data.recommendation.tips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <p className="text-sm text-purple-800 dark:text-purple-300">
          <strong>FREE Analysis:</strong> These readability scores are calculated using industry-standard formulas. 
          Higher Flesch Reading Ease scores (60-70+) indicate easier-to-read content suitable for general audiences.
        </p>
      </div>
    </div>
  )
}

export default ReadabilityReport

