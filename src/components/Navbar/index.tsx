import React, { useState, useEffect, useMemo } from 'react'
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthData } from '@/api/auth'
import { languageOptions } from '@/consts/languages'
import ChatHistorySideSheet from '@/components/ChatHistory/ChatHistorySideSheet'
import NoProfileModal from '@/components/ProfileModals/NoProfileModal'
import NoProfilePromptModal from '@/components/ProfileModals/FirstCreateProfileModal'
import UnsavedChangesModal from '@/components/ProfileModals/UnsavedChangesModal'
import LogoutConfirmModal from './components/LogoutConfirmModal'

import { NavigationMenu } from './components/NavigationMenu'
import { PracticeDropdown } from './components/PracticeDropdown'
import { LanguageDropdown } from './components/LanguageDropdown'
import { UserDropdown } from './components/UserDropdown'
import { AuthButtons } from './components/AuthButtons'

import { useAuthState } from './hooks/useAuthState'
import { useProfileState } from './hooks/useProfileState'
import { useScrollSpy } from './hooks/useScrollSpy'

import type { MenuItem, LanguageOption } from './types'

const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // 认证状态
  const { isLoggedIn, username } = useAuthState()

  // 下拉框状态
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false)
  const [userDropdownVisible, setUserDropdownVisible] = useState(false)
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false)
  const [practiceDropdownVisible, setPracticeDropdownVisible] = useState(false)

  // 模态框状态
  const [noProfileModalVisible, setNoProfileModalVisible] = useState(false)
  const [unsavedChangesModalVisible, setUnsavedChangesModalVisible] = useState(false)
  const [logoutConfirmModalVisible, setLogoutConfirmModalVisible] = useState(false)
  const [profilePromptModalVisible, setProfilePromptModalVisible] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption | null>(null)

  // 路由检测
  const isHomePage = location.pathname === '/'
  const chatRouteMatch = matchPath('/:langCode/chat', location.pathname)
  const profileRouteMatch = matchPath('/:langCode/profile', location.pathname)

  // 当前语言
  const currentLanguage = languageOptions.find(
    lang =>
      lang.code === chatRouteMatch?.params.langCode ||
      lang.code === profileRouteMatch?.params.langCode
  )

  // 档案状态
  const { hasProfile, checkProfile } = useProfileState(!!profileRouteMatch, currentLanguage)

  // 导航菜单项
  const menuItems = useMemo<MenuItem[]>(
    () => [
      { key: 'reasons', label: '为什么选择我们', href: '#reasons' },
      { key: 'features', label: '功能', href: '#features' },
      { key: 'languages', label: '语言', href: '#languages' },
      { key: 'courses', label: '课程', href: '#courses' },
      { key: 'feedbacks', label: '用户评价', href: '#feedbacks' },
    ],
    []
  )

  // 滚动监听
  const { activeKey, setActiveKey } = useScrollSpy(menuItems, isHomePage)

  // 处理菜单项点击
  const handleMenuItemClick = (href: string) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: href } })
    } else {
      scrollToSection(href)
    }
  }

  // 滚动到指定区域
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      const navbarHeight = document.querySelector('header')?.offsetHeight || 80
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementTop - navbarHeight,
        behavior: 'smooth',
      })
    }
  }

  // 从其他页面跳转到首页时滚动
  useEffect(() => {
    if (location.pathname === '/' && (location.state as any)?.scrollTo) {
      scrollToSection((location.state as any).scrollTo)
    }
  }, [location.pathname, location.state])

  // 退出登录
  const handleLogout = () => {
    setUserDropdownVisible(false)
    setLogoutConfirmModalVisible(true)
  }

  const handleConfirmLogout = () => {
    clearAuthData()
    window.dispatchEvent(new Event('authChange'))
    setLogoutConfirmModalVisible(false)
    navigate('/')
  }

  // 打开聊天记录
  const handleOpenChatHistory = () => {
    setUserDropdownVisible(false)
    setChatHistoryVisible(true)
  }

  // 返回学习
  const handleReturnToLearning = () => {
    setUserDropdownVisible(false)
    if (hasProfile === false) {
      setNoProfileModalVisible(true)
    } else {
      setUnsavedChangesModalVisible(true)
    }
  }

  // 跳过档案设置
  const handleSkipProfile = () => {
    setNoProfileModalVisible(false)
    if (currentLanguage) {
      navigate(`/${currentLanguage.code}/chat`)
    }
  }

  // 返回聊天
  const handleReturnToChat = () => {
    setUnsavedChangesModalVisible(false)
    if (currentLanguage) {
      const fromPath = location.state?.from
      navigate(fromPath || `/${currentLanguage.code}/chat`)
    }
  }

  // 选择语言
  const handleLanguageSelect = async (lang: LanguageOption) => {
    setLanguageDropdownVisible(false)
    setPracticeDropdownVisible(false)

    const hasProfileData = await checkProfile(lang.code)
    if (!hasProfileData) {
      setSelectedLanguage(lang)
      setProfilePromptModalVisible(true)
    } else {
      navigate(`/${lang.code}/chat`)
    }
  }

  // 创建档案
  const handlePromptCreateProfile = () => {
    setProfilePromptModalVisible(false)
    if (selectedLanguage) {
      navigate(`/${selectedLanguage.code}/profile`)
    }
  }

  // 跳过创建档案
  const handlePromptSkipProfile = () => {
    setProfilePromptModalVisible(false)
    if (selectedLanguage) {
      navigate(`/${selectedLanguage.code}/chat`)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white shadow-sm">
      <div className="container mx-auto h-full px-4 relative flex justify-center items-center">
        <Link to="/" className="absolute left-4 text-2xl font-bold text-blue-600">
          AI语言学习
        </Link>

        <NavigationMenu
          menuItems={menuItems}
          activeKey={activeKey}
          onMenuItemClick={handleMenuItemClick}
        />

        <div className="hidden md:flex items-center space-x-3 absolute right-4">
          {isHomePage && (
            <PracticeDropdown
              visible={practiceDropdownVisible}
              onVisibleChange={setPracticeDropdownVisible}
              onLanguageSelect={handleLanguageSelect}
            />
          )}

          {isLoggedIn ? (
            <>
              <LanguageDropdown
                currentLanguage={currentLanguage}
                visible={languageDropdownVisible}
                onVisibleChange={setLanguageDropdownVisible}
                onLanguageSelect={handleLanguageSelect}
                isProfilePage={!!profileRouteMatch}
                navigate={navigate}
              />
              <UserDropdown
                username={username}
                visible={userDropdownVisible}
                onVisibleChange={setUserDropdownVisible}
                onLogout={handleLogout}
                onOpenChatHistory={handleOpenChatHistory}
                hasProfile={hasProfile}
                onReturnToLearning={handleReturnToLearning}
              />
            </>
          ) : (
            <AuthButtons onClearActive={() => setActiveKey('')} />
          )}
        </div>
      </div>

      {/* 侧边栏和模态框 */}
      <ChatHistorySideSheet
        visible={chatHistoryVisible}
        onClose={() => setChatHistoryVisible(false)}
      />

      <NoProfileModal
        visible={noProfileModalVisible}
        languageLabel={currentLanguage?.label || ''}
        onSkip={handleSkipProfile}
        onReturn={() => setNoProfileModalVisible(false)}
      />

      <UnsavedChangesModal
        visible={unsavedChangesModalVisible}
        onConfirm={handleReturnToChat}
        onCancel={() => setUnsavedChangesModalVisible(false)}
      />

      <NoProfilePromptModal
        visible={profilePromptModalVisible}
        languageLabel={selectedLanguage?.label || ''}
        onCreate={handlePromptCreateProfile}
        onSkip={handlePromptSkipProfile}
      />

      <LogoutConfirmModal
        visible={logoutConfirmModalVisible}
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirmModalVisible(false)}
      />
    </header>
  )
}

export default Navbar
