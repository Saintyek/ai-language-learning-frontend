import React from 'react'
import { AIChatDialogue } from '@douyinfe/semi-ui'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'

interface ChatDialogAreaProps {
  chats: AIChatMessage[]
  roleConfig: {
    user: { name: string; color: string }
    assistant: { name: string; color: string }
  }
  hintPrompts: string[]
  languageLabel: string
  onHintClick: (hint: string) => void
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
}) => {
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
    </>
  )
}

export default ChatDialogArea
