import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { sceneOptions, type SceneOption } from '@/consts/scenes'

// 每个二级按钮的估计宽度（包含padding和gap）
const ESTIMATED_BUTTON_WIDTH = 100

export interface UseSceneSelectionReturn {
  sceneValue: string[]
  setSceneValue: (value: string[]) => void
  currentSecondLevelOptions: SceneOption[]
  selectedSecondLevel: string | null
  visibleButtonIndices: number[]
  handleSceneChange: (value: string[]) => void
  handleSecondLevelClick: (option: SceneOption, index: number) => void
  handleCascaderSelect: (value: string[]) => void
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * 场景选择逻辑 Hook
 * 管理级联选择器的值、二级选项的显示逻辑
 */
export default function useSceneSelection(): UseSceneSelectionReturn {
  // 级联选择器的值 [一级value, 二级value]
  const [sceneValue, setSceneValue] = useState<string[]>([])
  // 优先显示的二级选项索引（用于处理点击未显示选项的情况）
  const [priorityIndex, setPriorityIndex] = useState<number>(-1)
  // 容器宽度
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 获取当前选中的一级选项的二级子选项
  const currentSecondLevelOptions = useMemo(() => {
    if (!sceneValue.length) return []
    const firstLevelValue = sceneValue[0]
    const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevelValue)
    return firstLevelOption?.children || []
  }, [sceneValue])

  // 获取当前选中的二级选项
  const selectedSecondLevel = useMemo(() => {
    if (sceneValue.length < 2) return null
    return sceneValue[1]
  }, [sceneValue])

  // 计算可以显示的按钮数量
  const visibleButtonsCount = useMemo(() => {
    if (!currentSecondLevelOptions.length) return 0
    // 使用容器宽度或窗口宽度作为回退
    const width = containerWidth || (typeof window !== 'undefined' ? window.innerWidth * 0.5 : 600)
    // 减去一些padding空间
    const availableWidth = width - 24
    return Math.max(0, Math.floor(availableWidth / ESTIMATED_BUTTON_WIDTH))
  }, [containerWidth, currentSecondLevelOptions.length])

  // 获取可见按钮的索引列表（考虑优先级）
  const visibleButtonIndices = useMemo(() => {
    if (!visibleButtonsCount || !currentSecondLevelOptions.length) return []

    const totalCount = currentSecondLevelOptions.length
    const count = Math.min(visibleButtonsCount, totalCount)

    // 如果有优先级索引，确保它在可见范围内
    if (priorityIndex >= 0 && priorityIndex < totalCount) {
      // 优先级选项放在第一个位置，其他选项顺延
      const indices: number[] = [priorityIndex]
      let beforeIndex = priorityIndex - 1
      let afterIndex = priorityIndex + 1

      while (indices.length < count) {
        // 优先填充后面的选项
        if (afterIndex < totalCount) {
          indices.push(afterIndex)
          afterIndex++
        } else if (beforeIndex >= 0) {
          indices.push(beforeIndex)
          beforeIndex--
        } else {
          break
        }
      }

      return indices
    }

    // 没有优先级时，按顺序显示前N个
    return Array.from({ length: count }, (_, i) => i)
  }, [visibleButtonsCount, currentSecondLevelOptions.length, priorityIndex])

  // 使用 ResizeObserver 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 处理级联选择器变化
  const handleSceneChange = useCallback((value: string[]) => {
    setSceneValue(value)
    // 重置优先级索引
    setPriorityIndex(-1)
  }, [])

  // 处理二级选项按钮点击
  const handleSecondLevelClick = useCallback(
    (option: SceneOption, index: number) => {
      // 如果点击的选项不在可见范围内，将其设为优先级
      if (!visibleButtonIndices.includes(index)) {
        setPriorityIndex(index)
      }
      // 更新级联选择器的值
      if (sceneValue.length > 0) {
        setSceneValue([sceneValue[0], option.value])
      }
    },
    [sceneValue, visibleButtonIndices]
  )

  // 处理级联选择器中二级菜单的选择
  const handleCascaderSelect = useCallback(
    (value: string[]) => {
      if (value.length >= 2) {
        const firstLevelValue = value[0]
        const secondLevelValue = value[1]
        const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevelValue)
        const secondLevelIndex =
          firstLevelOption?.children?.findIndex(child => child.value === secondLevelValue) ?? -1

        // 如果选择的二级选项不在可见范围内，设为优先级
        if (secondLevelIndex >= 0 && !visibleButtonIndices.includes(secondLevelIndex)) {
          setPriorityIndex(secondLevelIndex)
        }
      }
    },
    [visibleButtonIndices]
  )

  return {
    sceneValue,
    setSceneValue,
    currentSecondLevelOptions,
    selectedSecondLevel,
    visibleButtonIndices,
    handleSceneChange,
    handleSecondLevelClick,
    handleCascaderSelect,
    containerRef,
  }
}
