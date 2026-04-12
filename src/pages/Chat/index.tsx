import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { IconChevronRight, IconChevronUp } from '@douyinfe/semi-icons'
import { Toast, AIChatDialogue, AIChatInput, Cascader, getConfigureItem } from '@douyinfe/semi-ui'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { languageOptions } from '@/consts/languages'
import { sceneOptions } from '@/consts/scenes'
import DigitalHumanStage from '@/components/DigitalHumanStage'
import { streamChatMessage, type ChatMessagePayload } from '@/api/chat'
import { getDigitalHumanStatus, type DigitalHumanInfo } from '@/api/digitalHuman'
import 'flag-icons/css/flag-icons.min.css'

const buildChatMessage = ({
  id,
  role,
  content,
  status = 'completed',
}: {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'in_progress' | 'completed' | 'cancelled'
}): AIChatMessage => ({
  id,
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

const getChatTextContent = (content: AIChatMessage['content']) => {
  if (typeof content === 'string') {
    return content.trim()
  }

  return ''
}

const SceneCascader = getConfigureItem(
  (props: React.ComponentProps<typeof Cascader>) => <Cascader {...props} />,
  {
    className: 'aiChatInput-cascader-configure',
  }
)

const Chat: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const [chats, setChats] = useState<AIChatMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [digitalHuman, setDigitalHuman] = useState<DigitalHumanInfo>({ status: 'not_created' })
  const [sceneDropdownVisible, setSceneDropdownVisible] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatPanelRef = useRef<HTMLDivElement | null>(null)
  const messageIdSeedRef = useRef(0)

  const currentLanguage = languageOptions.find(lang => lang.code === langCode)
  const languageLabel = currentLanguage?.label || '语言'

  const buildRequestMessages = (userMessage: string): ChatMessagePayload[] => {
    const systemPrompt = `你是一名${languageLabel}语言学习助手。请围绕${languageLabel}口语练习、纠错和场景对话来回答，优先使用${languageLabel}回复；当用户明显看不懂时，可以补充简短中文解释。`

    const historyMessages = chats.flatMap<ChatMessagePayload>(chat => {
      const textContent = getChatTextContent(chat.content)
      if (chat.status === 'cancelled' || !textContent) {
        return []
      }

      return [
        {
          role: chat.role as ChatMessagePayload['role'],
          content: textContent,
          id: chat.id,
        },
      ]
    })

    return [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...historyMessages,
      {
        role: 'user',
        content: userMessage,
      },
    ]
  }

  const createMessageId = (role: 'user' | 'assistant') => {
    messageIdSeedRef.current += 1
    return `${role}-${Date.now()}-${messageIdSeedRef.current}`
  }

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

  const renderConfigureArea = useCallback(
    () => (
      <SceneCascader
        field="scene"
        treeData={sceneOptions}
        position="topLeft"
        dropdownClassName="chat-scene-cascader-dropdown"
        arrowIcon={sceneDropdownVisible ? <IconChevronRight /> : <IconChevronUp />}
        onDropdownVisibleChange={setSceneDropdownVisible}
        placeholder="选择场景"
        changeOnSelect
        separator=" / "
        style={{
          width: 150,
          borderRadius: 20,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.22)',
          color: '#2563eb',
          fontWeight: 500,
        }}
      />
    ),
    [sceneDropdownVisible]
  )

  const markLatestAssistantMessage = (
    status: 'completed' | 'cancelled',
    fallbackContent?: string
  ) => {
    setChats(prev => {
      const next = [...prev]
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === 'assistant' && next[index].status === 'in_progress') {
          next[index] = {
            ...next[index],
            content: next[index].content || fallbackContent || next[index].content,
            status,
          }
          break
        }
      }
      return next
    })
  }

  const stopGenerating = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    markLatestAssistantMessage('cancelled', '已停止生成')
    setGenerating(false)
  }

  const handleSubmitText = async (text: string) => {
    const trimmedText = text.trim()
    if (!trimmedText || generating) return

    const assistantId = createMessageId('assistant')
    const abortController = new AbortController()
    const messages = buildRequestMessages(trimmedText)

    abortControllerRef.current = abortController
    setGenerating(true)
    setChats(prev => [
      ...prev,
      buildChatMessage({
        id: createMessageId('user'),
        role: 'user',
        content: trimmedText,
      }),
      buildChatMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'in_progress',
      }),
    ])

    try {
      await streamChatMessage({
        messages,
        signal: abortController.signal,
        onChunk: chunk => {
          setChats(prev =>
            prev.map(chat =>
              chat.id === assistantId
                ? {
                    ...chat,
                    content: `${chat.content}${chunk}`,
                  }
                : chat
            )
          )
        },
      })

      setChats(prev =>
        prev.map(chat =>
          chat.id === assistantId
            ? {
                ...chat,
                content: chat.content || '本次对话暂无返回内容',
                status: 'completed',
              }
            : chat
        )
      )
    } catch (error) {
      if (abortController.signal.aborted) {
        return
      }

      const message = error instanceof Error ? error.message : '对话生成失败，请稍后重试'
      setChats(prev =>
        prev.map(chat =>
          chat.id === assistantId
            ? {
                ...chat,
                content: chat.content || message,
                status: 'cancelled',
              }
            : chat
        )
      )
      Toast.error(message)
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
      setGenerating(false)
    }
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
    // 组件卸载时中止流式请求，避免页面离开后继续写状态。
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const chatPanel = chatPanelRef.current
    if (!chatPanel) return

    const scrollContainer = chatPanel.querySelector<HTMLElement>('.semi-ai-chat-dialogue-list')
    if (!scrollContainer) return

    scrollContainer.scrollTop = scrollContainer.scrollHeight
  }, [chats])

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
            className="chat-shell flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-white/65 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
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
                renderConfigureArea={renderConfigureArea}
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
