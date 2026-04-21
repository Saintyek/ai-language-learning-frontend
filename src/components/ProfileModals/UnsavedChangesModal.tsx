import React from 'react'
import { Modal } from '@douyinfe/semi-ui'

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
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            确定
          </button>
        </div>
      }
      width={400}
    >
      <div className="py-4">
        <p className="text-gray-600">
          返回后，您当前修改的学习档案将不会保存。
        </p>
        <p className="text-gray-600 mt-2">
          确定要返回吗？
        </p>
      </div>
    </Modal>
  )
}

export default UnsavedChangesModal
