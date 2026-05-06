// src/utils/segmentation/segmenters/spanish.ts

import type { Segmenter } from '../types'

/**
 * 西班牙语分词器
 * 按空格分割，处理西班牙语特有的缩合词和标点符号
 */
export class SpanishSegmenter implements Segmenter {
  // 西班牙语缩合词（需要拆分）
  private static readonly CONTRACTIONS = [
    { contraction: 'del', parts: ['de', 'el'] },
    { contraction: 'al', parts: ['a', 'el'] },
    { contraction: 'Del', parts: ['De', 'el'] },
    { contraction: 'Al', parts: ['A', 'el'] },
  ]

  segment(text: string): string[] {
    const result: string[] = []

    // 1. 按空格分割
    const tokens = text.split(/(\s+)/)

    for (const token of tokens) {
      if (!token) continue

      // 空格保留
      if (/^\s+$/.test(token)) {
        result.push(token)
        continue
      }

      // 2. 处理缩合词
      let processed = this.expandContractions(token)

      // 3. 分离标点符号
      processed = this.separatePunctuation(processed)

      result.push(...processed)
    }

    return result
  }

  /**
   * 展开缩合词
   */
  private expandContractions(token: string): string[] {
    for (const { contraction, parts } of SpanishSegmenter.CONTRACTIONS) {
      if (token.toLowerCase() === contraction.toLowerCase()) {
        return parts
      }
    }
    return [token]
  }

  /**
   * 分离标点符号
   */
  private separatePunctuation(tokens: string[]): string[] {
    const result: string[] = []

    for (const token of tokens) {
      // 匹配开头和结尾的标点符号
      const match = token.match(/^([¿¡]*)([^¿¡?!,.¿¡]+)([?!,.¿¡]*)$/)

      if (match) {
        const [, leadingPunct, word, trailingPunct] = match

        if (leadingPunct) {
          result.push(leadingPunct)
        }
        if (word) {
          result.push(word)
        }
        if (trailingPunct) {
          result.push(trailingPunct)
        }
      } else {
        result.push(token)
      }
    }

    return result
  }
}
