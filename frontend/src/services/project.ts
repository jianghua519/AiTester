import { apiClient } from './auth'

export interface Project {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  created_by: number
  is_active: boolean
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
  page: number
  limit: number
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  is_active?: boolean
}

export class ProjectService {
  private api = apiClient

  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.api.get<Project[]>('/api/v1/projects')
      return response
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  async getProject(id: number): Promise<Project> {
    try {
      const response = await this.api.get<Project>(`/api/v1/projects/${id}`)
      return response
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error)
      throw new Error(`Failed to fetch project ${id}`)
    }
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    try {
      const response = await this.api.post<Project>('/api/v1/projects', data)
      return response
    } catch (error) {
      console.error('Failed to create project:', error)
      throw new Error('Failed to create project')
    }
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    try {
      const response = await this.api.put<Project>(`/api/v1/projects/${id}`, data)
      return response
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error)
      throw new Error(`Failed to update project ${id}`)
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await this.api.delete(`/api/v1/projects/${id}`)
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error)
      throw new Error(`Failed to delete project ${id}`)
    }
  }
}

export const projectService = new ProjectService()