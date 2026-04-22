import React from 'react'
import { Button, Dropdown } from '@douyinfe/semi-ui'
import {
  IconChevronDown,
  IconChevronUp,
  IconHistory,
  IconReply,
  IconBackward,
  IconUser,
} from '@douyinfe/semi-icons'
import { useLocation, useNavigate } from 'react-router-dom'

interface UserDropdownProps {
  username: string
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  onLogout: () => void
  onOpenChatHistory: () => void
  hasProfile: boolean | null
  onReturnToLearning: () => void
}

/**
 * 用户下拉框组件
 * 调用者: index.tsx
 * 用途: 用户菜单下拉框（学习档案、聊天记录、退出登录）
 */
export function UserDropdown({
  username,
  visible,
  onVisibleChange,
  onLogout,
  onOpenChatHistory,
  hasProfile,
  onReturnToLearning,
}: UserDropdownProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isProfilePage = location.pathname.includes('/profile')
  const currentLangCode = location.pathname.split('/')[1] || 'us'

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      visible={visible}
      onVisibleChange={onVisibleChange}
      render={
        <Dropdown.Menu>
          {isProfilePage ? (
            <Dropdown.Item onClick={onReturnToLearning}>
              <div className="flex items-center gap-2">
                <IconBackward />
                <span>返回学习</span>
              </div>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              onClick={() => {
                onVisibleChange(false)
                const fromPath = location.pathname + location.search
                navigate(`/${currentLangCode}/profile`, { state: { from: fromPath } })
              }}
            >
              <div className="flex items-center gap-2">
                <IconUser />
                <span>学习档案</span>
              </div>
            </Dropdown.Item>
          )}
          <Dropdown.Item onClick={onOpenChatHistory}>
            <div className="flex items-center gap-2">
              <IconHistory />
              <span>聊天记录</span>
            </div>
          </Dropdown.Item>
          <Dropdown.Item onClick={onLogout}>
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
          icon={visible ? <IconChevronUp /> : <IconChevronDown />}
          iconPosition="right"
          theme="borderless"
          style={{ fontSize: '14px' }}
        >
          你好, {username}
        </Button>
      </span>
    </Dropdown>
  )
}
