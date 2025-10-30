import React, { useEffect, useState } from 'react'
import { 
  FolderIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { backendService } from '../services/backendService'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  url: string
  description?: string
  created_at: string
  admin_id: string
}

interface ProjectUser {
  user_id: string
  user_name: string
  user_email: string
  added_at: string
  modules: {
    website_analyst: boolean
    code_analyst: boolean
    content_analyst: boolean
    content_creator: boolean
    auto_programmer: boolean
  }
}

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  })
  
  const [inviteData, setInviteData] = useState({
    email: '',
    modules: {
      website_analyst: true,
      code_analyst: true,
      content_analyst: true,
      content_creator: true,
      auto_programmer: true
    }
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await backendService.getAdminProjects()
      setProjects(data.projects)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectUsers = async (projectId: string) => {
    try {
      const data = await backendService.getProjectUsers(projectId)
      setProjectUsers(data.users)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load project users')
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await backendService.createProject(formData)
      toast.success('Project created successfully')
      setShowAddModal(false)
      setFormData({ name: '', url: '', description: '' })
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    
    try {
      await backendService.updateProject(selectedProject.id, formData)
      toast.success('Project updated successfully')
      setShowEditModal(false)
      setSelectedProject(null)
      setFormData({ name: '', url: '', description: '' })
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    
    try {
      await backendService.deleteProject(projectId)
      toast.success('Project deleted successfully')
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project')
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    
    try {
      await backendService.inviteUserToProject(selectedProject.id, inviteData)
      toast.success('User invited successfully')
      setShowInviteModal(false)
      setInviteData({
        email: '',
        modules: {
          website_analyst: true,
          code_analyst: true,
          content_analyst: true,
          content_creator: true,
          auto_programmer: true
        }
      })
      loadProjectUsers(selectedProject.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user')
    }
  }

  const handleRemoveUser = async (projectId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) {
      return
    }
    
    try {
      await backendService.removeUserFromProject(projectId, userId)
      toast.success('User removed from project')
      loadProjectUsers(projectId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user')
    }
  }

  const handleUpdateModulePermissions = async (projectId: string, userId: string, modules: any) => {
    try {
      await backendService.updateModulePermissions(projectId, userId, modules)
      toast.success('Permissions updated')
      loadProjectUsers(projectId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions')
    }
  }

  const openEditModal = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      url: project.url,
      description: project.description || ''
    })
    setShowEditModal(true)
  }

  const openUsersModal = (project: Project) => {
    setSelectedProject(project)
    loadProjectUsers(project.id)
    setShowUsersModal(true)
  }

  const openInviteModal = (project: Project) => {
    setSelectedProject(project)
    setShowInviteModal(true)
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your projects and invite users to collaborate.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <FolderIcon className="h-8 w-8 text-primary-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{project.url}</p>
                </div>
              </div>
            </div>
            
            {project.description && (
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">{project.description}</p>
            )}
            
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => openUsersModal(project)}
                className="flex-1 btn-outline text-sm py-2 flex items-center justify-center space-x-1"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Users</span>
              </button>
              <button
                onClick={() => openEditModal(project)}
                className="btn-outline text-sm py-2 px-3"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="btn-outline text-sm py-2 px-3 text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 card">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {showAddModal ? 'Add New Project' : 'Edit Project'}
            </h2>
            <form onSubmit={showAddModal ? handleCreateProject : handleUpdateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="My Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Optional project description"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button type="submit" className="flex-1 btn-primary">
                  {showAddModal ? 'Create Project' : 'Update Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormData({ name: '', url: '', description: '' })
                    setSelectedProject(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Users Modal */}
      {showUsersModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Users - {selectedProject.name}
              </h2>
              <button
                onClick={() => openInviteModal(selectedProject)}
                className="btn-primary text-sm flex items-center space-x-1"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Invite User</span>
              </button>
            </div>
            
            {projectUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users invited to this project yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectUsers.map((user) => (
                  <div key={user.user_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.user_name}</h3>
                        <p className="text-sm text-gray-500">{user.user_email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added {new Date(user.added_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(selectedProject.id, user.user_id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(user.modules).map(([module, enabled]) => (
                        <label key={module} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              const newModules = { ...user.modules, [module]: e.target.checked }
                              handleUpdateModulePermissions(selectedProject.id, user.user_id, newModules)
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-gray-700 capitalize">
                            {module.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowUsersModal(false)
                  setSelectedProject(null)
                  setProjectUsers([])
                }}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Invite User to {selectedProject.name}
            </h2>
            <form onSubmit={handleInviteUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="input"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Access
                  </label>
                  <div className="space-y-2">
                    {Object.entries(inviteData.modules).map(([module, enabled]) => (
                      <label key={module} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setInviteData({
                            ...inviteData,
                            modules: { ...inviteData.modules, [module]: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {module.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button type="submit" className="flex-1 btn-primary">
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteData({
                      email: '',
                      modules: {
                        website_analyst: true,
                        code_analyst: true,
                        content_analyst: true,
                        content_creator: true,
                        auto_programmer: true
                      }
                    })
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

