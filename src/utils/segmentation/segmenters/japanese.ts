// src/utils/segmentation/segmenters/japanese.ts

import type { Segmenter } from '../types'

/**
 * 日文分词器
 * 使用简单的形态素分割规则
 */
export class JapaneseSegmenter implements Segmenter {
  // 常见日文助词
  private static readonly PARTICLES = [
    'は',
    'が',
    'を',
    'に',
    'で',
    'と',
    'の',
    'へ',
    'や',
    'も',
    'か',
    'ね',
    'よ',
    'わ',
    'ねえ',
    'かな',
    'かしら',
  ]

  // 常见动词词尾
  private static readonly VERB_ENDINGS = [
    'ます',
    'ました',
    'ません',
    'ましょう',
    'て',
    'た',
    'だ',
    'ない',
    'いる',
    'ある',
    'なる',
    'する',
    'られる',
    'できる',
  ]

  segment(text: string): string[] {
    const result: string[] = []
    let current = ''

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const remaining = text.slice(i)

      // 检查是否匹配助词或词尾
      let matched = false

      // 检查动词词尾
      for (const ending of JapaneseSegmenter.VERB_ENDINGS) {
        if (remaining.startsWith(ending)) {
          if (current) {
            result.push(current)
            current = ''
          }
          result.push(ending)
          i += ending.length - 1
          matched = true
          break
        }
      }

      if (matched) continue

      // 检查助词
      for (const particle of JapaneseSegmenter.PARTICLES) {
        if (remaining.startsWith(particle)) {
          if (current) {
            result.push(current)
            current = ''
          }
          result.push(particle)
          i += particle.length - 1
          matched = true
          break
        }
      }

      if (matched) continue

      // 空格处理
      if (/[\s]/.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        continue
      }

      // 平假名连续出现时可能是一个词
      if (this.isHiragana(char)) {
        current += char
        continue
      }

      // 片假名单独成词
      if (this.isKatakana(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        // 收集连续的片假名
        let katakana = char
        while (i + 1 < text.length && this.isKatakana(text[i + 1])) {
          katakana += text[++i]
        }
        result.push(katakana)
        continue
      }

      // 汉字
      if (this.isKanji(char)) {
        if (current && !this.isHiragana(current[current.length - 1])) {
          result.push(current)
          current = ''
        }
        current += char
        continue
      }

      // 其他字符
      current += char
    }

    // 处理最后一个 token
    if (current) {
      result.push(current)
    }

    return result
  }

  private isHiragana(char: string): boolean {
    const code = char.codePointAt(0) || 0
    return code >= 0x3040 && code <= 0x309f
  }

  private isKatakana(char: string): boolean {
    const code = char.codePointAt(0) || 0
    return code >= 0x30a0 && code <= 0x30ff
  }

  private isKanji(char: string): boolean {
    const code = char.codePointAt(0) || 0
    return code >= 0x4e00 && code <= 0x9fff
  }
}
