import { useState, useEffect, useCallback } from 'react'

export interface TextSelection {
  text: string
  position: {
    x: number
    y: number
  }
}

export interface UseTextSelectionReturn {
  selection: TextSelection | null
  clearSelection: () => void
}

/**
 * 监听文本选择的自定义 Hook
 * @param containerRef 容器元素的 ref，用于限定监听范围（可选）
 * @param minLength 最小选择文本长度，默认为 1
 * @returns 选中文本和位置信息
 */
export const useTextSelection = (
  containerRef?: React.RefObject<HTMLElement | null>,
  minLength: number = 1
): UseTextSelectionReturn => {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  const clearSelection = useCallback(() => {
    setSelection(null)
    // 清除浏览器选中文本
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges()
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // 延迟一帧执行，确保 selection 已更新
      requestAnimationFrame(() => {
        const selectedText = window.getSelection()?.toString().trim() || ''

        // 忽略过短的选择或空选择
        if (selectedText.length < minLength) {
          setSelection(null)
          return
        }

        // 忽略过长文本选择（超过 500 字符）
        if (selectedText.length > 500) {
          setSelection(null)
          return
        }

        // 获取选中文本的位置
        const selectionObj = window.getSelection()
        if (!selectionObj || selectionObj.rangeCount === 0) {
          setSelection(null)
          return
        }

        const range = selectionObj.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // 如果提供了容器引用，检查选择是否在容器内
        if (containerRef?.current) {
          if (!containerRef.current.contains(range.commonAncestorContainer)) {
            setSelection(null)
            return
          }
        }

        setSelection({
          text: selectedText,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.bottom, // 选中文本底部位置，Tooltip 会显示在下方
          },
        })
      })
    }

    const handleMouseDown = (event: MouseEvent) => {
      // 如果点击的是 Modal 内部，不清除选择
      const target = event.target as HTMLElement
      // 检查多个可能的 Modal 相关类名
      if (
        target.closest('.semi-modal-content') ||
        target.closest('.semi-modal-wrap') ||
        target.closest('.semi-modal')
      ) {
        return
      }
      // 点击其他地方清除选择（包括状态和浏览器选中）
      setSelection(null)
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges()
      }
    }

    // 在 document 级别监听，确保能捕获所有选择
    document.addEventListener('mouseup', handleMouseUp, true)
    document.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [containerRef, minLength])

  return { selection, clearSelection }
}
