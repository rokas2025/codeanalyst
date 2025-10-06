import React from 'react'
import { 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface SecurityHeadersReportProps {
  data: {
    success: boolean
    grade: string
    score: number
    headers: {
      contentSecurityPolicy: { present: boolean; status: string; description: string }
      strictTransportSecurity: { present: boolean; status: string; description: string }
      xFrameOptions: { present: boolean; status: string; description: string }
      xContentTypeOptions: { present: boolean; status: string; description: string }
      referrerPolicy: { present: boolean; status: string; description: string }
      cookies: { secure: boolean; status: string; description: string }
    }
    riskLevel: {
      level: string
      color: string
      message: string
    }
    recommendations: Array<{
      severity: string
      header: string
      issue: string
      fix: string
      example: string
    }>
  }
}

export function SecurityHeadersReport({ data }: SecurityHeadersReportProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Failed to load security analysis</p>
      </div>
    )
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Grade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mozilla Observatory Security Scan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Security headers and best practices analysis
            </p>
          </div>
        </div>
        <div className={`px-6 py-3 rounded-lg font-bold text-2xl ${getGradeColor(data.grade)}`}>
          {data.grade}
        </div>
      </div>

      {/* Score and Risk Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Security Score</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{data.score}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">out of 100</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(data.riskLevel.level)}`}>
            {data.riskLevel.level.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{data.riskLevel.message}</div>
        </div>
      </div>

      {/* Security Headers Checklist */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Security Headers Status
        </h4>
        <div className="space-y-3">
          {Object.entries(data.headers).map(([key, header]) => (
            <div key={key} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 mt-0.5">
                {header.present || header.secure ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    header.present || header.secure 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {header.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {header.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Security Recommendations
          </h4>
          <div className="space-y-4">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {rec.header}
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Issue:</strong> {rec.issue}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Fix:</strong> {rec.fix}
                    </p>
                    <div className="bg-gray-900 dark:bg-gray-950 rounded p-2 mt-2">
                      <code className="text-xs text-green-400 font-mono">{rec.example}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Powered by Mozilla Observatory:</strong> A free security analysis tool that checks HTTP response headers and best practices. 
          Regular security audits help protect your website and users from common vulnerabilities.
        </p>
      </div>
    </div>
  )
}

export default SecurityHeadersReport

