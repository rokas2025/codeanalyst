import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { GitHubCallback } from './pages/GitHubCallback'
import { CodeAnalyst } from './pages/modules/CodeAnalyst'
import { WorkstationView } from './pages/WorkstationView'
import { WebsiteAnalyst } from './pages/modules/WebsiteAnalyst'
import { ContentAnalyst } from './pages/modules/ContentAnalyst'
import { AutoProgrammer } from './pages/modules/AutoProgrammer'
import { ContentCreator } from './pages/modules/ContentCreator'
import { Settings } from './pages/Settings'
import { Projects } from './pages/Projects'
import { AnalysisView } from './pages/AnalysisView'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="modules">
            <Route path="code-analyst" element={<CodeAnalyst />} />
            <Route path="website-analyst" element={<WebsiteAnalyst />} />
            <Route path="content-analyst" element={<ContentAnalyst />} />
            <Route path="auto-programmer" element={<AutoProgrammer />} />
            <Route path="content-creator" element={<ContentCreator />} />
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route path="analysis/:id" element={<AnalysisView />} />
          <Route path="analysis/website/:id" element={<AnalysisView />} />
          <Route path="workstation/:id" element={<WorkstationView />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App 