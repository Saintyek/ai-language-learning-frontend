import { useMemo } from 'react'
import {
  getDigitalHumanVideoSet,
  type DigitalHumanState,
  type DigitalHumanVideoSet,
} from '@/consts/digitalHuman'

/**
 * 数字人状态 Hook 入参
 * 由上层把"是否在说话"的合成信号传入，本 hook 只负责映射成视频资源与状态
 */
export interface UseDigitalHumanProps {
  /** 当前学习语言代码，决定使用哪一套视频素材 */
  langCode?: string
  /** 是否处于"说话中"状态（由 TTS 播放或实时语音播放任一为真触发） */
  isSpeaking: boolean
}

export interface UseDigitalHumanReturn {
  /** 当前语言对应的视频资源（idle 与 talking 两段） */
  videoSet: DigitalHumanVideoSet
  /** 当前应展示的状态：talking 或 idle */
  state: DigitalHumanState
}

/**
 * 数字人状态 Hook
 *
 * 职责单一：把"语言 + 是否说话"两个输入，转成"视频资源 + 当前状态"
 * 不订阅任何全局事件，所有副作用上提到调用方，方便复用与测试
 */
export default function useDigitalHuman({
  langCode,
  isSpeaking,
}: UseDigitalHumanProps): UseDigitalHumanReturn {
  // 语言变化时才重新计算视频集合，避免 panel 不必要的重渲染
  const videoSet = useMemo(() => getDigitalHumanVideoSet(langCode), [langCode])

  // 状态切换的判定逻辑，集中在这里便于以后扩展（如增加 thinking 态）
  const state: DigitalHumanState = isSpeaking ? 'talking' : 'idle'

  return { videoSet, state }
}
