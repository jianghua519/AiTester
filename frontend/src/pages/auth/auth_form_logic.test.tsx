import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// Mock auth store
const mockAuthStore = {
  login: jest.fn(),
  register: jest.fn()
}

jest.mock('../store/auth', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

describe('LoginPage with Form Logic', () => {
  beforeEach(() => {
    mockAuthStore.login.mockClear()
    mockNavigate.mockClear()
  })

  it('renders login form with React Hook Form', () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage onNavigateToRegister={() => {}} />
      </QueryClientProvider>
    )

    expect(screen.getByText('auth.welcomeBack')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.password')).toBeInTheDocument()
    expect(screen.getByText('auth.signIn')).toBeInTheDocument()
  })

  it('validates email format on submit', async () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage onNavigateToRegister={() => {}} />
      </QueryClientProvider>
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    const passwordInput = screen.getByPlaceholderText('auth.password')
    const submitButton = screen.getByText('auth.signIn')

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.emailInvalid')).toBeInTheDocument()
    })
  })

  it('calls login API on valid form submission', async () => {
    const queryClient = createQueryClient()
    mockAuthStore.login.mockResolvedValueOnce(undefined)

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage onNavigateToRegister={() => {}} />
      </QueryClientProvider>
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    const passwordInput = screen.getByPlaceholderText('auth.password')
    const submitButton = screen.getByText('auth.signIn')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message on login failure', async () => {
    const queryClient = createQueryClient()
    mockAuthStore.login.mockRejectedValueOnce(new Error('auth.loginFailed'))

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage onNavigateToRegister={() => {}} />
      </QueryClientProvider>
    )

    const emailInput = screen.getByPlaceholderText('auth.email')
    const passwordInput = screen.getByPlaceholderText('auth.password')
    const submitButton = screen.getByText('auth.signIn')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.loginFailed')).toBeInTheDocument()
    })
  })
})

describe('RegisterPage with Form Logic', () => {
  beforeEach(() => {
    mockAuthStore.register.mockClear()
    mockNavigate.mockClear()
  })

  it('renders register form with React Hook Form', () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
    )

    expect(screen.getByText('auth.createAccount')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterUsername')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterEmail')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.enterPassword')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.confirmPassword')).toBeInTheDocument()
    expect(screen.getByText('auth.signUp')).toBeInTheDocument()
  })

  it('validates username format on submit', async () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
    )

    const usernameInput = screen.getByPlaceholderText('auth.enterUsername')
    const emailInput = screen.getByPlaceholderText('auth.enterEmail')
    const passwordInput = screen.getByPlaceholderText('auth.enterPassword')
    const confirmPasswordInput = screen.getByPlaceholderText('auth.confirmPassword')
    const submitButton = screen.getByText('auth.signUp')

    fireEvent.change(usernameInput, { target: { value: 'user@name' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.usernameInvalid')).toBeInTheDocument()
    })
  })

  it('validates password strength on submit', async () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
    )

    const usernameInput = screen.getByPlaceholderText('auth.enterUsername')
    const emailInput = screen.getByPlaceholderText('auth.enterEmail')
    const passwordInput = screen.getByPlaceholderText('auth.enterPassword')
    const confirmPasswordInput = screen.getByPlaceholderText('auth.confirmPassword')
    const submitButton = screen.getByText('auth.signUp')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.passwordInvalid')).toBeInTheDocument()
    })
  })

  it('validates password confirmation on submit', async () => {
    const queryClient = createQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
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

  it('calls register API on valid form submission', async () => {
    const queryClient = createQueryClient()
    mockAuthStore.register.mockResolvedValueOnce(undefined)

    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
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
      expect(mockAuthStore.register).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('displays error message on registration failure', async () => {
    const queryClient = createQueryClient()
    mockAuthStore.register.mockRejectedValueOnce(new Error('auth.registrationFailed'))

    render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage onNavigateToLogin={() => {}} />
      </QueryClientProvider>
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
      expect(screen.getByText('auth.registrationFailed')).toBeInTheDocument()
    })
  })
})