import { useState, useCallback, useRef, useMemo } from 'react'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { streamChatMessage, type ChatMessagePayload } from '@/api/chat'
import { languageOptions } from '@/consts/languages'

interface ChatHookProps {
  langCode: string | undefined
  /** 场景值数组，如 ['role', '扮演老师'] */
  sceneValue?: string[]
}

export interface UseChatReturn {
  chats: AIChatMessage[]
  generating: boolean
  abortControllerRef: React.RefObject<AbortController | null>
  messageIdSeedRef: React.RefObject<number>
  buildRequestMessages: (userMessage: string) => ChatMessagePayload[]
  handleSubmitText: (text: string) => Promise<void>
  stopGenerating: () => void
  markLatestAssistantMessage: (status: 'completed' | 'cancelled', fallbackContent?: string) => void
  extractPlainText: (inputContents?: Content[]) => string
  getChatTextContent: (content: AIChatMessage['content']) => string
  createMessageId: (role: 'user' | 'assistant') => string
  languageLabel: string
  hintPrompts: string[]
  roleConfig: {
    user: { name: string; color: string }
    assistant: { name: string; color: string }
  }
}

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

export default function useChat({ langCode, sceneValue }: ChatHookProps): UseChatReturn {
  const [chats, setChats] = useState<AIChatMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageIdSeedRef = useRef(0)

  const currentLanguage = languageOptions.find(lang => lang.code === langCode)
  const languageLabel = currentLanguage?.label || '语言'

  // 构建场景标识，格式为 "一级场景/二级场景"
  const scenarioKey = sceneValue && sceneValue.length >= 2
    ? `${sceneValue[0]}/${sceneValue[1]}`
    : undefined

  const extractPlainText = useCallback((inputContents?: Content[]): string => {
    if (!inputContents?.length) return ''
    return inputContents
      .filter((item): item is Content & { text?: string } => item.type === 'text')
      .map(item => item.text ?? '')
      .join('')
      .trim()
  }, [])

  const getChatTextContent = useCallback((content: AIChatMessage['content']): string => {
    if (typeof content === 'string') {
      return content.trim()
    }
    return ''
  }, [])

  const createMessageId = useCallback((role: 'user' | 'assistant'): string => {
    messageIdSeedRef.current += 1
    return `${role}-${Date.now()}-${messageIdSeedRef.current}`
  }, [])

  const buildRequestMessages = useCallback(
    (userMessage: string): ChatMessagePayload[] => {
      // 如果有场景，后端会注入场景 prompt，前端不再添加默认 system prompt
      const shouldAddSystemPrompt = !scenarioKey

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

      const messages: ChatMessagePayload[] = []

      if (shouldAddSystemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      }

      messages.push(...historyMessages)
      messages.push({ role: 'user', content: userMessage })

      return messages
    },
    [chats, getChatTextContent, languageLabel, scenarioKey]
  )

  const markLatestAssistantMessage = useCallback(
    (status: 'completed' | 'cancelled', fallbackContent?: string) => {
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
    },
    []
  )

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    markLatestAssistantMessage('cancelled', '已停止生成')
    setGenerating(false)
  }, [markLatestAssistantMessage])

  const handleSubmitText = useCallback(
    async (text: string) => {
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
          scenario: scenarioKey,
          language: langCode,
          onChunk: chunk => {
            setChats(prev =>
              prev.map(chat =>
                chat.id === assistantId ? { ...chat, content: `${chat.content}${chunk}` } : chat
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
        if (abortController.signal.aborted) return

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
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
        setGenerating(false)
      }
    },
    [buildRequestMessages, createMessageId, generating, scenarioKey, langCode]
  )

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
      user: { name: '我', color: 'blue' },
      assistant: { name: `${languageLabel}导师`, color: 'indigo' },
    }),
    [languageLabel]
  )

  return {
    chats,
    generating,
    abortControllerRef,
    messageIdSeedRef,
    buildRequestMessages,
    handleSubmitText,
    stopGenerating,
    markLatestAssistantMessage,
    extractPlainText,
    getChatTextContent,
    createMessageId,
    languageLabel,
    hintPrompts,
    roleConfig,
  }
}
