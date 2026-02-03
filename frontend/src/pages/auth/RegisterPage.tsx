import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RegisterPageProps {
  onRegisterSuccess: () => void
  onNavigateToLogin: () => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin
}) => {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
  }

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak'
    if (password.length >= 8 && password.length < 12) return 'medium'
    if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
      return 'strong'
    }
    return 'medium'
  }

  const getPasswordStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'weak': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'strong': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getPasswordStrengthText = (strength: string): string => {
    switch (strength) {
      case 'weak': return t('auth.passwordWeak')
      case 'medium': return t('auth.passwordMedium')
      case 'strong': return t('auth.passwordStrong')
      default: return ''
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证输入
    if (!username.trim()) {
      setError(t('auth.usernameRequired'))
      return
    }
    
    if (!validateUsername(username)) {
      setError(t('auth.usernameInvalid'))
      return
    }
    
    if (!email.trim()) {
      setError(t('auth.emailRequired'))
      return
    }
    
    if (!validateEmail(email)) {
      setError(t('auth.emailInvalid'))
      return
    }
    
    if (!password.trim()) {
      setError(t('auth.passwordRequired'))
      return
    }
    
    if (!validatePassword(password)) {
      setError(t('auth.passwordInvalid'))
      return
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: 调用注册API
      console.log('注册请求:', { username, email, password })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 模拟成功响应
      onRegisterSuccess()
    } catch (err) {
      setError(t('auth.registrationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.startYourJourney')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('auth.username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('auth.enterUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && (
                <p className={`mt-1 text-xs ${getPasswordStrengthColor(getPasswordStrength(password))}`}>
                  {getPasswordStrengthText(getPasswordStrength(password))}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? t('auth.registering') : t('auth.signUp')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('auth.signIn')}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}