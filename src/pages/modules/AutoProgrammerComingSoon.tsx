import React from 'react'
import { CodeBracketIcon, SparklesIcon, RocketLaunchIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function AutoProgrammerComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <CodeBracketIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            AI Auto Programmer
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Coming Soon
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered coding assistant that understands your projects, suggests improvements, and helps you write better code faster.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Intelligent Code Chat
            </h3>
            <p className="text-gray-600">
              Chat with AI about your codebase. Ask questions, get explanations, and receive instant suggestions for improvements.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Automated Code Generation
            </h3>
            <p className="text-gray-600">
              Generate new features, components, and functions based on your requirements with AI-powered code generation.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Refactoring
            </h3>
            <p className="text-gray-600">
              AI analyzes your code and suggests refactoring opportunities to improve readability, performance, and maintainability.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Project-Aware Assistance
            </h3>
            <p className="text-gray-600">
              AI understands your entire project structure, dependencies, and coding patterns to provide contextual help.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-3">
            Be the First to Know
          </h2>
          <p className="text-indigo-100 mb-6">
            We're working hard to bring you this powerful AI coding assistant. Stay tuned for the launch!
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium">
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

