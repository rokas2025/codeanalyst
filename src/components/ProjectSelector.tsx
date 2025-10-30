import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export const ProjectSelector: React.FC = () => {
  const { selectedProject, projects, loading, selectProject } = useProject();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Link
        to="/projects/new"
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add Project</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 hidden md:block">Project:</span>
      <div className="relative">
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const projectId = e.target.value;
            if (projectId === '') {
              selectProject(null);
            } else {
              const project = projects.find(p => p.id === projectId);
              if (project) {
                selectProject(project);
              }
            }
          }}
          className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white"
        >
          <option value="">None (Manual Entry)</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <Link
        to="/projects/new"
        className="flex items-center justify-center h-9 w-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
        title="Add New Project"
      >
        <PlusIcon className="h-5 w-5" />
      </Link>
    </div>
  );
};

export default ProjectSelector;

