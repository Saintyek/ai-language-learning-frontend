// src/utils/segmentation/types.ts

/** 支持的语言类型 */
export type Language = 'zh' | 'ja' | 'ko' | 'en' | 'mixed'

/** 分词器接口 */
export interface Segmenter {
  /** 将文本分割为词语数组 */
  segment(text: string): string[]
}

/** 分词结果 */
export interface SegmentationResult {
  words: string[]
  language: Language
}
