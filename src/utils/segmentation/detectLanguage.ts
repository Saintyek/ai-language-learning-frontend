import type { Language } from './types'

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
  let spanishSpecialCount = 0
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

    // 西班牙语特有字符: ñ, á, é, í, ó, ú, ü, ¿, ¡
    if (
      code === 0x00f1 || // ñ
      code === 0x00d1 || // Ñ
      code === 0x00e1 || // á
      code === 0x00c1 || // Á
      code === 0x00e9 || // é
      code === 0x00c9 || // É
      code === 0x00ed || // í
      code === 0x00cd || // Í
      code === 0x00f3 || // ó
      code === 0x00d3 || // Ó
      code === 0x00fa || // ú
      code === 0x00da || // Ú
      code === 0x00fc || // ü
      code === 0x00dc || // Ü
      code === 0x00bf || // ¿
      code === 0x00a1 // ¡
    ) {
      spanishSpecialCount++
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
  const spanishSpecialRatio = spanishSpecialCount / total
  const cjkRatio = cjkCount / total
  const latinRatio = latinCount / total

  // 日文判断: 存在平假名或片假名
  if (hiraganaRatio > 0.05 || katakanaRatio > 0.05) {
    return 'ja'
  }

  // 西班牙语判断: 存在西班牙语特有字符
  if (spanishSpecialRatio > 0.02) {
    return 'es'
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
