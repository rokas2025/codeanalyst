import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  admin_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  wordpress_sites_count?: number;
}

interface ProjectContextType {
  selectedProject: Project | null;
  projects: Project[];
  loading: boolean;
  selectProject: (project: Project | null) => void;
  clearProject: () => void;
  getSelectedProject: () => Project | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// Alias for consistency
export const useProjectContext = useProject;

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Load projects on mount
  useEffect(() => {
    refreshProjects();
    
    // Load selected project from localStorage
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && savedProjectId !== 'null') {
      // Will be set after projects are loaded
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setSelectedProject(savedProject);
      }
    }
  }, []);

  // Save selected project to localStorage whenever it changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProject]);

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProjects([]);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects || []);
          
          // Restore selected project if it exists in the new list
          const savedProjectId = localStorage.getItem('selectedProjectId');
          if (savedProjectId && savedProjectId !== 'null') {
            const savedProject = data.projects.find((p: Project) => p.id === savedProjectId);
            if (savedProject) {
              setSelectedProject(savedProject);
            } else {
              // Project no longer exists, clear selection
              setSelectedProject(null);
              localStorage.removeItem('selectedProjectId');
            }
          }
        }
      } else if (response.status === 401) {
        // Unauthorized - clear projects
        setProjects([]);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      toast.success(`Selected project: ${project.name}`);
    } else {
      toast.info('Manual URL entry mode enabled');
    }
  };

  const clearProject = () => {
    setSelectedProject(null);
    localStorage.removeItem('selectedProjectId');
  };

  const getSelectedProject = () => {
    return selectedProject;
  };

  const value: ProjectContextType = {
    selectedProject,
    projects,
    loading,
    selectProject,
    clearProject,
    getSelectedProject,
    refreshProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;

