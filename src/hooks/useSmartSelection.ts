// src/hooks/useSmartSelection.ts

import { useState, useEffect, useCallback, useRef } from 'react'

export interface SmartSelection {
  text: string
  position: {
    x: number
    y: number
  }
}

export interface UseSmartSelectionReturn {
  selection: SmartSelection | null
  hoveredWord: string | null
  clearSelection: () => void
}

const DATA_WORD_ATTR = 'data-word'
const HOVER_CLASS = 'smart-word--hover'

/**
 * 智能短语选择 Hook
 * 使用事件委托处理悬停和点击
 */
export function useSmartSelection(
  containerRef: React.RefObject<HTMLElement | null>
): UseSmartSelectionReturn {
  const [selection, setSelection] = useState<SmartSelection | null>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const currentHoveredSpan = useRef<HTMLSpanElement | null>(null)

  const clearSelection = useCallback(() => {
    setSelection(null)
    // 清除浏览器选中文本
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`span[${DATA_WORD_ATTR}]`) as HTMLSpanElement | null

      if (!wordSpan) {
        // 移出词区域
        if (currentHoveredSpan.current) {
          currentHoveredSpan.current.classList.remove(HOVER_CLASS)
          currentHoveredSpan.current = null
          setHoveredWord(null)
        }
        return
      }

      // 悬停在新的词上
      if (wordSpan !== currentHoveredSpan.current) {
        // 清除旧的悬停
        if (currentHoveredSpan.current) {
          currentHoveredSpan.current.classList.remove(HOVER_CLASS)
        }

        // 设置新的悬停
        wordSpan.classList.add(HOVER_CLASS)
        currentHoveredSpan.current = wordSpan
        setHoveredWord(wordSpan.getAttribute(DATA_WORD_ATTR))
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`span[${DATA_WORD_ATTR}]`)

      // 鼠标离开词区域
      if (!wordSpan && currentHoveredSpan.current) {
        // 检查是否移动到子元素
        const relatedTarget = event.relatedTarget as HTMLElement | null
        if (relatedTarget && currentHoveredSpan.current.contains(relatedTarget)) {
          return
        }
        currentHoveredSpan.current.classList.remove(HOVER_CLASS)
        currentHoveredSpan.current = null
        setHoveredWord(null)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`span[${DATA_WORD_ATTR}]`) as HTMLSpanElement | null

      if (!wordSpan) {
        console.log('Click: No word span found, target:', target.tagName, target.className)
        return
      }

      const word = wordSpan.getAttribute(DATA_WORD_ATTR)
      console.log('Click: Word span found, word:', word)

      if (!word) return

      // 获取位置
      const rect = wordSpan.getBoundingClientRect()

      console.log('Click: Setting selection', {
        word,
        position: { x: rect.left + rect.width / 2, y: rect.bottom },
      })

      setSelection({
        text: word,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
        },
      })
    }

    // 使用事件委托，捕获阶段处理
    container.addEventListener('mouseover', handleMouseOver, true)
    container.addEventListener('mouseout', handleMouseOut, true)
    container.addEventListener('click', handleClick, true)

    return () => {
      container.removeEventListener('mouseover', handleMouseOver, true)
      container.removeEventListener('mouseout', handleMouseOut, true)
      container.removeEventListener('click', handleClick, true)

      // 清理悬停状态
      if (currentHoveredSpan.current) {
        currentHoveredSpan.current.classList.remove(HOVER_CLASS)
      }
    }
  }, [containerRef])

  return { selection, hoveredWord, clearSelection }
}
