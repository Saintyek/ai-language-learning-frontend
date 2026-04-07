import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@douyinfe/semi-ui'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
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
        <div className="hidden md:flex space-x-4">
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
        </div>
      </div>
    </header>
  )
}

export default Navbar
