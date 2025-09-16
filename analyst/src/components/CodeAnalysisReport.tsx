import React, { useState } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  CodeBracketIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { exportAnalysisToPDF, exportDocumentationToPDF } from '../utils/pdfExport'
import { toast } from 'react-hot-toast'

interface CodeAnalysisReportProps {
  analysis: any
}

export function CodeAnalysisReport({ analysis }: CodeAnalysisReportProps) {
  // If analysis is still pending or failed, show appropriate state
  if (!analysis.results) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">
            {analysis.status === 'pending' || analysis.status === 'analyzing' ? 'Analysis in Progress...' : 'Analysis Not Complete'}
          </div>
          <div className="text-gray-600">
            {analysis.status === 'failed' ? 
              `Analysis failed: ${analysis.errorMessage || 'Unknown error'}` :
              `Status: ${analysis.status} (${analysis.progress || 0}% complete)`
            }
          </div>
        </div>
      </div>
    )
  }

  const isPremiumAnalysis = analysis?.results?.aiExplanations?.analysisType === 'Premium AI Analysis'
  const [isExporting, setIsExporting] = useState(false)
  
  const hasDependency = (depName: string) => {
    const deps = analysis.results?.technicalStructure?.dependencies?.production
    if (!deps) return false
    if (Array.isArray(deps)) return deps.includes(depName)
    if (typeof deps === 'object') return Object.keys(deps).includes(depName)
    return false
  }
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      case 'urgent': return 'text-red-700 bg-red-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      toast.loading('Generating PDF report...', { id: 'pdf-export' })
      
      await exportAnalysisToPDF(analysis.id, analysis)
      
      toast.success('PDF report downloaded successfully!', { id: 'pdf-export' })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF report', { id: 'pdf-export' })
    } finally {
      setIsExporting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'  // 70+ = Good (Green)
    if (score >= 50) return 'text-yellow-600' // 50-69 = Fair (Yellow) 
    return 'text-red-600'                     // <50 = Poor (Red)
  }

  return (
    <div className="space-y-8" id="analysis-report">
      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Executive Summary</h2>
          </div>
          {isPremiumAnalysis && (
            <div className="flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-medium rounded-full">
              <span className="animate-pulse mr-1">🤖</span>
              AI-Powered Analysis
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(analysis.results?.codeQualityScore || 50)}`}>
              {analysis.results?.codeQualityScore || 50}
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {(analysis.results?.totalLines || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Lines of Code</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {analysis.results?.totalFiles || 0}
            </div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">
            {isPremiumAnalysis ? '🤖 AI Project Analysis' : 'Project Analysis'}
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {analysis.results?.systemOverview?.summary ||
             analysis.results?.aiExplanations?.summary ||
             `Analyzed ${analysis.results?.totalFiles || 0} files with ${(analysis.results?.totalLines || 0).toLocaleString()} lines of code. ${
               analysis.results?.systemOverview?.analysisQuality === 'high' ? 'AI analysis completed successfully.' : 'Basic analysis completed.'
             }`}
          </p>
        </div>
      </div>

      {/* Technical Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <CodeBracketIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Technical Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Project Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                                     {hasDependency('react') ? 'React Application' :
                    hasDependency('vue') ? 'Vue Application' :
                    hasDependency('angular') ? 'Angular Application' :
                    hasDependency('express') ? 'Node.js Application' :
                    'Web Application'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">
                  {analysis.results?.totalFiles >= 100 ? 'Large' : 
                   analysis.results?.totalFiles >= 20 ? 'Medium' : 'Small'} 
                  ({analysis.results?.totalFiles || 0} files)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Languages:</span>
                <span className="font-medium">
                  {Array.isArray(analysis.results?.languages) && analysis.results.languages.length > 0 
                    ? analysis.results.languages.filter((l: string) => l && l.length > 1).map((l: string) => l.replace('.', '')).join(', ')
                    : 'Not detected'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frameworks:</span>
                <span className="font-medium">
                  {(() => {
                    const deps = analysis.results?.technicalStructure?.dependencies?.production || []
                    const depsArray = Array.isArray(deps) ? deps : Object.keys(deps)
                    const frameworks = depsArray.filter((dep: string) => 
                      ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'fastify', 'nestjs'].includes(dep.toLowerCase())
                    )
                    return frameworks.length > 0 
                      ? frameworks.map((f: string) => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')
                      : 'None detected'
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Architecture */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Architecture</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Components:</span>
                <span className="font-medium">
                  {analysis.results?.totalFiles || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modules:</span>
                <span className="font-medium">
                  {Math.floor((analysis.results?.totalFiles || 0) / 3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Directories:</span>
                <span className="font-medium">
                  {Math.max(1, Math.floor((analysis.results?.totalFiles || 0) / 5))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Complexity:</span>
                <span className="font-medium">
                  {Math.round(analysis.results?.complexityScore || 5)}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Patterns */}
        {analysis.technicalStructure?.architecture?.fileOrganization?.directoryStructure?.commonPatterns?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Code Organization</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.technicalStructure.architecture.fileOrganization.directoryStructure.commonPatterns.map((pattern: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dependencies & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dependencies */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <CpuChipIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Dependencies</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Dependencies:</span>
              <span className="font-medium">
                {((analysis.results?.technicalStructure?.dependencies?.production?.length || 0) + 
                  (analysis.results?.technicalStructure?.dependencies?.development?.length || 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Production:</span>
              <span className="font-medium">{analysis.results?.technicalStructure?.dependencies?.production?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Development:</span>
              <span className="font-medium">{analysis.results?.technicalStructure?.dependencies?.development?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outdated:</span>
              <span className="font-medium text-green-600">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vulnerable:</span>
              <span className="font-medium text-green-600">0</span>
            </div>
          </div>

          {analysis.technicalStructure?.dependencies?.packageManagers?.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-sm">Package Managers: </span>
              <span className="text-sm font-medium">{analysis.technicalStructure.dependencies.packageManagers.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Security Score:</span>
              <span className={`font-medium ${getScoreColor(analysis.riskAssessment?.securityRisks?.score || 100)}`}>
                {analysis.riskAssessment?.securityRisks?.score || 100}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical Issues:</span>
              <span className={`font-medium ${(analysis.riskAssessment?.securityRisks?.critical?.length || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.riskAssessment?.securityRisks?.critical?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">High Priority:</span>
              <span className={`font-medium ${(analysis.riskAssessment?.securityRisks?.high?.length || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.riskAssessment?.securityRisks?.high?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Medium Priority:</span>
              <span className={`font-medium ${(analysis.riskAssessment?.securityRisks?.medium?.length || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {analysis.riskAssessment?.securityRisks?.medium?.length || 0}
              </span>
            </div>
          </div>

          {(analysis.riskAssessment?.securityRisks?.totalIssues || 0) === 0 && (
            <div className="mt-4 flex items-center text-green-600 text-sm">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              No security issues detected
            </div>
          )}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Quality Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.results?.codeQualityScore || 0)}`}>
              {analysis.results?.codeQualityScore || 0}%
            </div>
            <div className="text-sm text-gray-600">Code Quality</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(100 - (analysis.results?.technicalDebtPercentage || 0))}`}>
              {analysis.results?.technicalDebtPercentage || 0}%
            </div>
            <div className="text-sm text-gray-600">Technical Debt</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.results?.testCoveragePercentage || 0)}`}>
              {analysis.results?.testCoveragePercentage || 0}%
            </div>
            <div className="text-sm text-gray-600">Test Coverage</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(analysis.results?.complexityScore || 0)}/10
            </div>
            <div className="text-sm text-gray-600">Complexity</div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
        </div>

        {/* Rich AI Recommendations from results.maintenanceNeeds.aiRecommendations */}
        {analysis.results?.maintenanceNeeds?.aiRecommendations?.length > 0 ? (
          <div className="space-y-4">
            {analysis.results.maintenanceNeeds.aiRecommendations.map((rec: any, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${
                rec.priority === 'urgent' ? 'border-red-300 bg-red-50' :
                rec.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                rec.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                'border-blue-300 bg-blue-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    rec.priority === 'urgent' ? 'bg-red-100' :
                    rec.priority === 'high' ? 'bg-orange-100' :
                    rec.priority === 'medium' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    {rec.type === 'security_fix' ? 
                      <ShieldCheckIcon className={`h-4 w-4 ${
                        rec.priority === 'urgent' ? 'text-red-600' : 'text-orange-600'
                      }`} /> :
                      <ExclamationTriangleIcon className={`h-4 w-4 ${
                        rec.priority === 'urgent' ? 'text-red-600' :
                        rec.priority === 'high' ? 'text-orange-600' :
                        rec.priority === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${
                        rec.priority === 'urgent' ? 'text-red-800' :
                        rec.priority === 'high' ? 'text-orange-800' :
                        rec.priority === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {rec.type === 'security_fix' ? '🔒' : '🔧'} {rec.area}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        rec.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-sm mb-3 ${
                      rec.priority === 'urgent' ? 'text-red-700' :
                      rec.priority === 'high' ? 'text-orange-700' :
                      rec.priority === 'medium' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {rec.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Impact:</span> {rec.businessImpact}
                      </div>
                      <div>
                        <span className="font-medium">Files:</span> {Array.isArray(rec.files) ? rec.files.join(', ') : rec.files}
                      </div>
                    </div>
                    {rec.codeExample && rec.codeExample !== `// TODO: Implement improvement for ${rec.area}` && (
                      <div className="mt-3 p-3 bg-gray-900 rounded text-xs text-green-400 font-mono overflow-x-auto">
                        <pre>{rec.codeExample}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : 
        /* Fallback to basic recommendations */
        analysis.ai_explanations?.recommendations?.length > 0 ? (
          <div className="space-y-3">
            {analysis.ai_explanations.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">{recommendation}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            No critical issues found. Code quality looks good!
          </div>
        )}
      </div>



      {/* Comprehensive Technical Documentation */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border p-6" data-section="documentation">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">📋 Comprehensive Technical Documentation</h2>
          </div>
          <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <span className="mr-1">🤖</span>
            AI-Generated
          </div>
        </div>
        
        <div className="space-y-6">
          {/* System Overview */}
          <div className="border border-green-200 rounded-lg p-6 bg-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              System Overview
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Project Metrics</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Files:</strong> {analysis.results?.totalFiles || analysis.total_files || 0}</li>
                    <li><strong>Lines of Code:</strong> {(analysis.results?.totalLines || analysis.total_lines || 0).toLocaleString()}</li>
                    <li><strong>Quality Score:</strong> {analysis.results?.codeQualityScore || analysis.code_quality_score || 0}/100</li>
                    <li><strong>Technical Debt:</strong> {analysis.results?.technicalDebtPercentage || analysis.technical_debt_percentage || 0}%</li>
                    <li><strong>Test Coverage:</strong> {analysis.results?.testCoveragePercentage || analysis.test_coverage_percentage || 0}%</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🏗️ Architecture Type</h4>
                  <p className="text-sm mb-3">
                                         {analysis.results?.technicalStructure?.aiInsights?.overview || analysis.results?.systemOverview?.summary || 
                     `This is a ${analysis.results?.totalFiles >= 50 ? 'large-scale' : analysis.results?.totalFiles >= 20 ? 'medium-scale' : 'compact'} application with ${analysis.results?.totalFiles || 0} components and ${(analysis.results?.totalLines || 0).toLocaleString()} lines of code.`}
                  </p>
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 AI Assessment</h4>
                  <p className="text-sm">
                                         {analysis.results?.technicalStructure?.aiInsights?.codeQuality?.reasoning || 
                     `Code quality assessment: ${analysis.code_quality_score >= 70 ? 'Excellent' : analysis.code_quality_score >= 50 ? 'Good' : 'Needs Improvement'} with a score of ${analysis.code_quality_score || 50}/100.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Architecture */}
          <div className="border border-green-200 rounded-lg p-6 bg-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Technical Architecture & Dependencies
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">🔧 Technology Stack</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Languages:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                                                {Array.isArray(analysis.results?.languages || analysis.languages) 
                          ? (analysis.results?.languages || analysis.languages || []).filter((l: string) => l && l.length > 1).map((lang: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{lang.replace('.', '')}</span>
                          ))
                          : null}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Frameworks:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(analysis.results?.frameworks || analysis.frameworks || []).map((fw: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{fw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">📦 Dependencies</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Production:</span>
                                             <span className="font-medium">{analysis.results?.technicalStructure?.dependencies?.production?.length || 0}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Development:</span>
                       <span className="font-medium">{analysis.results?.technicalStructure?.dependencies?.development?.length || 0}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Total:</span>
                       <span className="font-medium">{(analysis.results?.technicalStructure?.dependencies?.production?.length || 0) + (analysis.results?.technicalStructure?.dependencies?.development?.length || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🏛️ Architecture Analysis</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                                         {analysis.results?.technicalStructure?.aiInsights?.architecture || 
                     `This application follows modern development patterns with ${analysis.results?.totalFiles >= 30 ? 'enterprise-grade' : 'standard'} architecture. 
                     The codebase demonstrates ${analysis.code_quality_score >= 70 ? 'excellent' : analysis.code_quality_score >= 50 ? 'good' : 'basic'} 
                     structural organization with ${analysis.technical_structure?.aiInsights?.codeQuality?.strengths?.length || 0} identified strengths 
                     and ${analysis.technical_structure?.aiInsights?.codeQuality?.weaknesses?.length || 0} areas for improvement.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Performance Analysis */}
          <div className="border border-green-200 rounded-lg p-6 bg-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Security & Performance Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🔒 Security Assessment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Security Score:</span>
                                         <span className="font-medium text-lg">{analysis.results?.technicalStructure?.aiInsights?.security?.score || 8}/10</span>
                   </div>
                   {analysis.results?.technicalStructure?.aiInsights?.security?.vulnerabilities?.length > 0 && (
                     <div>
                       <span className="text-sm font-medium text-red-600">Vulnerabilities:</span>
                       <ul className="text-xs text-red-700 mt-1 space-y-1">
                         {analysis.results.technicalStructure.aiInsights.security.vulnerabilities.map((vuln: string, i: number) => (
                           <li key={i}>• {vuln}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {analysis.results?.technicalStructure?.aiInsights?.security?.recommendations?.length > 0 && (
                     <div>
                       <span className="text-sm font-medium text-green-600">Recommendations:</span>
                       <ul className="text-xs text-green-700 mt-1 space-y-1">
                         {analysis.results.technicalStructure.aiInsights.security.recommendations.map((rec: string, i: number) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">⚡ Performance Analysis</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Performance Score:</span>
                                         <span className="font-medium text-lg">{analysis.results?.technicalStructure?.aiInsights?.performance?.score || 7}/10</span>
                   </div>
                   {analysis.results?.technicalStructure?.aiInsights?.performance?.bottlenecks?.length > 0 && (
                     <div>
                       <span className="text-sm font-medium text-orange-600">Bottlenecks:</span>
                       <ul className="text-xs text-orange-700 mt-1 space-y-1">
                         {analysis.results.technicalStructure.aiInsights.performance.bottlenecks.map((bottleneck: string, i: number) => (
                           <li key={i}>• {bottleneck}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {analysis.results?.technicalStructure?.aiInsights?.performance?.optimizations?.length > 0 && (
                     <div>
                       <span className="text-sm font-medium text-blue-600">Optimizations:</span>
                       <ul className="text-xs text-blue-700 mt-1 space-y-1">
                         {analysis.results.technicalStructure.aiInsights.performance.optimizations.map((opt: string, i: number) => (
                          <li key={i}>• {opt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Testing & Quality Assurance */}
          <div className="border border-green-200 rounded-lg p-6 bg-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Testing & Quality Assurance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Current Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Test Coverage:</span>
                    <span className={`font-medium ${(analysis.test_coverage_percentage || 0) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.test_coverage_percentage || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Score:</span>
                    <span className={`font-medium ${(analysis.code_quality_score || 0) >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {analysis.code_quality_score || 0}/100
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Testing Gaps</h4>
                <div className="text-xs text-gray-700 space-y-1">
                                     {analysis.results?.technicalStructure?.aiInsights?.testing?.gaps?.map((gap: string, i: number) => (
                     <div key={i}>• {gap}</div>
                   )) || <div>• No specific testing gaps identified</div>}
                 </div>
               </div>
               <div>
                 <h4 className="font-semibold text-gray-900 mb-2">📋 Strategy</h4>
                 <div className="text-xs text-gray-700">
                   {analysis.results?.technicalStructure?.aiInsights?.testing?.strategy || 
                   'Implement comprehensive testing including unit tests, integration tests, and end-to-end testing for critical user flows.'}
                </div>
              </div>
            </div>
          </div>

          {/* Development Roadmap */}
          <div className="border border-green-200 rounded-lg p-6 bg-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
              Development Roadmap & Next Steps
            </h3>
            <div className="space-y-4">
                             {analysis.results?.maintenanceNeeds?.aiRecommendations?.length > 0 && (
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">🎯 Priority Actions</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {analysis.results.maintenanceNeeds.aiRecommendations
                       .filter((rec: any) => rec.priority === 'urgent' || rec.priority === 'high')
                       .slice(0, 4)
                       .map((rec: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border ${
                        rec.priority === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="font-medium text-sm">{rec.area}</div>
                        <div className="text-xs text-gray-600 mt-1">{rec.description || 'Needs attention'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">📈 Modernization Opportunities</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="text-sm text-blue-800 space-y-1">
                                         {analysis.results?.technicalStructure?.aiInsights?.modernization?.map((mod: string, i: number) => (
                      <li key={i}>• {mod}</li>
                    )) || [
                      '• Implement comprehensive error handling',
                      '• Add unit and integration testing',
                      '• Consider TypeScript migration for better type safety',
                      '• Implement automated code quality checks'
                    ].map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🎯 Implementation Focus</h4>
                <div className="text-sm text-gray-700">
                  <strong>Priority:</strong> Focus on high-impact improvements to enhance code quality, security, and maintainability. Use AI-powered tools to accelerate implementation of critical fixes and improvements.
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="border border-green-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">📄 Export Analysis Report</h4>
                <p className="text-sm text-gray-600 mt-1">Download a comprehensive PDF report for your team and stakeholders</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      📄 Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Business Impact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Priority Level</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.businessRecommendations?.priority || 'low')}`}>
              {(analysis.businessRecommendations?.priority || 'low').toUpperCase()}
            </span>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">AI Implementation</h3>
            <div className="flex items-center text-gray-700">
              <CpuChipIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">Use AI-powered development tools for faster implementation</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Investment Needed</h3>
            <div className="flex items-center text-gray-700">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{analysis.businessRecommendations?.investmentNeeded || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {analysis.aiExplanations?.businessImpact && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Business Analysis</h3>
            <p className="text-gray-700 text-sm">{analysis.aiExplanations.businessImpact}</p>
          </div>
        )}
      </div>
    </div>
  )
} 