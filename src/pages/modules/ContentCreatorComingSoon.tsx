import React from 'react'
import { SparklesIcon, DocumentTextIcon, PencilSquareIcon, LanguageIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function ContentCreatorComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
            <PencilSquareIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            AI Content Creator
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Coming Soon
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional content in seconds with AI-powered templates, customizable tones, and multi-language support.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Templates
            </h3>
            <p className="text-gray-600">
              Choose from dozens of professional templates for blogs, marketing copy, product descriptions, and more.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <SparklesIcon className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Generation
            </h3>
            <p className="text-gray-600">
              Generate engaging, high-quality content using advanced AI models trained on professional writing.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <LanguageIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multi-Language Support
            </h3>
            <p className="text-gray-600">
              Create content in multiple languages with native-level fluency and cultural awareness.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tone Customization
            </h3>
            <p className="text-gray-600">
              Adjust the tone, style, and voice of your content to match your brand and audience perfectly.
            </p>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">Blog Posts</h3>
              <p className="text-sm text-gray-600">SEO-optimized articles and blog content</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Product Descriptions</h3>
              <p className="text-sm text-gray-600">Compelling product copy that converts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-semibold text-gray-900 mb-2">Marketing Emails</h3>
              <p className="text-sm text-gray-600">Engaging email campaigns and newsletters</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-3">
            Transform Your Content Creation
          </h2>
          <p className="text-purple-100 mb-6">
            Say goodbye to writer's block. Our AI Content Creator is coming soon to revolutionize how you create content.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-medium">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Launching Soon
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Expected Launch: Q2 2025
          </p>
        </div>
      </div>
    </div>
  )
}

