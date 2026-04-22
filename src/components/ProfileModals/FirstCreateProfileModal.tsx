import React from 'react'
import { Modal, Button, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

interface NoProfilePromptModalProps {
  visible: boolean
  languageLabel: string
  onCreate: () => void
  onSkip: () => void
}

/**
 * 用户首次进入对话页面但没有该语言学习档案时显示的提示模态框
 */
const NoProfilePromptModal: React.FC<NoProfilePromptModalProps> = ({
  visible,
  languageLabel,
  onCreate,
  onSkip,
}) => {
  return (
    <Modal
      title="创建学习档案"
      visible={visible}
      closable={false}
      maskClosable={false}
      footer={
        <>
          <Button onClick={onSkip}>跳过</Button>
          <Button theme="solid" type="primary" onClick={onCreate}>
            去创建
          </Button>
        </>
      }
      width={400}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>
          您还没有设置 <Text strong>{languageLabel}</Text> 的学习档案。
        </Text>
        <Text style={{ display: 'block', marginTop: 8 }}>
          创建学习档案可以帮助我们更好地为您定制学习内容。
        </Text>
      </div>
    </Modal>
  )
}

export default NoProfilePromptModal
