import React from 'react'
import { Button, Dropdown } from '@douyinfe/semi-ui'
import { IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons'
import { languageOptions } from '@/consts/languages'
import 'flag-icons/css/flag-icons.min.css'

interface LanguageDropdownProps {
  currentLanguage: (typeof languageOptions)[0] | undefined
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  onLanguageSelect: (lang: (typeof languageOptions)[0]) => void
  isProfilePage: boolean
  navigate: (path: string) => void
}

/**
 * 语言下拉框组件
 * 调用者: index.tsx
 * 用途: 语言切换下拉框
 */
export function LanguageDropdown({
  currentLanguage,
  visible,
  onVisibleChange,
  onLanguageSelect,
  isProfilePage,
  navigate,
}: LanguageDropdownProps) {
  if (!currentLanguage) return null

  const items = languageOptions
    .filter(lang => lang.code !== currentLanguage.code)
    .map(lang => ({
      node: 'item' as const,
      name: lang.label,
      onClick: () => {
        onVisibleChange(false)
        if (isProfilePage) {
          navigate(`/${lang.code}/profile`)
        } else {
          onLanguageSelect(lang)
        }
      },
      icon: <span className={`fi fi-${lang.code} rounded-sm text-lg`} aria-hidden="true" />,
    }))

  return (
    <Dropdown
      trigger="click"
      position="bottom"
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
          <span className="flex items-center gap-2">
            <span
              className={`fi fi-${currentLanguage.code} rounded-sm text-xl`}
              aria-hidden="true"
            />
          </span>
        </Button>
      </span>
    </Dropdown>
  )
}
