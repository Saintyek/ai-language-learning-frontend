import React from 'react'
import { Modal, Button, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

interface NoProfileModalProps {
  visible: boolean
  languageLabel: string
  onSkip: () => void
  onReturn: () => void
}

/**
 * 用户没有当前语言档案时显示的模态框
 */
const NoProfileModal: React.FC<NoProfileModalProps> = ({
  visible,
  languageLabel,
  onSkip,
  onReturn,
}) => {
  return (
    <Modal
      title="提示"
      visible={visible}
      onCancel={onReturn}
      footer={
        <>
          <Button onClick={onReturn}>返回设置</Button>
          <Button theme="solid" type="primary" onClick={onSkip}>
            跳过
          </Button>
        </>
      }
      width={400}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>
          您还没有设置 <Text strong>{languageLabel}</Text> 的学习档案。
        </Text>
        <Text style={{ display: 'block', marginTop: 8 }}>是否跳过档案设置，直接开始对话？</Text>
      </div>
    </Modal>
  )
}

export default NoProfileModal
