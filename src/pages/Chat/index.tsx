import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AIChatDialogue, AIChatInput } from '@douyinfe/semi-ui'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { languageOptions } from '@/consts/languages'
import DigitalHumanStage from '@/components/DigitalHumanStage'
import { getDigitalHumanStatus, type DigitalHumanInfo } from '@/api/digitalHuman'
import 'flag-icons/css/flag-icons.min.css'

const buildChatMessage = (
  role: 'user' | 'assistant',
  content: string,
  status: 'in_progress' | 'completed' | 'cancelled' = 'completed'
): AIChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: Date.now(),
  status,
})

// AIChatInput 返回结构化内容，这里只提取当前页面需要的纯文本消息。
const extractPlainText = (inputContents?: Content[]) => {
  if (!inputContents?.length) return ''

  return inputContents
    .filter((item): item is Content & { text?: string } => item.type === 'text')
    .map(item => item.text ?? '')
    .join('')
    .trim()
}

const Chat: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const [chats, setChats] = useState<AIChatMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [digitalHuman, setDigitalHuman] = useState<DigitalHumanInfo>({ status: 'not_created' })
  const [showInputTopFade, setShowInputTopFade] = useState(false)
  const responseTimerRef = useRef<number | null>(null)
  const chatPanelRef = useRef<HTMLDivElement | null>(null)

  const currentLanguage = languageOptions.find(lang => lang.code === langCode)
  const languageLabel = currentLanguage?.label || '语言'

  // 建议开场语依赖当前语言，切换语言时同步更新，避免在渲染期间重复创建数组。
  const hintPrompts = useMemo(
    () => [
      `请用${languageLabel}和我做一个简单的自我介绍练习`,
      `请模拟一个${languageLabel}餐厅点餐对话`,
      `帮我练习${languageLabel}旅行常用表达`,
      `请纠正我用${languageLabel}说这句话的语法`,
    ],
    [languageLabel]
  )

  const roleConfig = useMemo(
    () => ({
      user: {
        name: '我',
        color: 'blue',
      },
      assistant: {
        name: `${languageLabel}导师`,
        color: 'indigo',
      },
    }),
    [languageLabel]
  )

  // 停止生成时同时清理定时器，并把最后一条生成中的 assistant 消息标记为 cancelled。
  const stopGenerating = () => {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current)
      responseTimerRef.current = null
    }

    setChats(prev => {
      const next = [...prev]
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === 'assistant' && next[index].status === 'in_progress') {
          next[index] = {
            ...next[index],
            status: 'cancelled',
          }
          break
        }
      }
      return next
    })
    setGenerating(false)
  }

  // 当前仍使用本地模拟回复，后续接真实接口时可以在这里替换为请求/流式更新逻辑。
  const simulateAIResponse = (userMessage: string) => {
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setGenerating(true)
    setChats(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'in_progress',
      },
    ])

    responseTimerRef.current = window.setTimeout(() => {
      setChats(prev =>
        prev.map(chat =>
          chat.id === assistantId
            ? {
                ...chat,
                content: `你好！我是你的${languageLabel}学习助手。你说的是：“${userMessage}”。让我们开始练习吧！`,
                status: 'completed',
              }
            : chat
        )
      )
      responseTimerRef.current = null
      setGenerating(false)
    }, 1000)
  }

  const handleSubmitText = (text: string) => {
    const trimmedText = text.trim()
    if (!trimmedText || generating) return

    setChats(prev => [...prev, buildChatMessage('user', trimmedText)])
    simulateAIResponse(trimmedText)
  }

  useEffect(() => {
    let isMounted = true

    getDigitalHumanStatus()
      .then(data => {
        if (isMounted) {
          setDigitalHuman(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDigitalHuman({ status: 'failed' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    // 组件卸载时兜底清理未完成的回复，避免定时器在页面离开后继续写状态。
    return () => {
      if (responseTimerRef.current !== null) {
        window.clearTimeout(responseTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const chatPanel = chatPanelRef.current
    if (!chatPanel) return

    const scrollContainer = chatPanel.querySelector<HTMLElement>('.semi-ai-chat-dialogue-list')
    if (!scrollContainer) return

    const syncInputFade = () => {
      const hasScrollableOverflow = scrollContainer.scrollHeight - scrollContainer.clientHeight > 8
      setShowInputTopFade(hasScrollableOverflow && scrollContainer.scrollTop > 8)
    }

    syncInputFade()
    scrollContainer.addEventListener('scroll', syncInputFade, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', syncInputFade)
    }
  }, [chats.length])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧数字人 */}
        <div className="hidden lg:flex w-2/5 xl:w-1/3 bg-gradient-to-b from-indigo-100/50 to-purple-100/50 flex-col items-center justify-center p-8 border-r border-slate-200/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute inset-4 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full blur-2xl opacity-40" />

            <DigitalHumanStage
              status={digitalHuman.status}
              imageUrl={digitalHuman.frontendPicUrl}
              isThinking={generating}
              languageLabel={languageLabel}
            />
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 语言导师</h2>
            <p className="text-slate-600 max-w-xs">
              我将帮助你练习{languageLabel}， 通过自然对话提升你的语言能力
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-xs text-slate-500">对话次数</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-xs text-slate-500">准确率</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-slate-500">学习天数</div>
            </div>
          </div>
        </div>

        {/* 右侧对话框 */}
        <div className="flex-1 overflow-hidden bg-white/45 p-4">
          <div
            ref={chatPanelRef}
            className="chat-shell mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            {chats.length === 0 && (
              <div className="px-6 pt-6 text-center">
                <p className="text-lg font-semibold text-slate-700">
                  开始你的{languageLabel}对话练习
                </p>
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
                onHintClick={handleSubmitText}
                className="h-full"
                style={{ height: '100%' }}
              />
            </div>

            <div className="chat-shell__composer-wrap flex-shrink-0 px-3 pb-3 pt-2">
              <AIChatInput
                keepSkillAfterSend={false}
                placeholder={`用${languageLabel}开始对话...`}
                sendHotKey="enter"
                generating={generating}
                showUploadButton={false}
                onMessageSend={({ inputContents }) => {
                  handleSubmitText(extractPlainText(inputContents))
                }}
                onStopGenerate={stopGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
