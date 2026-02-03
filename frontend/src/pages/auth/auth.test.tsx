import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('LoginPage', () => {
  const mockOnLoginSuccess = jest.fn()
  const mockOnNavigateToRegister = jest.fn()

  beforeEach(() => {
    mockOnLoginSuccess.mockClear()
    mockOnNavigateToRegister.mockClear()
  })

  it('renders login form correctly', () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    expect(screen.getByText('auth.welcomeBack')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.password')).toBeInTheDocument()
    expect(screen.getByText('auth.signIn')).toBeInTheDocument()
  })

  it('shows error for empty email', async () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    const submitButton = screen.getByText('auth.signIn')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.emailRequired')).toBeInTheDocument()
    })
  })

  it('shows error for invalid email format', async () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    const submitButton = screen.getByText('auth.signIn')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.emailInvalid')).toBeInTheDocument()
    })
  })

  it('shows error for empty password', async () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    const submitButton = screen.getByText('auth.signIn')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.passwordRequired')).toBeInTheDocument()
    })
  })

  it('calls onLoginSuccess on successful login', async () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    const passwordInput = screen.getByPlaceholderText('auth.password')
    const submitButton = screen.getByText('auth.signIn')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(expect.stringContaining('mock-jwt-token-'))
    })
  })

  it('navigates to register page when clicking sign up link', () => {
    render(
      <LoginPage 
        onLoginSuccess={mockOnLoginSuccess} 
        onNavigateToRegister={mockOnNavigateToRegister} 
      />
    )

    const signUpLink = screen.getByText('auth.signUp')
    fireEvent.click(signUpLink)

    expect(mockOnNavigateToRegister).toHaveBeenCalled()
  })
})

describe('RegisterPage', () => {
  const mockOnRegisterSuccess = jest.fn()
  const mockOnNavigateToLogin = jest.fn()

  beforeEach(() => {
    mockOnRegisterSuccess.mockClear()
    mockOnNavigateToLogin.mockClear()
  })

  it('renders register form correctly', () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    expect(screen.getByText('auth.createAccount')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterUsername')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterEmail')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterPassword')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.confirmPassword')).toBeInTheDocument()
    expect(screen.getByText('auth.signUp')).toBeInTheDocument()
  })

  it('shows error for empty username', async () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    const submitButton = screen.getByText('auth.signUp')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.usernameRequired')).toBeInTheDocument()
    })
  })

  it('shows error for invalid username format', async () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    const usernameInput = screen.getByPlaceholderText('auth.enterUsername')
    fireEvent.change(usernameInput, { target: { value: 'user@name' } })
    
    const submitButton = screen.getByText('auth.signUp')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.usernameInvalid')).toBeInTheDocument()
    })
  })

  it('shows error for password mismatch', async () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    const usernameInput = screen.getByPlaceholderText('auth.enterUsername')
    const emailInput = screen.getByPlaceholderText('auth.enterEmail')
    const passwordInput = screen.getByPlaceholderText('auth.enterPassword')
    const confirmPasswordInput = screen.getByPlaceholderText('auth.confirmPassword')
    const submitButton = screen.getByText('auth.signUp')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.passwordMismatch')).toBeInTheDocument()
    })
  })

  it('calls onRegisterSuccess on successful registration', async () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    const usernameInput = screen.getByPlaceholderText('auth.enterUsername')
    const emailInput = screen.getByPlaceholderText('auth.enterEmail')
    const passwordInput = screen.getByPlaceholderText('auth.enterPassword')
    const confirmPasswordInput = screen.getByPlaceholderText('auth.confirmPassword')
    const submitButton = screen.getByText('auth.signUp')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnRegisterSuccess).toHaveBeenCalled()
    })
  })

  it('navigates to login page when clicking sign in link', () => {
    render(
      <RegisterPage 
        onRegisterSuccess={mockOnRegisterSuccess} 
        onNavigateToLogin={mockOnNavigateToLogin} 
      />
    )

    const signInLink = screen.getByText('auth.signIn')
    fireEvent.click(signInLink)

    expect(mockOnNavigateToLogin).toHaveBeenCalled()
  })
})