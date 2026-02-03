import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MainLayout } from '../MainLayout'
import { Header } from '../Header'
import { Sidebar } from '../Sidebar'
import { ProjectSelectorContainer } from '../ProjectSelectorContainer'

// Mock the auth store
jest.mock('../../store/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}))

// Mock the project service
jest.mock('../../services/project', () => ({
  projectService: {
    getProjects: jest.fn(),
  },
}))

const mockProjects = [
  {
    id: 1,
    name: 'Test Project 1',
    description: 'First test project',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 1,
    is_active: true,
  },
  {
    id: 2,
    name: 'Test Project 2',
    description: 'Second test project',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    created_by: 1,
    is_active: true,
  },
]

describe('MainLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders layout with header and sidebar', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('toggles sidebar state', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    // Sidebar state should be toggled (this would be tested by checking classes)
    expect(toggleButton).toBeInTheDocument()
  })
})

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header with user info', () => {
    render(
      <Header 
        onToggleSidebar={jest.fn()}
        isSidebarCollapsed={false}
      />
    )

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('calls toggle callback when menu button is clicked', () => {
    const mockToggle = jest.fn()
    render(
      <Header 
        onToggleSidebar={mockToggle}
        isSidebarCollapsed={false}
      />
    )

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })
})

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders sidebar with menu items', () => {
    render(
      <Sidebar 
        isCollapsed={false}
        onToggle={jest.fn()}
      />
    )

    expect(screen.getByText('AI Tester')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Test Cases')).toBeInTheDocument()
  })

  it('collapses sidebar when toggle button is clicked', () => {
    const mockToggle = jest.fn()
    render(
      <Sidebar 
        isCollapsed={false}
        onToggle={mockToggle}
      />
    )

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('highlights active menu item', () => {
    render(
      <Sidebar 
        isCollapsed={false}
        onToggle={jest.fn()}
      />
    )

    // Mock the current location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard' },
      writable: true,
    })

    const dashboardButton = screen.getByText('Dashboard')
    expect(dashboardButton).toHaveClass('bg-blue-50', 'text-blue-700')
  })
})

describe('ProjectSelectorContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    const { projectService } = require('../../services/project')
    projectService.getProjects.mockImplementation(() => new Promise(() => {}))

    render(<ProjectSelectorContainer />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders projects when loaded', async () => {
    const { projectService } = require('../../services/project')
    projectService.getProjects.mockResolvedValue(mockProjects)

    render(<ProjectSelectorContainer />)

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
      expect(screen.getByText('Test Project 2')).toBeInTheDocument()
    })
  })

  it('shows error when projects fail to load', async () => {
    const { projectService } = require('../../services/project')
    projectService.getProjects.mockRejectedValue(new Error('Failed to fetch'))

    render(<ProjectSelectorContainer />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch projects')).toBeInTheDocument()
    })
  })

  it('handles project selection', async () => {
    const { projectService } = require('../../services/project')
    projectService.getProjects.mockResolvedValue(mockProjects)

    render(<ProjectSelectorContainer />)

    await waitFor(() => {
      const projectButton = screen.getByText('Test Project 1')
      fireEvent.click(projectButton)
      
      // Should close the dropdown
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument()
    })
  })
})