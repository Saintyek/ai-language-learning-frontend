// src/utils/segmentation/segmenters/index.ts

import type { Segmenter, Language } from '../types'
import { EnglishSegmenter } from './english'
import { SpanishSegmenter } from './spanish'
import { JapaneseSegmenter } from './japanese'
import { ChineseSegmenter, chineseSegmenter } from './chinese'

// 分词器实例缓存
const segmenters: Partial<Record<Language, Segmenter>> = {}

/**
 * 获取对应语言的分词器
 */
export function getSegmenter(language: Language): Segmenter {
  // 返回缓存的实例
  if (segmenters[language]) {
    return segmenters[language]!
  }

  // 创建新实例
  let segmenter: Segmenter

  switch (language) {
    case 'zh':
      segmenter = chineseSegmenter
      break
    case 'ja':
      segmenter = new JapaneseSegmenter()
      break
    case 'es':
      segmenter = new SpanishSegmenter()
      break
    case 'en':
    case 'mixed':
    default:
      segmenter = new EnglishSegmenter()
      break
  }

  segmenters[language] = segmenter
  return segmenter
}

// 导出所有分词器
export { EnglishSegmenter } from './english'
export { SpanishSegmenter } from './spanish'
export { JapaneseSegmenter } from './japanese'
export { ChineseSegmenter, chineseSegmenter } from './chinese'
