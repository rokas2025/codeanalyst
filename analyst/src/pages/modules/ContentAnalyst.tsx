import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { 
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  SparklesIcon,
  GlobeAltIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

interface AnalysisResult {
  original: string
  improved: string
  grammar: {
    score: number
    issues: Array<{
      type: string
      suggestion: string
    }>
  }
  readability: {
    score: number
    suggestions: string[]
  }
  seo: {
    score: number
    suggestions: string[]
    factors: string[]
    metrics: {
      wordCount: number
      sentenceCount: number
      paragraphCount: number
      avgWordsPerSentence: number
      lexicalDiversity: number
    }
  }
  summary: {
    wordCount: number
  }
  keywords: string[]
  urlInfo?: { url: string }
  contentSource?: 'html' | 'url' | 'text'
}

export function ContentAnalyst() {
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [inputType, setInputType] = useState<'text' | 'url'>('text')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyzeContent = async () => {
    const inputContent = inputType === 'text' ? content : url
    
    if (!inputContent.trim()) {
      toast.error(`Please provide ${inputType === 'text' ? 'content' : 'URL'} to analyze`)
      return
    }

    setIsAnalyzing(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
      
      const response = await fetch(`${baseUrl}/content-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || 'dev-token-content-analyst'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: inputType === 'text' ? content : undefined,
          url: inputType === 'url' ? url : undefined,
          type: inputType === 'url' ? 'url' : 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      const analysisData = data.analysis.result
      
      setResult({
        original: inputContent,
        improved: analysisData.improved || inputContent,
        grammar: {
          score: analysisData.grammar.score,
          issues: analysisData.grammar.issues || []
        },
        readability: {
          score: analysisData.readability.score,
          suggestions: analysisData.readability.suggestions || []
        },
        seo: {
          score: analysisData.seo.score,
          suggestions: analysisData.seo.suggestions || [],
          factors: analysisData.seo.factors || [],
          metrics: analysisData.seo.metrics || {}
        },
        summary: {
          wordCount: analysisData.summary.wordCount || 0
        },
        keywords: analysisData.keywords || [],
        urlInfo: data.analysis.urlInfo,
        contentSource: data.analysis.contentSource
      })

      toast.success('Content analysis completed!')
      
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Content analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard!`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="h-8 w-8 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Analyst</h1>
          <p className="text-gray-600">Improve your content with AI-powered grammar, readability, and SEO analysis</p>
        </div>
      </div>

      {/* Input Type Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Analyze:</span>
        <div className="flex rounded-lg border border-gray-300 p-1">
          <button
            onClick={() => setInputType('text')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputType === 'text' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-2" />
            Text Content
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputType === 'url' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LinkIcon className="h-4 w-4 inline mr-2" />
            Website URL
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
              {inputType === 'text' ? 'Your Content' : 'Website URL'}
            </h3>
            
            <div className="space-y-4">
              {inputType === 'text' ? (
                <div className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your content here:
• Plain text content
• HTML code (will be automatically cleaned)
• Blog posts, articles, or any text content
• Product descriptions, web copy, etc."
                    className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="h-80 flex flex-col space-y-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/your-page"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <GlobeAltIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-800 font-medium mb-1">Live Website Analysis</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div>• Fetches real content from any website</div>
                        <div>• Extracts main content (removes nav, ads, etc.)</div>
                        <div>• Analyzes actual readable text</div>
                        <div>• Provides website-specific SEO insights</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeContent}
                disabled={isAnalyzing || (!content.trim() && !url.trim())}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="animate-spin inline-block w-5 h-5 mr-2" />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="inline-block w-5 h-5 mr-2" />
                    Analyze & Improve Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Improved Content Section */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-green-500 mr-2" />
                Improved Content
              </div>
              {result && (
                <button
                  onClick={() => copyToClipboard(result.improved, 'Improved content')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                  Copy
                </button>
              )}
            </h3>
            
            <div className="space-y-4">
              {!result ? (
                <div className="h-80 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Improved content will appear here</p>
                    <p className="text-gray-400 text-sm mt-1">Analyze your content to see AI improvements</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 h-80 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {result.improved}
                  </pre>
                </div>
              )}
              
              {/* Invisible spacer button to match left side */}
              <div className="h-14"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-6">
          {/* Content Type Indicator */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {result.urlInfo ? (
                  <>
                    <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Website Content Analyzed</div>
                      <div className="text-xs text-gray-500">Fetched and analyzed from: {result.urlInfo.url}</div>
                    </div>
                  </>
                ) : result.contentSource === 'html' ? (
                  <>
                    <DocumentTextIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">HTML Content Detected</div>
                      <div className="text-xs text-gray-500">Automatically cleaned and extracted readable text</div>
                    </div>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Plain Text Analyzed</div>
                      <div className="text-xs text-gray-500">Direct text content analysis</div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{result.summary.wordCount} words</div>
                <div className="text-xs text-gray-500">analyzed</div>
              </div>
            </div>
          </div>

          {/* Score Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Word Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{result.summary.wordCount}</div>
                <div className="text-sm text-blue-600 mt-1">Words</div>
                {result.seo.metrics.sentenceCount && (
                  <div className="text-xs text-blue-500 mt-1">
                    {result.seo.metrics.sentenceCount} sentences
                  </div>
                )}
              </div>

              {/* Grammar Score */}
              <div className={`p-4 rounded-lg border text-center ${getScoreBg(result.grammar.score)}`}>
                <div className={`text-2xl font-bold ${getScoreColor(result.grammar.score)}`}>
                  {result.grammar.score}
                </div>
                <div className="text-sm text-gray-600 mt-1">Grammar</div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.grammar.issues.length} issues found
                </div>
              </div>

              {/* Readability Score */}
              <div className={`p-4 rounded-lg border text-center ${getScoreBg(result.readability.score)}`}>
                <div className={`text-2xl font-bold ${getScoreColor(result.readability.score)}`}>
                  {result.readability.score}
                </div>
                <div className="text-sm text-gray-600 mt-1">Readability</div>
                {result.seo.metrics.avgWordsPerSentence && (
                  <div className="text-xs text-gray-500 mt-1">
                    ~{result.seo.metrics.avgWordsPerSentence} words/sentence
                  </div>
                )}
              </div>

              {/* SEO Score */}
              <div className={`p-4 rounded-lg border text-center ${getScoreBg(result.seo.score)}`}>
                <div className={`text-2xl font-bold ${getScoreColor(result.seo.score)}`}>
                  {result.seo.score}
                </div>
                <div className="text-sm text-gray-600 mt-1">SEO</div>
                {result.seo.metrics.lexicalDiversity && (
                  <div className="text-xs text-gray-500 mt-1">
                    {result.seo.metrics.lexicalDiversity}% diversity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grammar Improvements */}
            <div className="card p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                Grammar Analysis
              </h4>
              <div className="space-y-3">
                {result.grammar.issues.length > 0 ? (
                  result.grammar.issues.map((issue, index) => (
                    <div key={index} className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                      <div className="flex items-start space-x-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {issue.type}
                        </span>
                        <p className="text-sm text-green-800 flex-1">{issue.suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No grammar issues found!</p>
                )}
              </div>
            </div>

            {/* Readability Improvements */}
            <div className="card p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                Readability Analysis
              </h4>
              <div className="space-y-3">
                {result.readability.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
                
                {/* Readability Metrics */}
                {result.seo.metrics.avgWordsPerSentence && (
                  <div className="bg-blue-25 border border-blue-150 rounded-lg p-3 mt-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Content Structure:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                      <div>Avg. words per sentence: {result.seo.metrics.avgWordsPerSentence}</div>
                      <div>Vocabulary diversity: {result.seo.metrics.lexicalDiversity}%</div>
                      <div>Total paragraphs: {result.seo.metrics.paragraphCount}</div>
                      <div>Total sentences: {result.seo.metrics.sentenceCount}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Optimization */}
            <div className="card p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-purple-500 mr-2" />
                SEO Analysis
              </h4>
              
              {/* SEO Factors */}
              {result.seo.factors.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Content Factors:</h5>
                  <div className="space-y-2">
                    {result.seo.factors.map((factor, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* SEO Suggestions */}
              <div className="space-y-3">
                {result.seo.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                    <p className="text-sm text-purple-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords */}
          {result.keywords.length > 0 && (
            <div className="card p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Key Terms & Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 