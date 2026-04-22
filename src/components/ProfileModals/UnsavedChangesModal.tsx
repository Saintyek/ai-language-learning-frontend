import React from 'react'
import { Modal, Button, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

interface UnsavedChangesModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 用户有档案但未保存修改时显示的模态框
 */
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title="提示"
      visible={visible}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button theme="solid" type="primary" onClick={onConfirm}>
            确定
          </Button>
        </>
      }
      width={400}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>返回后，您当前修改的学习档案将不会保存。</Text>
        <Text style={{ display: 'block', marginTop: 8 }}>确定要返回到聊天吗？</Text>
      </div>
    </Modal>
  )
}

export default UnsavedChangesModal
