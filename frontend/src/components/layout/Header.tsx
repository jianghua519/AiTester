import React from 'react'
import { BellIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { ProjectSelectorContainer } from './ProjectSelectorContainer'
import { useAuthStore } from '../../store/auth'

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* 左侧：菜单切换按钮 */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 中间：项目选择器 */}
      <div className="flex-1 max-w-2xl mx-8">
        <ProjectSelectorContainer />
      </div>

      {/* 右侧：用户菜单 */}
      <div className="flex items-center space-x-4">
        {/* 通知按钮 */}
        <button className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* 用户菜单 */}
        <div className="relative">
          <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900">{user?.username || '用户名'}</div>
              <div className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</div>
            </div>
          </button>

          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <UserCircleIcon className="h-4 w-4 mr-3" />
              {t('header.profile')}
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Cog6ToothIcon className="h-4 w-4 mr-3" />
              {t('header.settings')}
            </button>
            <hr className="my-1" />
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('header.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}