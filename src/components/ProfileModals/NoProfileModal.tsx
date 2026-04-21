import React from 'react'
import { Modal } from '@douyinfe/semi-ui'

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
        <div className="flex justify-end gap-3">
          <button
            onClick={onReturn}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            返回设置
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            跳过
          </button>
        </div>
      }
      width={400}
    >
      <div className="py-4">
        <p className="text-gray-600">
          您还没有设置 <span className="font-medium text-gray-800">{languageLabel}</span> 的学习档案。
        </p>
        <p className="text-gray-600 mt-2">
          是否跳过档案设置，直接开始对话？
        </p>
      </div>
    </Modal>
  )
}

export default NoProfileModal
