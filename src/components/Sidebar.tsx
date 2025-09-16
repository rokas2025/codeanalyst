import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  HomeIcon,
  FolderIcon,
  CogIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  CommandLineIcon,
  PlusCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Analysis History', href: '/projects', icon: ClockIcon },
  {
    name: 'AI Modules',
    children: [
      { name: 'Code Analyst', href: '/modules/code-analyst', icon: CodeBracketIcon },
      { name: 'Website Analyst', href: '/modules/website-analyst', icon: ChartBarIcon },
      { name: 'Content Analyst', href: '/modules/content-analyst', icon: DocumentTextIcon },
      { name: 'Auto Programmer', href: '/modules/auto-programmer', icon: CommandLineIcon },
      { name: 'Content Creator', href: '/modules/content-creator', icon: PlusCircleIcon },
    ],
  },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Support Tool</h1>
                <p className="text-xs text-gray-500">SME Solutions</p>
              </div>
            </div>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {item.name}
                    </div>
                    <div className="space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <child.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
} 