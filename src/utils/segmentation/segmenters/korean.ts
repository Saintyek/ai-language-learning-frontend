// src/utils/segmentation/segmenters/korean.ts

import type { Segmenter } from '../types'

/**
 * 韩文分词器
 * 按空格分割，分离常见助词和词尾后缀
 */
export class KoreanSegmenter implements Segmenter {
  // 韩文常见助词、词尾后缀
  private static readonly SUFFIXES = [
    '은',
    '는',
    '이',
    '가',
    '을',
    '를',
    '에',
    '에서',
    '으로',
    '로',
    '와',
    '과',
    '도',
    '만',
    '부터',
    '까지',
    '하다',
    '했다',
    '합니다',
    '입니다',
    '습니다',
    '어요',
    '아요',
    '였다',
    '였어',
    '예요',
    '이에요',
    '네요',
    '군요',
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

      // 2. 尝试分离后缀
      let found = false
      for (const suffix of KoreanSegmenter.SUFFIXES) {
        if (token.endsWith(suffix) && token.length > suffix.length) {
          result.push(token.slice(0, -suffix.length))
          result.push(suffix)
          found = true
          break
        }
      }

      if (!found) {
        result.push(token)
      }
    }

    return result
  }
}
