import React from 'react'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { ProjectSelector } from './ProjectSelector'

export function Header() {
  const { user, logout } = useAuthStore()
  const userRole = (user as any)?.role || 'user'
  const isAdmin = userRole === 'admin' || userRole === 'superadmin'

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
      <div className="flex-1 px-4 flex justify-between sm:px-6 lg:px-8">
        <div className="flex-1 flex items-center">
          {isAdmin && <ProjectSelector />}
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications */}
          <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
          </button>

          {/* User menu */}
          <div className="relative flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.plan || 'free'} plan</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name || 'User Avatar'} 
                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 