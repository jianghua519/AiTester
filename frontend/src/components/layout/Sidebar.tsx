import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
  CalendarIcon,
  PlayIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

interface MenuItem {
  id: string
  title: string
  icon: React.ReactNode
  path: string
  children?: MenuItem[]
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  isMobileMenuOpen?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobile = false, isMobileMenuOpen = false }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: t('sidebar.dashboard'),
      icon: <HomeIcon className="h-5 w-5" />,
      path: '/dashboard'
    },
    {
      id: 'testcases',
      title: t('sidebar.testCases'),
      icon: <DocumentTextIcon className="h-5 w-5" />,
      path: '/testcases'
    },
    {
      id: 'testsuites',
      title: t('sidebar.testSuites'),
      icon: <FolderIcon className="h-5 w-5" />,
      path: '/testsuites'
    },
    {
      id: 'testplans',
      title: t('sidebar.testPlans'),
      icon: <CalendarIcon className="h-5 w-5" />,
      path: '/testplans'
    },
    {
      id: 'testruns',
      title: t('sidebar.testRuns'),
      icon: <PlayIcon className="h-5 w-5" />,
      path: '/testruns'
    },
    {
      id: 'settings',
      title: t('sidebar.settings'),
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      path: '/settings'
    }
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:inset-y-auto lg:left-auto ${
      isMobile 
        ? isMobileMenuOpen ? 'w-64' : '-translate-x-full lg:translate-x-0'
        : isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Mobile close button */}
      {isMobile && isMobileMenuOpen && (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AI Tester</h1>
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Desktop header */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">AI Tester</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      )}

      <nav className="mt-6">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  handleMenuClick(item.path)
                  if (isMobile) {
                    closeMobileMenu()
                  }
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="ml-3">{item.title}</span>
                )}
                {isActive(item.path) && !isCollapsed && (
                  <span className="ml-auto">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && !isMobile && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            AI Tester v1.0
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to close mobile menu
const closeMobileMenu = () => {
  // This will be handled by the parent component
}