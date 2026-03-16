import React, { useState, useEffect, useMemo } from 'react'
import { Button } from 'antd'

const Navbar: React.FC = () => {
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

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化时检查一次

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [menuItems])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">AI语言学习</div>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex space-x-8">
          {menuItems.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`transition-colors duration-300 ${
                activeKey === item.key
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 登录/注册按钮 */}
        <div className="hidden md:flex space-x-4">
          <Button className="text-blue-600 border-blue-600 hover:bg-blue-50">登录</Button>
          <Button type="primary" className="bg-blue-600 hover:bg-blue-700">
            注册
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
