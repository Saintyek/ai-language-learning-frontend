import { useState, useEffect } from 'react'
import { getUserInfo, isAuthenticated } from '@/api/auth'

export interface AuthState {
  isLoggedIn: boolean
  username: string
}

/**
 * 认证状态管理 hook
 * 调用者: index.tsx
 * 用途: 管理用户登录状态和用户名
 */
export function useAuthState(): AuthState {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

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
    window.addEventListener('storage', checkAuth)
    window.addEventListener('authChange', checkAuth)
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authChange', checkAuth)
    }
  }, [])

  return { isLoggedIn, username }
}
