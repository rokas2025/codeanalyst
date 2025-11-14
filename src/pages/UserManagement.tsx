import React, { useEffect, useState } from 'react'
import { 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { backendService } from '../services/backendService'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  github_username?: string
  role: 'superadmin' | 'admin' | 'user'
  is_active: boolean
  pending_approval: boolean
  created_at: string
  approved_at?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all')
  const currentUserId = useAuthStore(state => state.user?.id)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await backendService.getAllUsers()
      setUsers(data.users)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await backendService.approveUser(userId)
      toast.success('User approved successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve user')
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? All their invited users will also be deactivated.')) {
      return
    }
    
    try {
      await backendService.deactivateUser(userId)
      toast.success('User deactivated successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user')
    }
  }

  const handleReactivateUser = async (userId: string) => {
    try {
      await backendService.reactivateUser(userId)
      toast.success('User reactivated successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate user')
    }
  }

  const handleMakeSuperadmin = async (userId: string) => {
    if (!confirm('Are you sure you want to make this user a superadmin? This will give them full system access.')) {
      return
    }
    
    try {
      await backendService.createSuperadmin(userId)
      toast.success('User promoted to superadmin')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to promote user')
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`This will permanently delete ${email} and all related projects. This action cannot be undone. Continue?`)) {
      return
    }

    try {
      console.log('🗑️ Attempting to delete user:', { userId, email })
      await backendService.deleteUser(userId)
      console.log('✅ User deleted successfully')
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error: any) {
      console.error('❌ Delete user error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      const message = error.response?.data?.error || error.message || 'Failed to delete user'
      toast.error(message)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'pending') return user.pending_approval
    if (filter === 'active') return user.is_active && !user.pending_approval
    if (filter === 'inactive') return !user.is_active
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage user accounts, approve registrations, and assign roles.
        </p>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Pending Approval ({users.filter(u => u.pending_approval).length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Active ({users.filter(u => u.is_active && !u.pending_approval).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'inactive'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Inactive ({users.filter(u => !u.is_active).length})
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserIcon className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.github_username && (
                        <div className="text-xs text-gray-400">GitHub: {user.github_username}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'superadmin' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'superadmin' && <ShieldCheckIcon className="h-3 w-3 mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.pending_approval ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Pending Approval
                    </span>
                  ) : user.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-3 w-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {user.pending_approval && (
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                    )}
                    
                    {user.is_active && !user.pending_approval && (
                      <button
                        onClick={() => handleDeactivateUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    )}
                    
                    {!user.is_active && !user.pending_approval && (
                      <button
                        onClick={() => handleReactivateUser(user.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reactivate
                      </button>
                    )}
                    
                    {user.role !== 'superadmin' && user.is_active && !user.pending_approval && (
                      <button
                        onClick={() => handleMakeSuperadmin(user.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Make Superadmin
                      </button>
                    )}

                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-700 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' 
                ? 'No users are waiting for approval.'
                : filter === 'active'
                ? 'No active users found.'
                : filter === 'inactive'
                ? 'No inactive users found.'
                : 'No users in the system.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

