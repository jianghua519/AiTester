import axios, { AxiosInstance } from 'axios'

// API 响应类型定义
export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    username: string
  }
}

export interface RegisterResponse {
  message: string
  user: {
    id: number
    email: string
    username: string
  }
}

export interface ApiError {
  error: string
}

// API 客户端配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiClient {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器 - 添加 JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 处理错误
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  get<T = any>(url: string, config?: any): Promise<T> {
    return this.api.get(url, config).then((response) => response.data)
  }

  post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.api.post(url, data, config).then((response) => response.data)
  }

  put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.api.put(url, data, config).then((response) => response.data)
  }

  delete<T = any>(url: string, config?: any): Promise<T> {
    return this.api.delete(url, config).then((response) => response.data)
  }
}

export const apiClient = new ApiClient()

// 认证服务
export class AuthService {
  private api: ApiClient

  constructor() {
    this.api = apiClient
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/v1/auth/login', {
        email,
        password,
      })
      
      // 存储 token 和用户信息
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user_data', JSON.stringify(response.user))
      
      return response
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response
        if (status === 401) {
          throw new Error('auth.loginFailed')
        } else if (status === 403) {
          throw new Error('auth.forbidden')
        } else if (status === 429) {
          throw new Error('auth.tooManyAttempts')
        }
      }
      throw new Error('auth.networkError')
    }
  }

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await this.api.post<RegisterResponse>('/api/v1/auth/register', {
        username,
        email,
        password,
      })
      
      return response
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response
        if (status === 409) {
          throw new Error('auth.emailOrUsernameExists')
        } else if (status === 400) {
          throw new Error('auth.invalidData')
        } else if (status === 429) {
          throw new Error('auth.tooManyAttempts')
        }
      }
      throw new Error('auth.networkError')
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    
    // 检查 token 是否过期
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp > Date.now() / 1000
    } catch {
      return false
    }
  }

  getCurrentUser(): any | null {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  }
}

export const authService = new AuthService()