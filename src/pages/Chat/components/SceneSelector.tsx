import React, { useCallback } from 'react'
import { IconChevronRight, IconChevronUp } from '@douyinfe/semi-icons'
import { Cascader, Button } from '@douyinfe/semi-ui'
import { sceneOptions, type SceneOption } from '@/consts/scenes'
import type { UseSceneSelectionReturn } from '../hooks/useSceneSelection'

interface SceneSelectorProps extends UseSceneSelectionReturn {
  sceneDropdownVisible: boolean
  setSceneDropdownVisible: (visible: boolean) => void
}

/**
 * 场景选择器组件
 * 包含级联选择器和二级选项按钮
 */
export const SceneSelector: React.FC<SceneSelectorProps> = ({
  sceneValue,
  currentSecondLevelOptions,
  selectedSecondLevel,
  visibleButtonIndices,
  containerRef,
  sceneDropdownVisible,
  setSceneDropdownVisible,
  handleSceneChange,
  handleSecondLevelClick,
}) => {
  const renderSceneButtons = useCallback(() => {
    if (!currentSecondLevelOptions.length) return null

    return (
      <div
        ref={containerRef}
        className="chat-scene-buttons-container"
        style={{
          display: 'flex',
          gap: 8,
          overflow: 'hidden',
          flexWrap: 'nowrap',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
        }}
      >
        {visibleButtonIndices.map(index => {
          const option = currentSecondLevelOptions[index]
          if (!option) {
            return null
          }

          const isSelected = selectedSecondLevel === option.value

          return (
            <Button
              key={option.value}
              theme={isSelected ? 'solid' : 'borderless'}
              type={isSelected ? 'primary' : 'tertiary'}
              onClick={() => handleSecondLevelClick(option)}
              style={{
                borderRadius: 16,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.08)',
                color: isSelected ? '#ffffff' : '#2563eb',
                border: isSelected ? 'none' : '1px solid rgba(59, 130, 246, 0.22)',
              }}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    )
  }, [
    currentSecondLevelOptions,
    selectedSecondLevel,
    visibleButtonIndices,
    containerRef,
    handleSecondLevelClick,
  ])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <Cascader
        className="aiChatInput-cascader-configure"
        treeData={sceneOptions}
        value={sceneValue}
        position="topLeft"
        dropdownClassName="chat-scene-cascader-dropdown"
        arrowIcon={sceneDropdownVisible ? <IconChevronRight /> : <IconChevronUp />}
        onDropdownVisibleChange={setSceneDropdownVisible}
        onChange={value => handleSceneChange(Array.isArray(value) ? value.map(String) : [])}
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
          flexShrink: 0,
        }}
      />
      {renderSceneButtons()}
    </div>
  )
}

export default SceneSelector
