import React from 'react'
import { Checkbox, CheckboxGroup } from '@douyinfe/semi-ui'

interface TagSelectorProps {
  type: 'motivation' | 'goal' | 'dailyTime'
  value: string[]
  onChange: (value: string[]) => void
}

const motivationOptions = [
  { value: 'work', label: '工作需要', extra: '职业场景中的语言应用' },
  { value: 'travel', label: '旅游出行', extra: '旅行中的实用交流' },
  { value: 'exam', label: '考试认证', extra: '准备语言考试或认证' },
  { value: 'career', label: '职业发展', extra: '提升职场竞争力' },
  { value: 'entertainment', label: '影视娱乐', extra: '欣赏原版影视作品' },
  { value: 'interest', label: '个人兴趣', extra: '探索语言文化魅力' },
]

const goalOptions = [
  { value: 'speaking', label: '口语表达', extra: '提升日常会话能力' },
  { value: 'listening', label: '听力理解', extra: '听懂各种语速和口音' },
  { value: 'reading', label: '阅读能力', extra: '阅读原版书籍文章' },
  { value: 'writing', label: '写作能力', extra: '书面表达清晰流畅' },
  { value: 'vocabulary', label: '词汇语法', extra: '扩大词汇量掌握语法' },
]

const dailyTimeOptions = [
  { value: '15min', label: '15分钟', extra: '碎片时间学习' },
  { value: '30min', label: '30分钟', extra: '适度投入' },
  { value: '1hour', label: '1小时', extra: '稳定学习节奏' },
  { value: '1hour+', label: '1小时+', extra: '深度沉浸学习' },
]

const TagSelector: React.FC<TagSelectorProps> = ({ type, value, onChange }) => {
  const options =
    type === 'motivation' ? motivationOptions : type === 'goal' ? goalOptions : dailyTimeOptions
  const isSingle = type === 'dailyTime'

  if (isSingle) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange([option.value])}
            className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all ${
              value.includes(option.value)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="font-medium text-gray-800">{option.label}</span>
            <span className="text-xs text-gray-500 mt-1">{option.extra}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <CheckboxGroup value={value} onChange={onChange} style={{ width: '100%' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map(option => (
          <Checkbox key={option.value} value={option.value}>
            <div className="flex flex-col items-start py-1">
              <span className="font-medium text-gray-800">{option.label}</span>
              <span className="text-xs text-gray-500 mt-1">{option.extra}</span>
            </div>
          </Checkbox>
        ))}
      </div>
    </CheckboxGroup>
  )
}

export default TagSelector
