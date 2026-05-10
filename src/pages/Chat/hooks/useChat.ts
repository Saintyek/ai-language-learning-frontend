import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { streamChatMessage, createChatSession, type ChatMessagePayload } from '@/api/chat'
import { languageOptions } from '@/consts/languages'
import { useStreamingTTS } from '@/hooks/useStreamingTTS'

interface ChatHookProps {
  langCode: string | undefined
  /** 场景值数组，如 ['role', '扮演老师'] */
  sceneValue?: string[]
  /** 初始会话ID（用于加载历史会话） */
  initialSessionId?: string | null
  /** 初始消息列表（用于加载历史消息） */
  initialMessages?: AIChatMessage[]
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
  sessionId: string | null
  /**
   * 直接追加一条已就绪的消息（不调用任何 LLM/TTS API）
   * 供实时语音链路使用：把语音模型的 ASR 文本和 AI 回复文本直接落到聊天列表
   */
  appendCompletedMessage: (role: 'user' | 'assistant', content: string) => void
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

export default function useChat({
  langCode,
  sceneValue,
  initialSessionId,
  initialMessages,
}: ChatHookProps): UseChatReturn {
  const [chats, setChats] = useState<AIChatMessage[]>(initialMessages ?? [])
  const [generating, setGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageIdSeedRef = useRef(0)
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null)
  const prevLangCodeRef = useRef<string | undefined>(langCode)

  // 初始化 TTS 播放器（仅文本聊天链路使用，固定 mp3 格式）
  const { enqueueAudio, flush: flushAudio, stop: stopAudio } = useStreamingTTS({ format: 'mp3' })

  // 组件卸载时停止音频播放
  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  // 当 initialSessionId 或 initialMessages 变化时，重置会话状态
  useEffect(() => {
    sessionIdRef.current = initialSessionId ?? null
    // 调试：检查 initialMessages 的内容类型
    if (initialMessages && initialMessages.length > 0) {
      console.log('[useChat] Setting initial messages:', {
        count: initialMessages.length,
        types: initialMessages.map(m => ({
          role: m.role,
          contentType: typeof m.content,
          isPromise: m.content instanceof Promise,
          content: typeof m.content === 'string' ? m.content.substring(0, 50) : m.content,
        })),
      })
    }
    setChats(initialMessages ?? [])
    prevLangCodeRef.current = langCode
  }, [initialSessionId, initialMessages])

  // 当用户主动切换语言时（不是从历史会话加载），重置会话
  useEffect(() => {
    if (
      prevLangCodeRef.current !== undefined &&
      prevLangCodeRef.current !== langCode &&
      !initialSessionId
    ) {
      // 语言切换，重置会话
      sessionIdRef.current = null
      setChats([])
    }
    prevLangCodeRef.current = langCode
  }, [langCode, initialSessionId])

  const currentLanguage = languageOptions.find(lang => lang.code === langCode)
  const languageLabel = currentLanguage?.label || '语言'

  // 构建场景标识，格式为 "一级场景/二级场景"
  const scenarioKey =
    sceneValue && sceneValue.length >= 2 ? `${sceneValue[0]}/${sceneValue[1]}` : undefined

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

      messages.push(...historyMessages)
      messages.push({ role: 'user', content: userMessage })

      return messages
    },
    [chats, getChatTextContent]
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
        // 首次对话时创建会话
        if (!sessionIdRef.current) {
          try {
            // 使用用户消息作为会话标题（截取前50个字符）
            const title = trimmedText
            const sessionResponse = await createChatSession(title, scenarioKey, langCode)
            sessionIdRef.current = String(sessionResponse.data.id)
          } catch (error) {
            console.error('Failed to create session:', error)
            // 创建会话失败不影响主流程，继续聊天但不保存
          }
        }

        await streamChatMessage({
          messages,
          signal: abortController.signal,
          scenario: scenarioKey,
          language: langCode,
          sessionId: sessionIdRef.current ?? undefined,
          enableTTS: true,
          onAudio: (audioBase64: string) => {
            enqueueAudio(audioBase64)
          },
          onChunk: chunk => {
            setChats(prev =>
              prev.map(chat =>
                chat.id === assistantId ? { ...chat, content: `${chat.content}${chunk}` } : chat
              )
            )
          },
        })

        // 文本流结束后整体解码 mp3 并播放（mp3 模式必需）
        await flushAudio()

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
    [buildRequestMessages, createMessageId, generating, scenarioKey, langCode, enqueueAudio, flushAudio]
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

  /**
   * 直接追加一条已就绪的消息（不调用任何后端 API）
   * 适用于实时语音链路：避免再次触发 LLM 文本生成与 TTS 合成
   */
  const appendCompletedMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return
      setChats(prev => [
        ...prev,
        buildChatMessage({
          id: createMessageId(role),
          role,
          content: trimmed,
          status: 'completed',
        }),
      ])
    },
    [createMessageId]
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
    sessionId: sessionIdRef.current,
    appendCompletedMessage,
  }
}
