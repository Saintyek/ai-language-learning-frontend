// src/utils/segmentation/segmenters/chinese.ts

import type { Segmenter } from '../types'

/**
 * 中文分词器
 * 使用简单的规则进行分词，保留标点符号
 */
export class ChineseSegmenter implements Segmenter {
  // 中文标点符号
  private static readonly PUNCTUATION = /[，。！？；：'"（）【】「」『』、,.!?;:'"()\[\]{}]/

  segment(text: string): string[] {
    const result: string[] = []
    let current = ''

    for (const char of text) {
      // 空白字符：结束当前词，空格也加入结果（用于显示，但不作为可点击词）
      if (/[\s]/.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        result.push(char) // 保留空格
        continue
      }

      // 标点符号：结束当前词，标点单独成词
      if (ChineseSegmenter.PUNCTUATION.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        result.push(char)
        continue
      }

      // 普通字符：累积到当前词
      current += char
    }

    // 处理最后一个词
    if (current) {
      result.push(current)
    }

    return result
  }
}

// 创建单例实例
export const chineseSegmenter = new ChineseSegmenter()
