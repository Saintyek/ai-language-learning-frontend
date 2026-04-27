import { sceneOptions, type SceneOption } from '@/consts/scenes'

/**
 * 场景字符串格式: "一级场景值/二级场景值"
 * 例如: "role/扮演老师"
 */

/**
 * 解析场景字符串，返回一级和二级场景值
 */
export function parseScenario(scenario: string | null): {
  firstLevel: string | null
  secondLevel: string | null
} {
  if (!scenario) {
    return { firstLevel: null, secondLevel: null }
  }

  const parts = scenario.split('/')
  return {
    firstLevel: parts[0] || null,
    secondLevel: parts[1] || null,
  }
}

/**
 * 根据场景字符串获取显示标签
 * 返回二级场景的标签（如果存在），否则返回一级场景标签
 */
export function getScenarioLabel(scenario: string | null): string | null {
  const { firstLevel, secondLevel } = parseScenario(scenario)

  if (!firstLevel) {
    return null
  }

  // 查找一级场景
  const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevel)

  if (!firstLevelOption) {
    return null
  }

  // 如果有二级场景，查找并返回二级标签
  if (secondLevel && firstLevelOption.children) {
    const secondLevelOption = firstLevelOption.children.find(opt => opt.value === secondLevel)
    if (secondLevelOption) {
      return secondLevelOption.label
    }
  }

  // 如果没有二级场景或找不到二级标签，返回一级标签
  return firstLevelOption.label
}

/**
 * 根据场景字符串获取完整的场景路径标签
 * 例如: "角色 / 扮演老师"
 */
export function getScenarioFullPath(scenario: string | null): string | null {
  const { firstLevel, secondLevel } = parseScenario(scenario)

  if (!firstLevel) {
    return null
  }

  const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevel)

  if (!firstLevelOption) {
    return null
  }

  if (secondLevel && firstLevelOption.children) {
    const secondLevelOption = firstLevelOption.children.find(opt => opt.value === secondLevel)
    if (secondLevelOption) {
      return `${firstLevelOption.label} / ${secondLevelOption.label}`
    }
  }

  return firstLevelOption.label
}

/**
 * 根据场景字符串获取场景选项对象
 */
export function getScenarioOptions(scenario: string | null): {
  firstLevelOption: SceneOption | null
  secondLevelOption: SceneOption | null
} {
  const { firstLevel, secondLevel } = parseScenario(scenario)

  if (!firstLevel) {
    return { firstLevelOption: null, secondLevelOption: null }
  }

  const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevel) || null

  if (!firstLevelOption || !secondLevel) {
    return { firstLevelOption, secondLevelOption: null }
  }

  const secondLevelOption =
    firstLevelOption.children?.find(opt => opt.value === secondLevel) || null

  return { firstLevelOption, secondLevelOption }
}

/**
 * 将场景字符串转换为场景值数组（用于 Cascader 组件）
 */
export function scenarioToValueArray(scenario: string | null): string[] {
  const { firstLevel, secondLevel } = parseScenario(scenario)

  if (!firstLevel) {
    return []
  }

  if (!secondLevel) {
    return [firstLevel]
  }

  return [firstLevel, secondLevel]
}
