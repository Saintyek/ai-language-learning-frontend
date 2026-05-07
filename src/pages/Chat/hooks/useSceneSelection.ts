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

export interface UseSceneSelectionParams {
  /** 初始场景值，格式为 "一级场景value/二级场景value" */
  initialScenario?: string
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
 * 将场景字符串解析为数组
 * @param scenario 格式为 "一级场景value/二级场景value"
 * @returns [一级value, 二级value] 或空数组
 */
const parseScenario = (scenario: string | undefined): string[] => {
  if (!scenario) return []

  const parts = scenario.split('/')
  if (parts.length !== 2) return []

  const [firstLevelValue, secondLevelValue] = parts

  // 验证场景值是否存在
  const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevelValue)
  if (!firstLevelOption?.children) return []

  const secondLevelOption = firstLevelOption.children.find(
    child => child.value === secondLevelValue
  )
  if (!secondLevelOption) return []

  return [firstLevelValue, secondLevelValue]
}

/**
 * 场景选择逻辑 Hook
 * 管理级联选择器的值、二级选项的显示逻辑
 */
export default function useSceneSelection(
  params?: UseSceneSelectionParams
): UseSceneSelectionReturn {
  const { initialScenario } = params || {}

  // 级联选择器的值 [一级value, 二级value]
  const [sceneValue, setSceneValue] = useState<string[]>(() => parseScenario(initialScenario))
  // 容器宽度
  const [containerWidth, setContainerWidth] = useState(0)
  const [visibleButtonIndices, setVisibleButtonIndices] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFirstLevelRef = useRef<string | null>(null)
  // 用于确保组件已挂载后再更新状态
  const isMountedRef = useRef(false)

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

  // 组件挂载后设置标记
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 合并处理可见按钮索引的逻辑，避免多个 useEffect 冲突
  useEffect(() => {
    // 确保组件已挂载后再更新状态
    if (!isMountedRef.current) return

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
      // 如果一级场景变化，重新构建默认索引
      if (isFirstLevelChanged) {
        return buildDefaultIndices(count)
      }

      // 规范化现有索引
      const normalizedPrev = normalizeVisibleIndices(prev, totalCount, count)

      // 如果有选中的二级场景且不在可见列表中，将其添加到最前面
      if (selectedSecondLevelIndex >= 0 && !normalizedPrev.includes(selectedSecondLevelIndex)) {
        return [selectedSecondLevelIndex, ...normalizedPrev].slice(0, count)
      }

      return normalizedPrev
    })
  }, [
    currentFirstLevel,
    currentSecondLevelOptions.length,
    visibleButtonsCount,
    selectedSecondLevelIndex,
  ])

  // 使用 ResizeObserver 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      // 确保组件已挂载后再更新状态
      if (!isMountedRef.current) return
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
