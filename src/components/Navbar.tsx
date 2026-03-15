import React from 'react'
import { Button } from 'antd'

const Navbar: React.FC = () => {
  const menuItems = [
    { key: '1', label: '首页' },
    { key: '2', label: '功能' },
    { key: '3', label: '课程' },
    { key: '4', label: '关于我们' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">AI语言学习</div>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex space-x-8">
          {menuItems.map(item => (
            <a
              key={item.key}
              href={`#${item.key}`}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300"
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
