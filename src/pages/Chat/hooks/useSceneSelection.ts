import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { sceneOptions, type SceneOption } from '@/consts/scenes'

// 每个二级按钮的估计宽度（包含padding和gap）
const ESTIMATED_BUTTON_WIDTH = 100

const buildDefaultIndices = (count: number) => Array.from({ length: count }, (_, index) => index)

const normalizeVisibleIndices = (indices: number[], totalCount: number, count: number) => {
  const next: number[] = []
  const used = new Set<number>()

  for (const index of indices) {
    if (index >= 0 && index < totalCount && !used.has(index) && next.length < count) {
      next.push(index)
      used.add(index)
    }
  }

  for (let index = 0; index < totalCount && next.length < count; index += 1) {
    if (!used.has(index)) {
      next.push(index)
      used.add(index)
    }
  }

  return next
}

export interface UseSceneSelectionReturn {
  sceneValue: string[]
  setSceneValue: (value: string[]) => void
  currentSecondLevelOptions: SceneOption[]
  selectedSecondLevel: string | null
  visibleButtonIndices: number[]
  handleSceneChange: (value: string[]) => void
  handleSecondLevelClick: (option: SceneOption) => void
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * 场景选择逻辑 Hook
 * 管理级联选择器的值、二级选项的显示逻辑
 */
export default function useSceneSelection(): UseSceneSelectionReturn {
  // 级联选择器的值 [一级value, 二级value]
  const [sceneValue, setSceneValue] = useState<string[]>([])
  // 容器宽度
  const [containerWidth, setContainerWidth] = useState(0)
  const [visibleButtonIndices, setVisibleButtonIndices] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFirstLevelRef = useRef<string | null>(null)

  // 获取当前选中的一级选项的二级子选项
  const currentSecondLevelOptions = useMemo(() => {
    if (!sceneValue.length) return []
    const firstLevelValue = sceneValue[0]
    const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevelValue)
    return firstLevelOption?.children || []
  }, [sceneValue])

  const currentFirstLevel = sceneValue[0] ?? null

  // 获取当前选中的二级选项
  const selectedSecondLevel = useMemo(() => {
    if (sceneValue.length < 2) return null
    return sceneValue[1]
  }, [sceneValue])

  const selectedSecondLevelIndex = useMemo(() => {
    if (!selectedSecondLevel) return -1
    return currentSecondLevelOptions.findIndex(option => option.value === selectedSecondLevel)
  }, [currentSecondLevelOptions, selectedSecondLevel])

  // 计算可以显示的按钮数量
  const visibleButtonsCount = useMemo(() => {
    if (!currentSecondLevelOptions.length) return 0
    // 使用容器宽度或窗口宽度作为回退
    const width = containerWidth || (typeof window !== 'undefined' ? window.innerWidth * 0.5 : 600)
    // 减去一些padding空间
    const availableWidth = width - 24
    return Math.max(0, Math.floor(availableWidth / ESTIMATED_BUTTON_WIDTH))
  }, [containerWidth, currentSecondLevelOptions.length])

  useEffect(() => {
    const totalCount = currentSecondLevelOptions.length
    const count = Math.min(visibleButtonsCount, totalCount)

    if (!count) {
      setVisibleButtonIndices([])
      previousFirstLevelRef.current = currentFirstLevel
      return
    }

    const isFirstLevelChanged = previousFirstLevelRef.current !== currentFirstLevel
    previousFirstLevelRef.current = currentFirstLevel

    setVisibleButtonIndices(prev => {
      if (isFirstLevelChanged) {
        return buildDefaultIndices(count)
      }
      return normalizeVisibleIndices(prev, totalCount, count)
    })
  }, [currentFirstLevel, currentSecondLevelOptions.length, visibleButtonsCount])

  useEffect(() => {
    if (selectedSecondLevelIndex < 0) {
      return
    }

    const totalCount = currentSecondLevelOptions.length
    const count = Math.min(visibleButtonsCount, totalCount)

    if (!count) {
      return
    }

    setVisibleButtonIndices(prev => {
      const normalizedPrev = normalizeVisibleIndices(prev, totalCount, count)
      if (normalizedPrev.includes(selectedSecondLevelIndex)) {
        return normalizedPrev
      }

      return [selectedSecondLevelIndex, ...normalizedPrev].slice(0, count)
    })
  }, [currentSecondLevelOptions.length, selectedSecondLevelIndex, visibleButtonsCount])

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
  }, [])

  // 处理二级选项按钮点击
  const handleSecondLevelClick = useCallback((option: SceneOption) => {
    setSceneValue(prev => {
      if (!prev.length) {
        return prev
      }
      return [prev[0], option.value]
    })
  }, [])

  return {
    sceneValue,
    setSceneValue,
    currentSecondLevelOptions,
    selectedSecondLevel,
    visibleButtonIndices,
    handleSceneChange,
    handleSecondLevelClick,
    containerRef,
  }
}
