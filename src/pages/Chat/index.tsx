import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import 'flag-icons/css/flag-icons.min.css'

import useChat from './hooks/useChat'
import useSceneSelection from './hooks/useSceneSelection'
import useDigitalHuman from './hooks/useDigitalHuman'
import DigitalHumanPanel from './components/DigitalHumanPanel'
import ChatDialogArea from './components/ChatDialogArea'
import ChatInputArea from './components/ChatInputArea'

const Chat: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const [sceneDropdownVisible, setSceneDropdownVisible] = useState(false)
  const chatPanelRef = useRef<HTMLDivElement>(null)

  // 使用自定义 Hooks
  const chat = useChat({ langCode })
  const sceneSelection = useSceneSelection()
  const { digitalHuman } = useDigitalHuman()

  // 自动滚动到底部
  useEffect(() => {
    const chatPanel = chatPanelRef.current
    if (!chatPanel) return

    const scrollContainer = chatPanel.querySelector<HTMLElement>('.semi-ai-chat-dialogue-list')
    if (!scrollContainer) return

    scrollContainer.scrollTop = scrollContainer.scrollHeight
  }, [chat.chats])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧数字人 */}
        <DigitalHumanPanel
          digitalHuman={digitalHuman}
          generating={chat.generating}
          languageLabel={chat.languageLabel}
        />

        {/* 右侧对话框 */}
        <div className="flex-1 overflow-hidden bg-white/45 p-4">
          <div
            ref={chatPanelRef}
            className="chat-shell flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <ChatDialogArea
              chats={chat.chats}
              roleConfig={chat.roleConfig}
              hintPrompts={chat.hintPrompts}
              languageLabel={chat.languageLabel}
              onHintClick={chat.handleSubmitText}
            />

            <ChatInputArea
              generating={chat.generating}
              stopGenerating={chat.stopGenerating}
              extractPlainText={chat.extractPlainText}
              languageLabel={chat.languageLabel}
              sceneSelection={sceneSelection}
              sceneDropdownVisible={sceneDropdownVisible}
              setSceneDropdownVisible={setSceneDropdownVisible}
              onMessageSend={chat.handleSubmitText}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
