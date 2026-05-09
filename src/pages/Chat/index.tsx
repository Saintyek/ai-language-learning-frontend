import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import 'flag-icons/css/flag-icons.min.css'

import useChat from './hooks/useChat'
import useSceneSelection from './hooks/useSceneSelection'
import useDigitalHuman from './hooks/useDigitalHuman'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import DigitalHumanPanel from './components/DigitalHumanPanel'
import ChatDialogArea from './components/ChatDialogArea'
import ChatInputArea from './components/ChatInputArea'
import { PronunciationAnalysis } from '@/components/PronunciationAnalysis'
import { getChatSessionDetail, type ChatMessage } from '@/api/chat'
import { scenarioToValueArray } from '@/utils/scenarioUtils'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'

const Chat: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const [sceneDropdownVisible, setSceneDropdownVisible] = useState(false)
  const [initialMessages, setInitialMessages] = useState<AIChatMessage[] | undefined>()
  const [loadingSession, setLoadingSession] = useState(false)
  const chatPanelRef = useRef<HTMLDivElement>(null)

  // 使用自定义 Hooks - 需要在 loadSessionHistory 之前定义
  const sceneSelection = useSceneSelection()
  // 解构出 setSceneValue 用于 useCallback 依赖，避免整个对象作为依赖
  const { setSceneValue } = sceneSelection

  // 加载会话历史
  const loadSessionHistory = useCallback(
    async (sid: string) => {
      setLoadingSession(true)
      try {
        const response = await getChatSessionDetail(sid)
        if (response.data?.messages) {
          const messages: AIChatMessage[] = response.data.messages.map((msg: ChatMessage) => ({
            id: `loaded-${msg.id}`,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.createdAt).getTime(),
            status: 'completed' as const,
          }))
          // 调试：检查加载的消息
          console.log('[Chat] Loaded session history:', {
            sessionId: sid,
            messageCount: messages.length,
            messages: messages.map(m => ({
              id: m.id,
              role: m.role,
              contentType: typeof m.content,
              isPromise: m.content instanceof Promise,
              contentPreview:
                typeof m.content === 'string' ? m.content.substring(0, 100) : m.content,
            })),
          })
          setInitialMessages(messages)
        }
        // 设置场景值：从会话的 scenario 字段恢复场景选择
        if (response.data?.scenario) {
          const sceneValue = scenarioToValueArray(response.data.scenario)
          setSceneValue(sceneValue)
        }
      } catch (error) {
        console.error('Failed to load session history:', error)
      } finally {
        setLoadingSession(false)
      }
    },
    [setSceneValue]
  )

  // 如果有 sessionId，加载会话历史
  useEffect(() => {
    if (sessionId) {
      loadSessionHistory(sessionId)
    } else {
      setInitialMessages(undefined)
      // 清空场景选择
      setSceneValue([])
    }
  }, [sessionId, loadSessionHistory, setSceneValue])

  const chat = useChat({
    langCode,
    sceneValue: sceneSelection.sceneValue,
    initialSessionId: sessionId,
    initialMessages,
  })
  const { digitalHuman } = useDigitalHuman()

  // 语音聊天集成
  const voiceChat = useVoiceChat({
    onSendMessage: chat.handleSubmitText,
  })

  // 自动滚动到底部
  useEffect(() => {
    const chatPanel = chatPanelRef.current
    if (!chatPanel) return

    const scrollContainer = chatPanel.querySelector<HTMLElement>('.semi-ai-chat-dialogue-list')
    if (!scrollContainer) return

    scrollContainer.scrollTop = scrollContainer.scrollHeight
  }, [chat.chats])

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
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
            className="chat-shell flex h-full w-full flex-col overflow-hidden rounded-4xl border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <ChatDialogArea
              chats={chat.chats}
              roleConfig={chat.roleConfig}
              hintPrompts={chat.hintPrompts}
              languageLabel={chat.languageLabel}
              langCode={langCode}
              onHintClick={chat.handleSubmitText}
              loading={loadingSession}
            />

            {/* 发音分析结果 */}
            {voiceChat.pronunciationResult && (
              <div className="px-4 pb-2">
                <PronunciationAnalysis result={voiceChat.pronunciationResult} />
              </div>
            )}

            <ChatInputArea
              generating={chat.generating}
              stopGenerating={chat.stopGenerating}
              extractPlainText={chat.extractPlainText}
              languageLabel={chat.languageLabel}
              sceneSelection={sceneSelection}
              sceneDropdownVisible={sceneDropdownVisible}
              setSceneDropdownVisible={setSceneDropdownVisible}
              onMessageSend={chat.handleSubmitText}
              voiceChat={voiceChat}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
