import React from 'react'
import { Radio, RadioGroup } from '@douyinfe/semi-ui'
import type { LanguageLevel } from '@/api/profile'

interface LevelSelectorProps {
  value: LanguageLevel
  onChange: (value: LanguageLevel) => void
}

const levelOptions: { value: LanguageLevel; label: string; description: string }[] = [
  { value: 'beginner', label: '初学者', description: '刚开始学习，掌握基础词汇和简单句型' },
  { value: 'intermediate', label: '中级', description: '能进行日常对话，理解常见话题' },
  { value: 'advanced', label: '高级', description: '流利表达，能讨论复杂话题' },
  { value: 'master', label: '精通', description: '接近母语水平，精通语言文化' },
]

const LevelSelector: React.FC<LevelSelectorProps> = ({ value, onChange }) => {
  return (
    <RadioGroup
      type="button"
      value={value}
      onChange={e => onChange(e.target.value as LanguageLevel)}
      style={{ width: '100%' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levelOptions.map(option => (
          <Radio key={option.value} value={option.value}>
            <div className="flex flex-col items-start py-2">
              <span className="font-medium text-gray-800">{option.label}</span>
              <span className="text-xs text-gray-500 mt-1">{option.description}</span>
            </div>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

export default LevelSelector
