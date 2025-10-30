import React, { useEffect, useState } from 'react'
import { useProjectContext } from '../contexts/ProjectContext'
import { backendService } from '../services/backendService'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface ModuleAccessGuardProps {
  module: 'website_analyst' | 'code_analyst' | 'content_analyst' | 'content_creator' | 'auto_programmer'
  children: React.ReactNode
}

export function ModuleAccessGuard({ module, children }: ModuleAccessGuardProps) {
  const { selectedProject } = useProjectContext()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [selectedProject, module])

  const checkAccess = async () => {
    try {
      setLoading(true)
      
      // If no project is selected, allow access (manual mode)
      if (!selectedProject) {
        setHasAccess(true)
        setLoading(false)
        return
      }

      // Check module permission for the selected project
      const data = await backendService.checkModulePermission(selectedProject.id, module)
      setHasAccess(data.hasAccess)
    } catch (error) {
      console.error('Error checking module access:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <LockClosedIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Module Deactivated</h2>
          <p className="mt-2 text-gray-600">
            You don't have access to this module for the selected project.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your project administrator to request access.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

