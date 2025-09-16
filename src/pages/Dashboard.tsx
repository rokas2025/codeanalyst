import React from 'react'
import { Link } from 'react-router-dom'
import { 
  CodeBracketIcon,
  DocumentTextIcon,
  CommandLineIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const modules = [
  {
    name: 'AI Code Analyst',
    description: 'Analyze website source code and get AI-powered improvement suggestions',
    href: '/modules/code-analyst',
    icon: CodeBracketIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'AI Website Analyst',
    description: 'Comprehensive website performance, SEO, and accessibility analysis',
    href: '/modules/website-analyst',
    icon: ChartBarIcon,
    color: 'bg-cyan-500',
  },
  {
    name: 'AI Content Analyst',
    description: 'Analyze content for grammar, readability, and SEO optimization',
    href: '/modules/content-analyst',
    icon: DocumentTextIcon,
    color: 'bg-green-500',
  },
  {
    name: 'AI Auto Programmer',
    description: 'Chat-based feature requests and automatic code generation',
    href: '/modules/auto-programmer',
    icon: CommandLineIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'AI Content Creator',
    description: 'Generate new content with SEO optimization and multilingual support',
    href: '/modules/content-creator',
    icon: PlusCircleIcon,
    color: 'bg-orange-500',
  },
]

const stats = [
  { name: 'Total Projects', value: '12', icon: ChartBarIcon },
  { name: 'Active Analyses', value: '3', icon: ClockIcon },
  { name: 'Applied Changes', value: '47', icon: CheckCircleIcon },
]

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your AI-powered website support tool. Choose a module to get started.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Modules Grid */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-6">AI Modules</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.name}
              to={module.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/projects" className="btn-outline">
            View Projects
          </Link>
          <Link to="/modules/code-analyst" className="btn-primary">
            Start Code Analysis
          </Link>
          <Link to="/settings" className="btn-secondary">
            Configure Settings
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-600">Code analysis completed for "My Portfolio Site"</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-600">New content created for "Blog Post: AI Trends"</span>
            <span className="text-gray-400">5 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-gray-600">Auto-programmer added contact form validation</span>
            <span className="text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  )
} 