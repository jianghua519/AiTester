import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ProjectSelector } from './ProjectSelector'
import { Project } from '../../services/project'
import { projectService } from '../../services/project'
import { useAuthStore } from '../../store/auth'

interface ProjectSelectorContainerProps {
  currentProjectId?: string
  onProjectChange?: (projectId: string) => void
}

export const ProjectSelectorContainer: React.FC<ProjectSelectorContainerProps> = ({
  currentProjectId,
  onProjectChange
}) => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedProjects = await projectService.getProjects()
        setProjects(fetchedProjects)
        
        // Set current project
        if (currentProjectId) {
          const project = fetchedProjects.find(p => p.id.toString() === currentProjectId)
          setCurrentProject(project || null)
        } else if (fetchedProjects.length > 0) {
          setCurrentProject(fetchedProjects[0])
          onProjectChange?.(fetchedProjects[0].id.toString())
        }
      } catch (err) {
        setError(t('project.fetchError'))
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [currentProjectId, onProjectChange, t])

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id.toString() === projectId)
    if (project) {
      setCurrentProject(project)
      onProjectChange?.(projectId)
    }
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
        <span className="text-sm text-red-600">{error}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-md">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">{t('project.loading')}</span>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <span className="text-sm text-yellow-600">{t('project.noProjects')}</span>
      </div>
    )
  }

  return (
    <ProjectSelector
      currentProject={currentProject}
      projects={projects}
      onProjectChange={handleProjectChange}
      isLoading={isLoading}
    />
  )
}