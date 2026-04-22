import React from 'react'
import { Button, Dropdown } from '@douyinfe/semi-ui'
import { IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons'
import { languageOptions } from '@/consts/languages'
import 'flag-icons/css/flag-icons.min.css'

interface PracticeDropdownProps {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  onLanguageSelect: (lang: (typeof languageOptions)[0]) => void
}

/**
 * 练习下拉框组件
 * 调用者: index.tsx
 * 用途: 首页"开始练习"下拉框
 */
export function PracticeDropdown({
  visible,
  onVisibleChange,
  onLanguageSelect,
}: PracticeDropdownProps) {
  const items = languageOptions.map(lang => ({
    node: 'item' as const,
    name: lang.label,
    onClick: () => onLanguageSelect(lang),
    icon: <span className={`fi fi-${lang.code} rounded-sm text-lg`} aria-hidden="true" />,
  }))

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      visible={visible}
      onVisibleChange={onVisibleChange}
      menu={items}
    >
      <span>
        <Button
          icon={visible ? <IconChevronUp /> : <IconChevronDown />}
          iconPosition="right"
          theme="borderless"
          style={{ fontSize: '14px' }}
        >
          开始练习
        </Button>
      </span>
    </Dropdown>
  )
}
