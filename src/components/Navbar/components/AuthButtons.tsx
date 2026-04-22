import React from 'react'
import { Button } from '@douyinfe/semi-ui'
import { useNavigate } from 'react-router-dom'

interface AuthButtonsProps {
  onClearActive: () => void
}

/**
 * 认证按钮组件
 * 调用者: index.tsx
 * 用途: 未登录时显示的登录/注册按钮
 */
export function AuthButtons({ onClearActive }: AuthButtonsProps) {
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    onClearActive()
    window.scrollTo({ top: 0, behavior: 'instant' })
    setTimeout(() => navigate(path), 10)
  }

  return (
    <>
      <Button
        theme="outline"
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
        onClick={() => handleNavigate('/login')}
      >
        登录
      </Button>
      <Button
        theme="solid"
        type="primary"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleNavigate('/register')}
      >
        注册
      </Button>
    </>
  )
}
