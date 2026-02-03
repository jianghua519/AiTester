import { authService } from '../services/auth'
import { AuthResponse, RegisterResponse } from '../services/auth'

// Mock axios
jest.mock('axios')
const mockedAxios = require('axios')

describe('AuthService', () => {
  const originalLocalStorage = window.localStorage

  beforeEach(() => {
    // Mock localStorage
    window.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Restore original localStorage
    window.localStorage = originalLocalStorage
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse: AuthResponse = {
        token: 'jwt-token-123',
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      }

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponse })
      })

      const result = await authService.login('test@example.com', 'password123')

      expect(result).toEqual(mockResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123')
      expect(localStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(mockResponse.user))
    })

    it('handles 401 error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 401 }
        })
      })

      await expect(authService.login('test@example.com', 'wrongpass'))
        .rejects.toThrow('auth.loginFailed')
    })

    it('handles 403 error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 403 }
        })
      })

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('auth.forbidden')
    })

    it('handles 429 error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 429 }
        })
      })

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('auth.tooManyAttempts')
    })

    it('handles network error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Network Error'))
      })

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('auth.networkError')
    })
  })

  describe('register', () => {
    it('successfully registers user', async () => {
      const mockResponse: RegisterResponse = {
        message: 'User registered successfully',
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      }

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponse })
      })

      const result = await authService.register('testuser', 'test@example.com', 'password123')

      expect(result).toEqual(mockResponse)
    })

    it('handles 409 error (email or username exists)', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 409 }
        })
      })

      await expect(authService.register('existinguser', 'existing@example.com', 'password123'))
        .rejects.toThrow('auth.emailOrUsernameExists')
    })

    it('handles 400 error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 400 }
        })
      })

      await expect(authService.register('testuser', 'test@example.com', 'password123'))
        .rejects.toThrow('auth.invalidData')
    })

    it('handles 429 error', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 429 }
        })
      })

      await expect(authService.register('testuser', 'test@example.com', 'password123'))
        .rejects.toThrow('auth.tooManyAttempts')
    })
  })

  describe('token management', () => {
    it('sets and gets token', () => {
      authService.setToken('test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
      
      const token = authService.getToken()
      expect(token).toBe('test-token')
    })

    it('clears token', () => {
      authService.logout()
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_data')
    })

    it('checks authentication status', () => {
      // Mock valid token
      ;(localStorage.getItem as jest.Mock).mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE2ODc2NjIwMDAsImV4cCI6MTY4NzY2NjgwMH0.test')
      
      const isAuthenticated = authService.isAuthenticated()
      expect(isAuthenticated).toBe(true)
    })

    it('detects expired token', () => {
      // Mock expired token (timestamp in the past)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE2ODc2NjIwMDAsImV4cCI6MTY3MDAwMDAwMH0.test'
      ;(localStorage.getItem as jest.Mock).mockReturnValue(expiredToken)
      
      const isAuthenticated = authService.isAuthenticated()
      expect(isAuthenticated).toBe(false)
    })

    it('handles invalid token format', () => {
      // Mock invalid token
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-token')
      
      const isAuthenticated = authService.isAuthenticated()
      expect(isAuthenticated).toBe(false)
    })
  })

  describe('current user', () => {
    it('gets current user data', () => {
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser'
      }
      
      ;(localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockUserData))
      
      const user = authService.getCurrentUser()
      expect(user).toEqual(mockUserData)
    })

    it('returns null when no user data', () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)
      
      const user = authService.getCurrentUser()
      expect(user).toBe(null)
    })
  })
})