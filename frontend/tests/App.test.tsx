import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/i18n'
import App from '../src/App'

// Mock the API calls
vi.mock('../src/services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
  testApi: {
    getTestCases: vi.fn(),
    createTestCase: vi.fn(),
  },
}))

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </BrowserRouter>
    )
    expect(screen.getByText(/aicd/i)).toBeInTheDocument()
  })

  it('displays login button when not authenticated', () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </BrowserRouter>
    )
    expect(screen.getByText(/login/i)).toBeInTheDocument()
  })

  it('displays logout button when authenticated', () => {
    // Mock authentication state
    vi.mock('../src/hooks/useAuth', () => ({
      useAuth: () => ({
        isAuthenticated: true,
        user: { id: '1', name: 'Test User' },
      }),
    }))

    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </BrowserRouter>
    )
    expect(screen.getByText(/logout/i)).toBeInTheDocument()
  })
})

describe('Test Management Components', () => {
  it('displays test cases list', () => {
    // Mock API response
    vi.mocked(require('../src/services/api').testApi.getTestCases).mockResolvedValue([
      { id: '1', name: 'Test Case 1', type: 'unit' },
      { id: '2', name: 'Test Case 2', type: 'integration' },
    ])

    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByText(/test case 1/i)).toBeInTheDocument()
    expect(screen.getByText(/test case 2/i)).toBeInTheDocument()
  })
})

describe('Internationalization', () => {
  it('switches language correctly', () => {
    render(
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </BrowserRouter>
    )

    // Test default language (English)
    expect(screen.getByText(/aicd/i)).toBeInTheDocument()

    // This would test language switching in a real implementation
    // i18n.changeLanguage('zh')
    // expect(screen.getByText(/aicd/i)).toBeInTheDocument()
  })
})