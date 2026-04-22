import React from 'react'
import { Radio, RadioGroup, Typography, Row, Col } from '@douyinfe/semi-ui'
import type { LanguageLevel } from '@/api/profile'

const { Text } = Typography

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
      <Row gutter={[12, 12]}>
        {levelOptions.map(option => (
          <Col key={option.value} span={12}>
            <Radio value={option.value}>
              <div style={{ padding: '8px 0' }}>
                <Text strong>{option.label}</Text>
                <Text size="small" type="tertiary" style={{ display: 'block', marginTop: 4 }}>
                  {option.description}
                </Text>
              </div>
            </Radio>
          </Col>
        ))}
      </Row>
    </RadioGroup>
  )
}

export default LevelSelector
