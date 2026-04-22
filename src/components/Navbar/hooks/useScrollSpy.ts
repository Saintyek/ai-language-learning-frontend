import { useState, useEffect } from 'react'
import type { MenuItem } from '../types'

/**
 * 滚动监听 hook
 * 调用者: index.tsx
 * 用途: 监听页面滚动并更新菜单高亮状态
 */
export function useScrollSpy(menuItems: MenuItem[], isHomePage: boolean) {
  const [activeKey, setActiveKey] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      if (isHomePage) {
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
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [menuItems, isHomePage])

  return { activeKey, setActiveKey }
}
