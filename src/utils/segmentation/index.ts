// src/utils/segmentation/index.ts

// 类型
export type { Language, Segmenter, SegmentationResult } from './types'

// 语言检测
export { detectLanguage } from './detectLanguage'

// 分词器
export { getSegmenter, chineseSegmenter } from './segmenters'

// DOM 处理
export {
  processTextNodes,
  clearProcessedNodes,
  isProcessed,
  setWordClickCallback,
} from './domProcessor'
