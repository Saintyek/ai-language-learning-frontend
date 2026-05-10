/**
 * 数字人视频素材映射
 *
 * 设计说明：
 * - 采用"双循环视频假装在说话"方案，不调用任何远端数字人接口
 * - 每个语言对应两段视频：idle（空闲循环）和 talking（说话循环）
 * - 视频文件统一放置于 public 根目录下，构建时直接以绝对路径引用
 * - 语言代码沿用 src/consts/languages.ts 中的 cn / jp / es / us
 */

/** 数字人视频两态枚举 */
export type DigitalHumanState = 'idle' | 'talking'

/** 单个语言对应的视频资源 */
export interface DigitalHumanVideoSet {
  idle: string
  talking: string
}

/** 默认语言 fallback：当 langCode 缺失或非法时使用 */
const DEFAULT_LANG_CODE = 'cn'

/**
 * 语言代码 → 视频资源映射
 * 路径相对 public 目录，浏览器以 / 开头访问
 */
const DIGITAL_HUMAN_VIDEO_MAP: Record<string, DigitalHumanVideoSet> = {
  cn: { idle: '/cn-idle.mp4', talking: '/cn-talking.mp4' },
  jp: { idle: '/jp-idle.mp4', talking: '/jp-talking.mp4' },
  es: { idle: '/es-idle.mp4', talking: '/es-talking.mp4' },
  us: { idle: '/us-idle.mp4', talking: '/us-talking.mp4' },
}

/**
 * 根据语言代码获取该语言对应的数字人视频资源
 * 未命中时回落到默认语言，避免 panel 出现空源黑屏
 */
export function getDigitalHumanVideoSet(langCode?: string): DigitalHumanVideoSet {
  if (langCode && DIGITAL_HUMAN_VIDEO_MAP[langCode]) {
    return DIGITAL_HUMAN_VIDEO_MAP[langCode]
  }
  return DIGITAL_HUMAN_VIDEO_MAP[DEFAULT_LANG_CODE]
}
