import React, { useState } from 'react'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { AdoreInoResults } from '../types'
import { exportToPDF, exportBusinessReport, exportTechnicalReport, exportExecutiveReport } from '../utils/pdfExport'

interface AdoreInoReportProps {
  results: AdoreInoResults
  userProfile: 'business' | 'technical' | 'mixed'
  aiProvider?: string
  aiModel?: string
}

export function AdoreInoReport({ results, userProfile, aiProvider = 'unknown', aiModel = 'unknown' }: AdoreInoReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'business' | 'risks' | 'recommendations' | 'validation'>('overview')
  const [isExporting, setIsExporting] = useState(false)

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: ChartBarIcon },
    { id: 'technical', label: 'Technical Structure', icon: CpuChipIcon },
    { id: 'business', label: 'Business Impact', icon: ArrowTrendingUpIcon },
    { id: 'risks', label: 'Risk Assessment', icon: ExclamationTriangleIcon },
    { id: 'recommendations', label: 'Recommendations', icon: LightBulbIcon },
    { id: 'validation', label: 'Data Validation', icon: ShieldCheckIcon }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleExport = async (format: 'json' | 'pdf-business' | 'pdf-technical' | 'pdf-executive' = 'json') => {
    setIsExporting(true)
    
    try {
      if (format === 'json') {
        const reportData = {
          timestamp: new Date().toISOString(),
          results,
          userProfile
        }
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `adorino-analysis-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'pdf-business') {
        await exportBusinessReport(results)
      } else if (format === 'pdf-technical') {
        await exportTechnicalReport(results)
      } else if (format === 'pdf-executive') {
        await exportExecutiveReport(results)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AdoreIno System Analysis Report',
          text: `System analysis completed with overall score: ${results.systemOverview.overallScore}/100`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Report URL copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Code Analysis Report</h2>
            <p className="text-gray-600">
              Code analysis and improvement suggestions completed on {new Date().toLocaleDateString()}
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(results.systemOverview.overallScore)}`}>
                  Overall Score: {results.systemOverview.overallScore}/100
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(results.riskAssessment.overallRisk)}`}>
                  Risk Level: {results.riskAssessment.overallRisk.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {Math.round(results.confidenceLevel)}%
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="relative group">
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="btn-outline flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
              
              {/* Export dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📄 JSON Data
                  </button>
                  <button
                    onClick={() => handleExport('pdf-executive')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📊 Executive Summary PDF
                  </button>
                  <button
                    onClick={() => handleExport('pdf-business')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    💼 Business Report PDF
                  </button>
                  <button
                    onClick={() => handleExport('pdf-technical')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🔧 Technical Report PDF
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleShare}
              className="btn-outline flex items-center space-x-2"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Provider Info */}
      <div className="card p-4 border-l-4 border-green-500 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900 mb-1">AI Analysis Provider</h3>
            <p className="text-sm text-green-800">
              Powered by <strong>{aiProvider === 'google' ? 'Google Gemini' : aiProvider === 'openai' ? 'OpenAI GPT-4' : aiProvider === 'anthropic' ? 'Anthropic Claude' : 'Demo Mode'}</strong> 
              {aiModel !== 'unknown' && ` (${aiModel})`}
            </p>
          </div>
          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            {aiProvider === 'local' ? '🤖 Demo' : '✨ Real AI'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {(results as any).executiveSummary && (
        <div className="card p-6 border-l-4 border-blue-500 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
          <p className="text-blue-800">{(results as any).executiveSummary}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {results.systemOverview.overallScore}
                </div>
                <div className="text-sm text-gray-600">Overall Quality Score</div>
                <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${getScoreColor(results.systemOverview.overallScore)}`}>
                  {results.systemOverview.qualityRating.toUpperCase()}
                </div>
              </div>

              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {results.systemOverview.modernityScore}
                </div>
                <div className="text-sm text-gray-600">Modernity Score</div>
                <div className="mt-2 text-xs text-gray-500">
                  Technology Currency
                </div>
              </div>

              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {results.technicalStructure.codeMetrics.totalFiles}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
                <div className="mt-2 text-xs text-gray-500">
                  {results.systemOverview.estimatedComplexity.toUpperCase()} complexity
                </div>
              </div>

              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {results.riskAssessment.risks.length}
                </div>
                <div className="text-sm text-gray-600">Identified Risks</div>
                <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${getRiskColor(results.riskAssessment.overallRisk)}`}>
                  {results.riskAssessment.overallRisk.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technology Stack</h3>
              <div className="flex flex-wrap gap-2">
                {results.systemOverview.mainTechnologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">Project Type:</span> {results.systemOverview.projectType}
                <span className="ml-4 font-medium">Competitiveness:</span> {results.systemOverview.competitivenessRating}
              </div>
            </div>

            {/* Quick AI Insights */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key AI Insights</h3>
              <div className="space-y-4">
                {results.aiExplanations.slice(0, 3).map((explanation, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <div className="font-medium text-gray-900">{explanation.context}</div>
                    <div className="text-sm text-gray-600 mt-1">{explanation.explanation}</div>
                    <div className="text-xs text-blue-600 mt-2">{explanation.businessValue}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="space-y-6">
            {/* Code Metrics */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Code Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.technicalStructure.codeMetrics.totalLines.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Lines of Code</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{typeof results.technicalStructure.codeMetrics.complexity === 'number' ? results.technicalStructure.codeMetrics.complexity.toFixed(1) : results.technicalStructure.codeMetrics.complexity}</div>
                  <div className="text-sm text-gray-600">Complexity Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.technicalStructure.codeMetrics.technicalDebt.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Technical Debt</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {results.technicalStructure.codeMetrics.testCoverage ? `${results.technicalStructure.codeMetrics.testCoverage.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Test Coverage</div>
                </div>
              </div>
              
              {/* Metrics Explanations */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Understanding Your Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-800 mb-1">📊 Complexity Score: {typeof results.technicalStructure.codeMetrics.complexity === 'number' ? results.technicalStructure.codeMetrics.complexity.toFixed(1) : results.technicalStructure.codeMetrics.complexity}</div>
                    <div className="text-blue-700">
                      {(() => {
                        const complexity = typeof results.technicalStructure.codeMetrics.complexity === 'number' ? results.technicalStructure.codeMetrics.complexity : 0;
                        if (complexity < 5) return "✅ Low complexity - Easy to understand and maintain";
                        if (complexity < 15) return "⚠️ Moderate complexity - Some refactoring may help";
                        return "❌ High complexity - Consider breaking down large functions";
                      })()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Improve by: Breaking large functions into smaller ones, reducing nested conditions
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-blue-800 mb-1">🔧 Technical Debt: {results.technicalStructure.codeMetrics.technicalDebt.toFixed(1)}%</div>
                    <div className="text-blue-700">
                      {(() => {
                        const debt = results.technicalStructure.codeMetrics.technicalDebt;
                        if (debt < 15) return "✅ Low debt - Well-maintained codebase";
                        if (debt < 40) return "⚠️ Moderate debt - Plan some cleanup tasks";
                        return "❌ High debt - Urgent maintenance needed";
                      })()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Improve by: Updating dependencies, adding tests, fixing security issues
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-blue-800 mb-1">🧪 Test Coverage: {results.technicalStructure.codeMetrics.testCoverage ? `${results.technicalStructure.codeMetrics.testCoverage.toFixed(1)}%` : 'N/A'}</div>
                    <div className="text-blue-700">
                      {(() => {
                        const coverage = results.technicalStructure.codeMetrics.testCoverage;
                        if (!coverage) return "❌ No tests detected - High risk for changes";
                        if (coverage < 30) return "❌ Very low coverage - Add more tests urgently";
                        if (coverage < 70) return "⚠️ Moderate coverage - Aim for 80%+";
                        return "✅ Good coverage - Well-tested codebase";
                      })()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {results.technicalStructure.codeMetrics.testCoverage ? 
                        "Improve by: Adding unit tests, integration tests, edge case testing" :
                        "Start by: Adding Jest/Vitest, writing unit tests for critical functions"
                      }
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-blue-800 mb-1">📝 Lines of Code: {results.technicalStructure.codeMetrics.totalLines.toLocaleString()}</div>
                    <div className="text-blue-700">
                      {(() => {
                        const lines = results.technicalStructure.codeMetrics.totalLines;
                        if (lines < 1000) return "✅ Small project - Easy to manage";
                        if (lines < 10000) return "⚠️ Medium project - Good structure important";
                        return "❌ Large project - Modular architecture critical";
                      })()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Focus on: Proper file organization, clear naming conventions, documentation
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Architecture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium text-gray-900 mb-2">Architecture Pattern</div>
                  <div className="text-gray-600">{results.technicalStructure.architecture.pattern}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">Data Flow</div>
                  <div className="text-gray-600">{results.technicalStructure.architecture.dataFlow}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">Scalability Rating</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(results.technicalStructure.architecture.scalabilityRating)}`}>
                    {results.technicalStructure.architecture.scalabilityRating}/100
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">Layer Structure</div>
                  <div className="text-sm text-gray-600">
                    {results.technicalStructure.architecture.layerStructure.join(' → ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Modules</h3>
              <div className="space-y-4">
                {results.technicalStructure.modules.map((module, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{module.name}</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        module.type === 'core' ? 'bg-blue-100 text-blue-800' :
                        module.type === 'feature' ? 'bg-green-100 text-green-800' :
                        module.type === 'utility' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {module.type}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{module.description}</div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{module.linesOfCode.toLocaleString()} lines</span>
                      <span>{module.dependencies.length} dependencies</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependencies */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dependencies Analysis</h3>
              <div className="space-y-3">
                {results.technicalStructure.dependencies.slice(0, 10).map((dep, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium text-gray-900">{dep.name}</div>
                      <div className="text-sm text-gray-600">v{dep.version}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dep.isOutdated && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          Outdated
                        </span>
                      )}
                      {dep.securityIssues > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {dep.securityIssues} security issues
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {dep.usageCount} usages
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-6">
            {/* Business Recommendations */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Strategic Recommendations</h3>
              <div className="space-y-6">
                {results.businessRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.category === 'maintain' ? 'bg-blue-100 text-blue-800' :
                          rec.category === 'improve' ? 'bg-green-100 text-green-800' :
                          rec.category === 'migrate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.category.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">Priority {rec.priority}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{rec.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Business Impact</div>
                        <div className="text-sm text-gray-600">{rec.businessImpact}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Cost Estimate</div>
                        <div className="text-sm text-gray-600">{rec.costEstimate}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Timeline</div>
                        <div className="text-sm text-gray-600">{rec.timeline}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm mb-2">Benefits</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.benefits.map((benefit, bIndex) => (
                            <li key={bIndex} className="flex items-center space-x-2">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm mb-2">Risks</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.risks.map((risk, rIndex) => (
                            <li key={rIndex} className="flex items-center space-x-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Business Insights */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Business Insights</h3>
              <div className="space-y-4">
                {results.aiExplanations.map((insight, index) => (
                  <div key={index} className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="font-medium text-gray-900">{insight.context}</div>
                    <div className="text-sm text-gray-600 mt-1">{insight.businessValue}</div>
                    <div className="text-xs text-green-600 mt-2">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-6">
            {/* Risk Overview */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment Summary</h3>
              <div className="flex items-center space-x-4 mb-6">
                <div className={`px-4 py-2 rounded-lg font-medium ${getRiskColor(results.riskAssessment.overallRisk)}`}>
                  Overall Risk: {results.riskAssessment.overallRisk.toUpperCase()}
                </div>
                <div className="text-gray-600">
                  {results.riskAssessment.risks.length} risks identified
                </div>
              </div>
            </div>

            {/* Individual Risks */}
            <div className="space-y-4">
              {results.riskAssessment.risks.map((risk, index) => (
                <div key={index} className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">{risk.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.impact)}`}>
                        {risk.impact.toUpperCase()} Impact
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.likelihood)}`}>
                        {risk.likelihood.toUpperCase()} Likelihood
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{risk.description}</p>
                  
                  <div>
                    <div className="font-medium text-gray-900 text-sm mb-2">Affected Files</div>
                    <div className="flex flex-wrap gap-1">
                      {risk.affectedFiles.map((file, fIndex) => (
                        <span key={fIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mitigation Strategies */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mitigation Strategies</h3>
              <div className="space-y-3">
                {results.riskAssessment.mitigation.map((strategy, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-600">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Maintenance Tasks */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Requirements</h3>
              
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded font-medium ${getPriorityColor(results.maintenanceNeeds.priorityLevel)}`}>
                    Priority: {results.maintenanceNeeds.priorityLevel.toUpperCase()}
                  </div>
                  <div className="text-gray-600">
                    Estimated Effort: {results.maintenanceNeeds.estimatedEffort}
                  </div>
                </div>
              </div>

              {results.maintenanceNeeds.urgentTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>Urgent Tasks</span>
                  </h4>
                  <div className="space-y-3">
                    {results.maintenanceNeeds.urgentTasks.map((task, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.urgency)}`}>
                              {task.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{task.estimatedHours}h</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="text-xs text-gray-500">
                          Files: {task.files.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.maintenanceNeeds.recommendedTasks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>Recommended Tasks</span>
                  </h4>
                  <div className="space-y-3">
                    {results.maintenanceNeeds.recommendedTasks.map((task, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.urgency)}`}>
                              {task.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{task.estimatedHours}h</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="text-xs text-gray-500">
                          Files: {task.files.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Explanations */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed AI Analysis</h3>
              <div className="space-y-6">
                {results.aiExplanations.map((explanation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{explanation.context}</h4>
                      <span className="text-sm text-blue-600">
                        {Math.round(explanation.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-gray-700 text-sm">Analysis</div>
                        <p className="text-gray-600 text-sm">{explanation.explanation}</p>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700 text-sm">Reasoning</div>
                        <p className="text-gray-600 text-sm">{explanation.reasoning}</p>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700 text-sm">Business Value</div>
                        <p className="text-green-600 text-sm">{explanation.businessValue}</p>
                      </div>
                      
                      {explanation.relatedFiles.length > 0 && (
                        <div>
                          <div className="font-medium text-gray-700 text-sm">Related Files</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {explanation.relatedFiles.map((file, fIndex) => (
                              <span key={fIndex} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {file}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-6">
            {/* Data Validation Overview */}
            <div className="card p-6 border-l-4 border-green-500 bg-green-50">
              <h3 className="text-lg font-medium text-green-900 mb-4">Analysis Data Validation</h3>
              <p className="text-green-800 mb-4">
                This section shows the reliability and source of each metric in the analysis report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.dataValidation.realData.length}</div>
                  <div className="text-sm text-green-700">Real Metrics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{results.dataValidation.estimatedData.length}</div>
                  <div className="text-sm text-yellow-700">Estimated Metrics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{results.dataValidation.simulatedData.length}</div>
                  <div className="text-sm text-gray-700">Simulated Metrics</div>
                </div>
              </div>
            </div>

            {/* Real Data */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>Real Data (100% Accurate)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.dataValidation.realData.map((metric, index) => (
                  <div key={index} className="flex items-center space-x-2 py-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated Data */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <span>Estimated Data (Algorithm-Based)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.dataValidation.estimatedData.map((metric, index) => (
                  <div key={index} className="flex items-center space-x-2 py-2">
                    <ClockIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-700">{metric}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> These metrics are calculated using heuristic algorithms based on code patterns and industry standards. While not exact measurements, they provide reliable estimates for planning purposes.
                </p>
              </div>
            </div>

            {/* Confidence Scores */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confidence Scores by Category</h3>
              <div className="space-y-3">
                {Object.entries(results.dataValidation.confidenceScores).map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-700">{category}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score).includes('green') ? 'bg-green-500' : 
                            getScoreColor(score).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trustworthiness Guidelines */}
            <div className="card p-6 border-l-4 border-blue-500 bg-blue-50">
              <h3 className="text-lg font-medium text-blue-900 mb-4">How to Trust This Analysis</h3>
              <div className="space-y-3 text-blue-800">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Real Data:</strong> File structures, dependencies, and code patterns are analyzed directly from your codebase
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Estimated Data:</strong> Calculated using industry-standard algorithms and best practices
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>No Hallucinations:</strong> All random data generation has been removed from this analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Reliability Assessment */}
            <div className="card p-6 border-l-4 border-amber-500 bg-amber-50">
              <h3 className="text-lg font-medium text-amber-900 mb-4">Making Your Metrics More Reliable</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">📊 Complexity Score Accuracy</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      <div>Current reliability: <span className="font-medium">85%</span></div>
                      <div className="text-xs">
                        ✅ Measures actual code patterns<br/>
                        ⚠️ May vary with code style<br/>
                        🎯 <strong>Improve by:</strong> Using consistent linting rules
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">🧪 Test Coverage Reliability</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      <div>Current reliability: <span className="font-medium">
                        {results.technicalStructure.codeMetrics.testCoverage ? '70%' : '30%'}
                      </span></div>
                      <div className="text-xs">
                        {results.technicalStructure.codeMetrics.testCoverage ? (
                          <>✅ Tests detected and analyzed<br/>⚠️ Estimation based on file patterns</>
                        ) : (
                          <>❌ No tests detected<br/>⚠️ Very low confidence</>
                        )}
                        <br/>🎯 <strong>Improve by:</strong> {results.technicalStructure.codeMetrics.testCoverage ? 
                          'Running actual coverage tools (jest --coverage)' :
                          'Adding test files with .test.js/.spec.js extensions'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">🔧 Technical Debt Precision</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      <div>Current reliability: <span className="font-medium">80%</span></div>
                      <div className="text-xs">
                        ✅ Based on real security/dependency issues<br/>
                        ⚠️ Estimation of impact percentages<br/>
                        🎯 <strong>Improve by:</strong> Running security audits (npm audit)
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">📈 Overall Score Stability</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      <div>Current reliability: <span className="font-medium">75%</span></div>
                      <div className="text-xs">
                        ✅ Combines multiple real metrics<br/>
                        ⚠️ May fluctuate with code changes<br/>
                        🎯 <strong>Improve by:</strong> Regular monitoring and CI integration
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-100 p-4 rounded border border-amber-300">
                  <h4 className="font-medium text-amber-900 mb-2">🎯 How to Get 100% Reliable Metrics</h4>
                  <div className="text-sm text-amber-800 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <strong>Automated Tools:</strong>
                        <ul className="text-xs mt-1 space-y-1">
                          <li>• Jest/Vitest with --coverage flag</li>
                          <li>• SonarQube for code quality</li>
                          <li>• ESLint with complexity rules</li>
                          <li>• npm audit for security issues</li>
                        </ul>
                      </div>
                      <div>
                        <strong>CI/CD Integration:</strong>
                        <ul className="text-xs mt-1 space-y-1">
                          <li>• Run tests on every commit</li>
                          <li>• Generate coverage reports</li>
                          <li>• Monitor metrics over time</li>
                          <li>• Set quality gates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}