// src/utils/segmentation/segmenters/chinese.ts

import * as segmentitModule from 'segmentit'
import type { Segmenter } from '../types'

// 获取 Segment 和 useDefault（兼容 Vite 和 Node.js 环境）
const Segment = segmentitModule.Segment
const useDefault = segmentitModule.useDefault

// 初始化分词器实例（单例）
let segmentitInstance: ReturnType<typeof useDefault<typeof Segment>> | null = null

function getSegmentitInstance() {
  if (!segmentitInstance) {
    segmentitInstance = useDefault(new Segment())
  }
  return segmentitInstance
}

/**
 * 中文分词器
 * 使用 segmentit 库进行语义分词，支持词性标注
 */
export class ChineseSegmenter implements Segmenter {
  // 中文标点符号（用于后续处理）
  private static readonly PUNCTUATION = /[，。！？；：'"（）【】「」『』、,.!?;:'"()\[\]{}]/

  segment(text: string): string[] {
    const segmentit = getSegmentitInstance()

    // 使用 segmentit 进行分词
    const segments = segmentit.doSegment(text)

    // 提取词语，保留原始顺序
    return segments.map(seg => seg.w)
  }
}

// 创建单例实例
export const chineseSegmenter = new ChineseSegmenter()
