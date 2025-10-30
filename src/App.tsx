import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { GitHubCallback } from './pages/GitHubCallback'
import { AuthCallback } from './pages/AuthCallback'
import { CodeAnalyst } from './pages/modules/CodeAnalyst'
import { WorkstationView } from './pages/WorkstationView'
import { WebsiteAnalyst } from './pages/modules/WebsiteAnalyst'
import { ContentAnalyst } from './pages/modules/ContentAnalyst'
import { AutoProgrammer } from './pages/modules/AutoProgrammer'
import { ContentCreator } from './pages/modules/ContentCreator'
import { Settings } from './pages/Settings'
import { Projects } from './pages/Projects'
import { AnalysisView } from './pages/AnalysisView'
import { ConnectedSites } from './pages/ConnectedSites'
import { UserManagement } from './pages/UserManagement'
import { ProjectManagement } from './pages/ProjectManagement'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ProjectProvider } from './contexts/ProjectContext'

function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="project-management" element={<ProjectManagement />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="modules">
            <Route path="code-analyst" element={<CodeAnalyst />} />
            <Route path="website-analyst" element={<WebsiteAnalyst />} />
            <Route path="content-analyst" element={<ContentAnalyst />} />
            <Route path="auto-programmer" element={<AutoProgrammer />} />
            <Route path="content-creator" element={<ContentCreator />} />
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route path="connected-sites" element={<ConnectedSites />} />
          <Route path="analysis/:id" element={<AnalysisView />} />
          <Route path="analysis/website/:id" element={<AnalysisView />} />
          <Route path="workstation/:id" element={<WorkstationView />} />
        </Route>
      </Routes>
      <Toaster />
    </ProjectProvider>
  )
}

export default App 