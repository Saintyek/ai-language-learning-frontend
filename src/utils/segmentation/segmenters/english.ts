// src/utils/segmentation/segmenters/english.ts

import type { Segmenter } from '../types'

/**
 * 英文分词器
 * 按空格分割，保留标点符号作为独立 token
 */
export class EnglishSegmenter implements Segmenter {
  segment(text: string): string[] {
    const result: string[] = []
    let current = ''

    for (const char of text) {
      // 空格：结束当前 token
      if (/[\s]/.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
      }
      // 标点符号：作为独立 token
      else if (/[.,!?;:'"()[\]{}]/.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        result.push(char)
      }
      // 普通字符：累积到当前 token
      else {
        current += char
      }
    }

    // 处理最后一个 token
    if (current) {
      result.push(current)
    }

    return result
  }
}
