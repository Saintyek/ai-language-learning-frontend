import type { Segmenter } from '../types'

/**
 * 英文分词器
 * 按单词分词，保留缩写词（如 how's, don't），保留空格和标点符号
 */
export class EnglishSegmenter implements Segmenter {
  // 匹配连续空白字符
  private static readonly WHITESPACE_PATTERN = /^\s+/
  // 匹配单词（包括缩写词如 how's, don't, I'm）
  private static readonly WORD_PATTERN = /^[a-zA-Z]+(?:'[a-zA-Z]+)*/
  // 匹配数字
  private static readonly NUMBER_PATTERN = /^\d+(?:\.\d+)?/
  // 匹配标点符号
  private static readonly PUNCTUATION_PATTERN = /^[.,!?;:"()[\]{}]/

  segment(text: string): string[] {
    const result: string[] = []
    let remaining = text

    while (remaining.length > 0) {
      // 1. 处理空白字符：保留空格作为单独的 token
      const whitespaceMatch = remaining.match(EnglishSegmenter.WHITESPACE_PATTERN)
      if (whitespaceMatch) {
        result.push(whitespaceMatch[0])
        remaining = remaining.slice(whitespaceMatch[0].length)
        continue
      }

      // 2. 处理单词（包括缩写词）
      const wordMatch = remaining.match(EnglishSegmenter.WORD_PATTERN)
      if (wordMatch) {
        result.push(wordMatch[0])
        remaining = remaining.slice(wordMatch[0].length)
        continue
      }

      // 3. 处理数字
      const numberMatch = remaining.match(EnglishSegmenter.NUMBER_PATTERN)
      if (numberMatch) {
        result.push(numberMatch[0])
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }

      // 4. 处理标点符号
      const punctMatch = remaining.match(EnglishSegmenter.PUNCTUATION_PATTERN)
      if (punctMatch) {
        result.push(punctMatch[0])
        remaining = remaining.slice(punctMatch[0].length)
        continue
      }

      // 5. 其他字符作为单独 token
      result.push(remaining[0])
      remaining = remaining.slice(1)
    }

    return result
  }
}
