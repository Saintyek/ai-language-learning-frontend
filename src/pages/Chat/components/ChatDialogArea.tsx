import React from 'react'
import { AIChatDialogue, Spin } from '@douyinfe/semi-ui'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { useTextSelection } from '../../../hooks/useTextSelection'
import { TranslateModal } from '@/components/TranslateModal/index'

interface ChatDialogAreaProps {
  chats: AIChatMessage[]
  roleConfig: {
    user: { name: string; color: string }
    assistant: { name: string; color: string }
  }
  hintPrompts: string[]
  languageLabel: string
  onHintClick: (hint: string) => void
  loading?: boolean
}

/**
 * 聊天对话区域组件
 */
export const ChatDialogArea: React.FC<ChatDialogAreaProps> = ({
  chats,
  roleConfig,
  hintPrompts,
  languageLabel,
  onHintClick,
  loading,
}) => {
  // 使用 document 级别的文本选择监听
  const { selection, clearSelection } = useTextSelection(undefined, 1)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <>
      {chats.length === 0 && (
        <div className="px-6 pt-6 text-center">
          <p className="text-lg font-semibold text-slate-700">开始你的{languageLabel}对话练习</p>
          <p className="mt-2 text-sm text-slate-500">
            试试下面的建议开场语，或者直接输入你想说的话。
          </p>
        </div>
      )}

      <div className="chat-shell__dialogue flex-1 min-h-0 overflow-hidden px-3 pt-3">
        <AIChatDialogue
          chats={chats}
          roleConfig={roleConfig}
          align="leftRight"
          mode="bubble"
          hints={chats.length === 0 ? hintPrompts : []}
          onHintClick={onHintClick}
          className="h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* 翻译 Modal */}
      <TranslateModal selection={selection} onClose={clearSelection} />
    </>
  )
}

export default ChatDialogArea
