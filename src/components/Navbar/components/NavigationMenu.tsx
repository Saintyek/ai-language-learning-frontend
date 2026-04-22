import { Link } from 'react-router-dom'
import type { MenuItem } from '../types'

interface NavigationMenuProps {
  menuItems: MenuItem[]
  activeKey: string
  onMenuItemClick: (href: string) => void
}

/**
 * 导航菜单组件
 * 调用者: index.tsx
 * 用途: 渲染导航菜单项
 */
export function NavigationMenu({ menuItems, activeKey, onMenuItemClick }: NavigationMenuProps) {
  return (
    <nav className="hidden md:flex space-x-8">
      {menuItems.map(item => (
        <Link
          key={item.key}
          to="/"
          state={{ scrollTo: item.href }}
          onClick={e => {
            e.preventDefault()
            onMenuItemClick(item.href)
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
  )
}
