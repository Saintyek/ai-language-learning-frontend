import React, { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown } from '@douyinfe/semi-ui'
import {
  IconChevronDown,
  IconChevronUp,
  IconHistory,
  IconReply,
  IconBackward,
  IconUser,
} from '@douyinfe/semi-icons'
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { getUserInfo, isAuthenticated, clearAuthData } from '@/api/auth'
import { languageOptions } from '@/consts/languages'
import { getProfile } from '@/api/profile'
import ChatHistorySideSheet from '@/components/ChatHistory/ChatHistorySideSheet'
import NoProfileModal from '@/components/ProfileModals/NoProfileModal'
import UnsavedChangesModal from '@/components/ProfileModals/UnsavedChangesModal'
import 'flag-icons/css/flag-icons.min.css'

const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false)
  const [userDropdownVisible, setUserDropdownVisible] = useState(false)

  // 语言下拉框状态
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false)
  // 首页"开始练习"下拉框状态
  const [practiceDropdownVisible, setPracticeDropdownVisible] = useState(false)

  // Profile 页面相关状态
  const [noProfileModalVisible, setNoProfileModalVisible] = useState(false)
  const [unsavedChangesModalVisible, setUnsavedChangesModalVisible] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  // 检测当前页面类型
  const isHomePage = location.pathname === '/'
  const chatRouteMatch = matchPath('/:langCode/chat', location.pathname)
  const profileRouteMatch = matchPath('/:langCode/profile', location.pathname)

  // 当前语言（聊天页面或档案页面）
  const currentLanguage = languageOptions.find(
    lang =>
      lang.code === chatRouteMatch?.params.langCode ||
      lang.code === profileRouteMatch?.params.langCode
  )

  // 档案页面时检查是否有档案
  useEffect(() => {
    if (profileRouteMatch && currentLanguage) {
      const checkProfile = async () => {
        try {
          const response = await getProfile(currentLanguage.code)
          setHasProfile(response.data !== null)
        } catch {
          setHasProfile(false)
        }
      }
      checkProfile()
    } else {
      setHasProfile(null)
    }
  }, [profileRouteMatch, currentLanguage])
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isAuthenticated()
      setIsLoggedIn(loggedIn)
      if (loggedIn) {
        const userInfo = getUserInfo()
        if (userInfo) {
          setUsername(userInfo.username)
        }
      }
    }
    checkAuth()
    // 监听 storage 事件，以便在其他标签页登录/退出时更新状态
    window.addEventListener('storage', checkAuth)
    // 监听登录/退出事件
    window.addEventListener('authChange', checkAuth)
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authChange', checkAuth)
    }
  }, [])

  const menuItems = useMemo(
    () => [
      { key: 'reasons', label: '为什么选择我们', href: '#reasons' },
      { key: 'features', label: '功能', href: '#features' },
      { key: 'languages', label: '语言', href: '#languages' },
      { key: 'courses', label: '课程', href: '#courses' },
      { key: 'feedbacks', label: '用户评价', href: '#feedbacks' },
    ],
    []
  )

  const [activeKey, setActiveKey] = useState('')

  // 语言下拉框选项 - 根据当前页面类型决定跳转目标
  const languageDropdownItems = languageOptions
    .filter(lang => lang.code !== currentLanguage?.code)
    .map(lang => ({
      node: 'item' as const,
      name: lang.label,
      onClick: () => {
        // Profile 页面时跳转到对应语言的档案页面，否则跳转到聊天页面
        if (profileRouteMatch) {
          navigate(`/${lang.code}/profile`)
        } else {
          navigate(`/${lang.code}/chat`)
        }
      },
      icon: <span className={`fi fi-${lang.code} rounded-sm text-lg`} aria-hidden="true" />,
    }))

  // 首页开始练习下拉框选项
  const practiceDropdownItems = languageOptions.map(lang => ({
    node: 'item' as const,
    name: lang.label,
    onClick: () => navigate(`/${lang.code}/chat`),
    icon: <span className={`fi fi-${lang.code} rounded-sm text-lg`} aria-hidden="true" />,
  }))

  // 退出登录
  const handleLogout = () => {
    clearAuthData()
    setIsLoggedIn(false)
    setUsername('')
    // 触发退出登录事件
    window.dispatchEvent(new Event('authChange'))
    navigate('/')
  }

  // 打开聊天记录侧边栏
  const handleOpenChatHistory = () => {
    setUserDropdownVisible(false)
    setChatHistoryVisible(true)
  }

  // 返回学习（替代原来的个人档案）
  const handleReturnToLearning = () => {
    setUserDropdownVisible(false)
    // 根据是否有档案显示不同模态框
    if (hasProfile === false) {
      setNoProfileModalVisible(true)
    } else {
      setUnsavedChangesModalVisible(true)
    }
  }

  // 从档案页面跳过设置，直接进入聊天
  const handleSkipProfile = () => {
    setNoProfileModalVisible(false)
    if (currentLanguage) {
      navigate(`/${currentLanguage.code}/chat`)
    }
  }

  // 从档案页面返回之前的聊天页面
  const handleReturnToChat = () => {
    setUnsavedChangesModalVisible(false)
    if (currentLanguage) {
      // 检查是否有来源页面信息
      const fromPath = location.state?.from
      if (fromPath) {
        navigate(fromPath)
      } else {
        navigate(`/${currentLanguage.code}/chat`)
      }
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      // 滚动时收起所有下拉框
      setLanguageDropdownVisible(false)
      setUserDropdownVisible(false)
      setPracticeDropdownVisible(false)

      // 只在首页时监听滚动更新菜单高亮
      if (location.pathname === '/') {
        const scrollPosition = window.scrollY + 100

        for (const item of menuItems) {
          const element = document.getElementById(item.key)
          if (element) {
            const { offsetTop, offsetHeight } = element
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveKey(item.key)
              break
            }
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化时检查一次

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [menuItems, location.pathname])

  const handleMenuItemClick = (href: string) => {
    // 如果当前不在首页，先跳转到首页，然后滚动到指定位置
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: href } })
    } else {
      // 在首页时，直接滚动到指定位置
      scrollToSection(href)
    }
  }

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      // 计算Navbar的高度
      const navbarHeight = document.querySelector('header')?.offsetHeight || 80
      // 计算元素的顶部位置
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset
      // 滚动到元素顶部减去Navbar高度的位置
      window.scrollTo({
        top: elementTop - navbarHeight,
        behavior: 'smooth',
      })
    }
  }

  // 当从其他页面跳转到首页时，滚动到指定位置
  useEffect(() => {
    if (location.pathname === '/' && location.state && (location.state as any).scrollTo) {
      const scrollTo = (location.state as any).scrollTo
      scrollToSection(scrollTo)
    }
  }, [location.pathname, location.state])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white shadow-sm">
      <div className="container mx-auto h-full px-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          AI语言学习
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex space-x-8">
          {menuItems.map(item => (
            <Link
              key={item.key}
              to="/"
              state={{ scrollTo: item.href }}
              onClick={e => {
                e.preventDefault()
                handleMenuItemClick(item.href)
              }}
              className={`transition-colors duration-300 ${
                activeKey === item.key
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 登录/注册按钮 */}
        <div className="hidden md:flex items-center space-x-3">
          {isHomePage ? (
            <Dropdown
              trigger="click"
              position="bottomRight"
              visible={practiceDropdownVisible}
              onVisibleChange={visible => setPracticeDropdownVisible(visible)}
              menu={practiceDropdownItems}
            >
              <span>
                <Button
                  icon={practiceDropdownVisible ? <IconChevronUp /> : <IconChevronDown />}
                  iconPosition="right"
                  theme="borderless"
                  style={{ fontSize: '14px' }}
                >
                  开始练习
                </Button>
              </span>
            </Dropdown>
          ) : null}
          {isLoggedIn ? (
            <>
              {currentLanguage ? (
                <Dropdown
                  trigger="click"
                  position="bottom"
                  visible={languageDropdownVisible}
                  onVisibleChange={visible => setLanguageDropdownVisible(visible)}
                  menu={languageDropdownItems}
                >
                  <span>
                    <Button
                      icon={languageDropdownVisible ? <IconChevronUp /> : <IconChevronDown />}
                      iconPosition="right"
                      theme="borderless"
                      style={{ fontSize: '14px' }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`fi fi-${currentLanguage.code} rounded-sm text-xl`}
                          aria-hidden="true"
                        />
                      </span>
                    </Button>
                  </span>
                </Dropdown>
              ) : null}
              <Dropdown
                trigger="click"
                position="bottomRight"
                visible={userDropdownVisible}
                onVisibleChange={visible => setUserDropdownVisible(visible)}
                render={
                  <Dropdown.Menu>
                    {profileRouteMatch ? (
                      <Dropdown.Item onClick={handleReturnToLearning}>
                        <div className="flex items-center gap-2">
                          <IconBackward />
                          <span>返回学习</span>
                        </div>
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item
                        onClick={() => {
                          setUserDropdownVisible(false)
                          const targetLang = currentLanguage?.code || 'us'
                          navigate(`/${targetLang}/profile`, { state: { from: location.pathname } })
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <IconUser />
                          <span>学习档案</span>
                        </div>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={handleOpenChatHistory}>
                      <div className="flex items-center gap-2">
                        <IconHistory />
                        <span>聊天记录</span>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>
                      <div className="flex items-center gap-2">
                        <IconReply />
                        <span>退出登录</span>
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <span>
                  <Button
                    icon={userDropdownVisible ? <IconChevronUp /> : <IconChevronDown />}
                    iconPosition="right"
                    theme="borderless"
                    style={{ fontSize: '14px' }}
                  >
                    你好, {username}
                  </Button>
                </span>
              </Dropdown>
            </>
          ) : (
            <>
              <Button
                theme="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() => {
                  // 清空导航栏选中样式
                  setActiveKey('')
                  // 立即重置页面滚动位置，不使用平滑滚动
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  // 延迟导航，确保状态更新
                  setTimeout(() => {
                    navigate('/login')
                  }, 10)
                }}
              >
                登录
              </Button>
              <Button
                theme="solid"
                type="primary"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // 清空导航栏选中样式
                  setActiveKey('')
                  // 立即重置页面滚动位置，不使用平滑滚动
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  // 延迟导航，确保状态更新
                  setTimeout(() => {
                    navigate('/register')
                  }, 10)
                }}
              >
                注册
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 聊天记录侧边栏 */}
      <ChatHistorySideSheet
        visible={chatHistoryVisible}
        onClose={() => setChatHistoryVisible(false)}
      />

      {/* Profile 页面相关模态框 */}
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
    </header>
  )
}

export default Navbar
