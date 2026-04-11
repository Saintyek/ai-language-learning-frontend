import React, { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown } from '@douyinfe/semi-ui'
import { IconChevronDown } from '@douyinfe/semi-icons'
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { getUserInfo, isAuthenticated, clearAuthData } from '@/api/auth'
import { languageOptions } from '@/consts/languages'
import 'flag-icons/css/flag-icons.min.css'

const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  // 检查登录状态
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

  const chatRouteMatch = matchPath('/:langCode/chat', location.pathname)
  const currentLanguage = languageOptions.find(lang => lang.code === chatRouteMatch?.params.langCode)
  const languageDropdownItems = languageOptions
    .filter(lang => lang.code !== currentLanguage?.code)
    .map(lang => ({
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

  useEffect(() => {
    const handleScroll = () => {
      // 只在首页时监听滚动
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
          {isLoggedIn ? (
            <>
              {currentLanguage ? (
                <Dropdown
                  trigger="click"
                  position="bottomRight"
                  menu={languageDropdownItems}
                >
                  <span>
                    <Button
                      icon={<IconChevronDown />}
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
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleLogout}>退出登录</Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <span>
                  <Button
                    icon={<IconChevronDown />}
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
    </header>
  )
}

export default Navbar
