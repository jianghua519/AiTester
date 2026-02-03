import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth'

interface User {
  id: number
  email: string
  username: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
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
        } else {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)