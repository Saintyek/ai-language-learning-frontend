// src/utils/segmentation/detectLanguage.ts

import { Language } from './types'

/**
 * 检测文本的主要语言类型
 * 通过 Unicode 范围和字符特征判断
 */
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return 'en'
  }

  const chars = text.replace(/\s/g, '')

  let cjkCount = 0
  let hiraganaCount = 0
  let katakanaCount = 0
  let hangulCount = 0
  let latinCount = 0

  for (const char of chars) {
    const code = char.codePointAt(0) || 0

    // 平假名: U+3040-U+309F
    if (code >= 0x3040 && code <= 0x309f) {
      hiraganaCount++
      continue
    }

    // 片假名: U+30A0-U+30FF
    if (code >= 0x30a0 && code <= 0x30ff) {
      katakanaCount++
      continue
    }

    // 谚文(韩文): U+AC00-U+D7AF
    if (code >= 0xac00 && code <= 0xd7af) {
      hangulCount++
      continue
    }

    // CJK 统一汉字: U+4E00-U+9FFF
    if (code >= 0x4e00 && code <= 0x9fff) {
      cjkCount++
      continue
    }

    // 拉丁字母(英文): 基本拉丁 + 拉丁补充
    if (
      (code >= 0x0041 && code <= 0x005a) || // A-Z
      (code >= 0x0061 && code <= 0x007a) || // a-z
      (code >= 0x00c0 && code <= 0x00ff) // 拉丁补充
    ) {
      latinCount++
      continue
    }
  }

  const total = chars.length
  const hiraganaRatio = hiraganaCount / total
  const katakanaRatio = katakanaCount / total
  const hangulRatio = hangulCount / total
  const cjkRatio = cjkCount / total
  const latinRatio = latinCount / total

  // 日文判断: 存在平假名或片假名
  if (hiraganaRatio > 0.05 || katakanaRatio > 0.05) {
    return 'ja'
  }

  // 韩文判断: 存在谚文
  if (hangulRatio > 0.1) {
    return 'ko'
  }

  // 中文判断: CJK 字符占主导
  if (cjkRatio > 0.3) {
    return 'zh'
  }

  // 英文判断: 拉丁字母占主导
  if (latinRatio > 0.3) {
    return 'en'
  }

  // 混合语言
  return 'mixed'
}
