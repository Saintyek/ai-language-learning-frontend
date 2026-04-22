import React from 'react'
import { Modal, Button, Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

interface LogoutConfirmModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 退出登录确认模态框
 */
const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title="确认退出"
      visible={visible}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button theme="solid" type="danger" onClick={onConfirm}>
            确认退出
          </Button>
        </>
      }
      width={400}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>确定要退出登录吗？</Text>
      </div>
    </Modal>
  )
}

export default LogoutConfirmModal
