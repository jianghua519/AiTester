import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth'
import { Project } from '../services/project'

interface User {
  id: number
  email: string
  username: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  currentProject: Project | null
  projects: Project[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  setCurrentProject: (project: Project) => void
  setProjects: (projects: Project[]) => void
  fetchProjects: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      currentProject: null,
      projects: [],
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(email, password)
          set({
            isAuthenticated: true,
            user: response.user,
            token: response.token,
            isLoading: false,
          })
          // 登录成功后获取项目列表
          await get().fetchProjects()
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          await authService.register(username, email, password)
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        authService.logout()
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          currentProject: null,
          projects: [],
          isLoading: false,
        })
      },

      checkAuth: () => {
        const { token } = get()
        if (token && authService.isAuthenticated()) {
          const user = authService.getCurrentUser()
          set({
            isAuthenticated: true,
            user,
            token,
          })
          // 恢复认证状态后获取项目列表
          get().fetchProjects()
        } else {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            currentProject: null,
            projects: [],
          })
        }
      },

      setCurrentProject: (project: Project) => {
        set({ currentProject: project })
        // 将当前项目 ID 存储到 localStorage，供 API 请求使用
        localStorage.setItem('current_project_id', project.id)
      },

      setProjects: (projects: Project[]) => {
        set({ projects })
      },

      fetchProjects: async () => {
        set({ isLoading: true })
        try {
          // 这里应该调用实际的 API，现在使用模拟数据
          const mockProjects: Project[] = [
            {
              id: '1',
              name: '项目 Alpha',
              description: '主要测试项目',
              created_at: '2023-10-27T10:00:00Z',
              updated_at: '2023-10-27T10:00:00Z',
              created_by: 1,
              member_count: 5
            },
            {
              id: '2',
              name: '项目 Beta',
              description: '集成测试项目',
              created_at: '2023-11-15T14:30:00Z',
              updated_at: '2023-11-15T14:30:00Z',
              created_by: 1,
              member_count: 3
            }
          ]
          
          set({ projects: mockProjects, isLoading: false })
          
          // 如果没有当前项目，设置为第一个项目
          const { currentProject } = get()
          if (!currentProject && mockProjects.length > 0) {
            get().setCurrentProject(mockProjects[0])
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        currentProject: state.currentProject,
        projects: state.projects,
      }),
    }
  )
)