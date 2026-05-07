import React, { useEffect, useRef, useState } from 'react'
import { AIChatDialogue, Spin } from '@douyinfe/semi-ui'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import {
  processTextNodes,
  setWordClickCallback,
  clearProcessedNodes,
} from '../../../utils/segmentation'
import { TranslateModal } from '@/components/TranslateModal/index'
import type { SmartSelection } from '../../../hooks/useSmartSelection'

interface ChatDialogAreaProps {
  chats: AIChatMessage[]
  roleConfig: {
    user: { name: string; color: string }
    assistant: { name: string; color: string }
  }
  hintPrompts: string[]
  languageLabel: string
  /** 当前学习语言代码，用于确定翻译目标语言 */
  langCode: string | undefined
  onHintClick: (hint: string) => void
  loading?: boolean
}

/**
 * 聊天对话区域组件
 * 集成智能短语选择功能
 */
export const ChatDialogArea: React.FC<ChatDialogAreaProps> = ({
  chats,
  roleConfig,
  hintPrompts,
  languageLabel,
  langCode,
  onHintClick,
  loading,
}) => {
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null)

  // 本地 selection 状态
  const [selection, setSelection] = useState<SmartSelection | null>(null)

  const clearSelection = () => {
    setSelection(null)
  }

  // 设置点击回调
  useEffect(() => {
    setWordClickCallback((word: string, rect: DOMRect) => {
      console.log('ChatDialogArea received click callback:', word)
      // 直接设置 selection 状态触发翻译
      setSelection({
        text: word,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
        },
      })
    })

    return () => {
      setWordClickCallback(null as unknown as (word: string, rect: DOMRect) => void)
    }
  }, [])

  // 当聊天内容变化时，处理文本节点
  useEffect(() => {
    if (!containerRef.current || chats.length === 0) return

    const container = containerRef.current
    let isProcessing = false

    // 处理文本节点的函数
    const processNodes = () => {
      if (isProcessing) return

      // 检查是否已经处理过
      const existingSpans = container.querySelectorAll('[data-word]')
      if (existingSpans.length > 0) return

      isProcessing = true
      console.log('Calling processTextNodes...')
      processTextNodes(container)
      console.log(
        'processTextNodes done, new spans:',
        container.querySelectorAll('[data-word]').length
      )
      isProcessing = false
    }

    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(mutations => {
      // 检查是否有新增的文本内容（排除我们自己的 span 修改）
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查新增节点是否是我们添加的 span
          const hasOurSpans = Array.from(mutation.addedNodes).some(
            node =>
              node instanceof HTMLElement && node.hasAttribute && node.hasAttribute('data-word')
          )
          if (!hasOurSpans) {
            processNodes()
          }
          break
        }
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
    })

    // 初始处理
    const timer = setTimeout(processNodes, 100)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [chats])

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

      <div
        ref={containerRef}
        className="chat-shell__dialogue flex-1 min-h-0 overflow-hidden px-3 pt-3"
      >
        {/* 调试：检查 chats 内容类型 */}
        {(() => {
          const problemChats = chats.filter(c => typeof c.content !== 'string')
          if (problemChats.length > 0) {
            console.error('[ChatDialogArea] Found non-string content!', {
              count: problemChats.length,
              details: problemChats.map(c => ({
                id: c.id,
                role: c.role,
                contentType: typeof c.content,
                isPromise: c.content instanceof Promise,
                content: c.content,
              })),
            })
          }
          return null
        })()}
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
      <TranslateModal selection={selection} langCode={langCode} onClose={clearSelection} />
    </>
  )
}

export default ChatDialogArea
