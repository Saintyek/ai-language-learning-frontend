# 智能短语选择功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现智能短语选择功能，用户悬停时自动高亮整个语义短语，点击触发翻译弹窗，支持中英日韩四种语言。

**Architecture:** 采用 DOM 后处理 + 事件委托方案。消息渲染后遍历文本节点分词，用 `<span data-word>` 包裹每个词，通过事件委托处理悬停和点击交互。

**Tech Stack:** React, TypeScript, Tailwind CSS, segmentit (中文分词), tiny-segmenter (日文分词)

---

## 文件结构

| 文件路径 | 职责 | 操作 |
|----------|------|------|
| `src/utils/segmentation/types.ts` | 分词器类型定义 | 创建 |
| `src/utils/segmentation/detectLanguage.ts` | 语言检测函数 | 创建 |
| `src/utils/segmentation/segmenters/english.ts` | 英文分词器 | 创建 |
| `src/utils/segmentation/segmenters/korean.ts` | 韩文分词器 | 创建 |
| `src/utils/segmentation/segmenters/japanese.ts` | 日文分词器 | 创建 |
| `src/utils/segmentation/segmenters/chinese.ts` | 中文分词器 | 创建 |
| `src/utils/segmentation/segmenters/index.ts` | 分词器工厂函数 | 创建 |
| `src/utils/segmentation/domProcessor.ts` | DOM 处理器 | 创建 |
| `src/utils/segmentation/index.ts` | 统一导出 | 创建 |
| `src/hooks/useSmartSelection.ts` | 智能选词 Hook | 创建 |
| `src/pages/Chat/components/ChatDialogArea.tsx` | 集成智能选词 | 修改 |
| `src/index.css` | 添加智能选词样式 | 修改 |
| `src/components/TranslateModal/index.tsx` | 更新类型兼容 | 修改 |

---

## Task 1: 安装分词依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装分词库依赖**

运行命令:
```bash
pnpm add segmentit tiny-segmenter
```

Expected: 依赖安装成功，`package.json` 中添加了 `segmentit` 和 `tiny-segmenter`

---

## Task 2: 创建分词器类型定义

**Files:**
- Create: `src/utils/segmentation/types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/utils/segmentation/types.ts

/** 支持的语言类型 */
export type Language = 'zh' | 'ja' | 'ko' | 'en' | 'mixed'

/** 分词器接口 */
export interface Segmenter {
  /** 将文本分割为词语数组 */
  segment(text: string): string[]
}

/** 分词结果 */
export interface SegmentationResult {
  words: string[]
  language: Language
}
```

---

## Task 3: 创建语言检测函数

**Files:**
- Create: `src/utils/segmentation/detectLanguage.ts`

- [ ] **Step 1: 创建语言检测函数**

```typescript
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
      (code >= 0x00c0 && code <= 0x00ff)    // 拉丁补充
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
```

---

## Task 4: 创建英文分词器

**Files:**
- Create: `src/utils/segmentation/segmenters/english.ts`

- [ ] **Step 1: 创建英文分词器**

```typescript
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
```

---

## Task 5: 创建韩文分词器

**Files:**
- Create: `src/utils/segmentation/segmenters/korean.ts`

- [ ] **Step 1: 创建韩文分词器**

```typescript
// src/utils/segmentation/segmenters/korean.ts

import type { Segmenter } from '../types'

/**
 * 韩文分词器
 * 按空格分割，分离常见助词和词尾后缀
 */
export class KoreanSegmenter implements Segmenter {
  // 韩文常见助词、词尾后缀
  private static readonly SUFFIXES = [
    '은', '는', '이', '가', '을', '를', '에', '에서',
    '으로', '로', '와', '과', '도', '만', '부터', '까지',
    '하다', '했다', '합니다', '입니다', '습니다', '어요', '아요',
    '였다', '였어', '예요', '이에요', '네요', '군요',
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
```

---

## Task 6: 创建日文分词器

**Files:**
- Create: `src/utils/segmentation/segmenters/japanese.ts`

- [ ] **Step 1: 创建日文分词器**

```typescript
// src/utils/segmentation/segmenters/japanese.ts

import type { Segmenter } from '../types'

/**
 * 日文分词器
 * 使用简单的形态素分割规则
 */
export class JapaneseSegmenter implements Segmenter {
  // 常见日文助词
  private static readonly PARTICLES = [
    'は', 'が', 'を', 'に', 'で', 'と', 'の', 'へ', 'や', 'も',
    'か', 'ね', 'よ', 'わ', 'ねえ', 'かな', 'かしら',
  ]

  // 常见动词词尾
  private static readonly VERB_ENDINGS = [
    'ます', 'ました', 'ません', 'ましょう', 'て', 'た', 'だ', 'ない',
    'いる', 'ある', 'なる', 'する', 'られる', 'できる',
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
```

---

## Task 7: 创建中文分词器

**Files:**
- Create: `src/utils/segmentation/segmenters/chinese.ts`

- [ ] **Step 1: 创建中文分词器**

```typescript
// src/utils/segmentation/segmenters/chinese.ts

import type { Segmenter } from '../types'

// 动态导入 segmentit，避免 SSR 问题
let SegmentitClass: any = null

/**
 * 中文分词器
 * 使用 segmentit 库进行分词
 */
export class ChineseSegmenter implements Segmenter {
  private segmentit: any = null
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      // 动态导入
      const module = await import('segmentit')
      SegmentitClass = module.default || module
      this.segmentit = new SegmentitClass()
      this.segmentit.useDefault()
      this.initialized = true
    } catch (error) {
      console.error('Failed to load segmentit:', error)
      // 降级为单字分词
      this.initialized = true
    }
  }

  segment(text: string): string[] {
    // 如果未初始化或加载失败，使用简单的标点分割
    if (!this.segmentit) {
      return this.fallbackSegment(text)
    }

    try {
      const result = this.segmentit.doSegment(text, {
        simple: true,
        stripPunctuation: false,
      })
      return result || this.fallbackSegment(text)
    } catch {
      return this.fallbackSegment(text)
    }
  }

  /**
   * 降级分词：按标点符号分割
   */
  private fallbackSegment(text: string): string[] {
    const result: string[] = []
    const pattern = /[\s.,!?;:'"()[\]{}，。！？；：'"（）【】「」『』]/

    let current = ''
    for (const char of text) {
      if (pattern.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
        result.push(char)
      } else {
        current += char
      }
    }

    if (current) {
      result.push(current)
    }

    return result
  }
}

// 创建单例实例
export const chineseSegmenter = new ChineseSegmenter()
```

---

## Task 8: 创建分词器工厂函数

**Files:**
- Create: `src/utils/segmentation/segmenters/index.ts`

- [ ] **Step 1: 创建分词器工厂函数**

```typescript
// src/utils/segmentation/segmenters/index.ts

import type { Segmenter, Language } from '../types'
import { EnglishSegmenter } from './english'
import { KoreanSegmenter } from './korean'
import { JapaneseSegmenter } from './japanese'
import { ChineseSegmenter, chineseSegmenter } from './chinese'

// 分词器实例缓存
const segmenters: Partial<Record<Language, Segmenter>> = {}

/**
 * 获取对应语言的分词器
 */
export function getSegmenter(language: Language): Segmenter {
  // 返回缓存的实例
  if (segmenters[language]) {
    return segmenters[language]!
  }

  // 创建新实例
  let segmenter: Segmenter

  switch (language) {
    case 'zh':
      segmenter = chineseSegmenter
      break
    case 'ja':
      segmenter = new JapaneseSegmenter()
      break
    case 'ko':
      segmenter = new KoreanSegmenter()
      break
    case 'en':
    case 'mixed':
    default:
      segmenter = new EnglishSegmenter()
      break
  }

  segmenters[language] = segmenter
  return segmenter
}

// 导出所有分词器
export { EnglishSegmenter } from './english'
export { KoreanSegmenter } from './korean'
export { JapaneseSegmenter } from './japanese'
export { ChineseSegmenter, chineseSegmenter } from './chinese'
```

---

## Task 9: 创建 DOM 处理器

**Files:**
- Create: `src/utils/segmentation/domProcessor.ts`

- [ ] **Step 1: 创建 DOM 处理器**

```typescript
// src/utils/segmentation/domProcessor.ts

import { detectLanguage } from './detectLanguage'
import { getSegmenter } from './segmenters'

const DATA_WORD_ATTR = 'data-word'
const SMART_WORD_CLASS = 'smart-word'

// 排除处理的标签
const EXCLUDED_TAGS = ['code', 'pre', 'script', 'style', 'a', 'button', 'input', 'textarea']

/**
 * 处理容器内的文本节点，进行分词并包裹 span
 */
export function processTextNodes(container: HTMLElement): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node): number => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT

        // 排除特定标签内的文本
        const tagName = parent.tagName.toLowerCase()
        if (EXCLUDED_TAGS.includes(tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        // 排除已处理的节点
        if (parent.hasAttribute(DATA_WORD_ATTR)) {
          return NodeFilter.FILTER_REJECT
        }

        // 排除空文本
        const text = node.textContent
        if (!text || !text.trim()) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  // 收集所有需要处理的文本节点
  const textNodes: Text[] = []
  let node: Text | null
  while ((node = walker.nextNode() as Text)) {
    textNodes.push(node)
  }

  // 处理每个文本节点
  for (const textNode of textNodes) {
    processTextNode(textNode)
  }
}

/**
 * 处理单个文本节点
 */
function processTextNode(textNode: Text): void {
  const text = textNode.textContent
  if (!text || !text.trim()) return

  const language = detectLanguage(text)
  const segmenter = getSegmenter(language)
  const words = segmenter.segment(text)

  if (words.length === 0) return

  // 创建文档片段替换原文本节点
  const fragment = document.createDocumentFragment()

  for (const word of words) {
    if (!word) continue

    // 空白字符不包裹
    if (/^\s+$/.test(word)) {
      fragment.appendChild(document.createTextNode(word))
      continue
    }

    const span = document.createElement('span')
    span.setAttribute(DATA_WORD_ATTR, word)
    span.className = SMART_WORD_CLASS
    span.textContent = word
    fragment.appendChild(span)
  }

  textNode.parentNode?.replaceChild(fragment, textNode)
}

/**
 * 清除处理结果，恢复原始文本
 */
export function clearProcessedNodes(container: HTMLElement): void {
  const spans = container.querySelectorAll(`[${DATA_WORD_ATTR}]`)

  for (const span of spans) {
    const text = span.textContent
    if (text) {
      const textNode = document.createTextNode(text)
      span.parentNode?.replaceChild(textNode, span)
    }
  }
}

/**
 * 检查容器是否已处理
 */
export function isProcessed(container: HTMLElement): boolean {
  return container.querySelectorAll(`[${DATA_WORD_ATTR}]`).length > 0
}
```

---

## Task 10: 创建统一导出文件

**Files:**
- Create: `src/utils/segmentation/index.ts`

- [ ] **Step 1: 创建统一导出文件**

```typescript
// src/utils/segmentation/index.ts

// 类型
export type { Language, Segmenter, SegmentationResult } from './types'

// 语言检测
export { detectLanguage } from './detectLanguage'

// 分词器
export { getSegmenter, chineseSegmenter } from './segmenters'

// DOM 处理
export { processTextNodes, clearProcessedNodes, isProcessed } from './domProcessor'
```

---

## Task 11: 创建智能选词 Hook

**Files:**
- Create: `src/hooks/useSmartSelection.ts`

- [ ] **Step 1: 创建智能选词 Hook**

```typescript
// src/hooks/useSmartSelection.ts

import { useState, useEffect, useCallback, useRef } from 'react'

export interface SmartSelection {
  text: string
  position: {
    x: number
    y: number
  }
}

export interface UseSmartSelectionReturn {
  selection: SmartSelection | null
  hoveredWord: string | null
  clearSelection: () => void
}

const DATA_WORD_ATTR = 'data-word'
const HOVER_CLASS = 'smart-word--hover'

/**
 * 智能短语选择 Hook
 * 使用事件委托处理悬停和点击
 */
export function useSmartSelection(
  containerRef: React.RefObject<HTMLElement | null>
): UseSmartSelectionReturn {
  const [selection, setSelection] = useState<SmartSelection | null>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const currentHoveredSpan = useRef<HTMLSpanElement | null>(null)

  const clearSelection = useCallback(() => {
    setSelection(null)
    // 清除浏览器选中文本
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`[${DATA_WORD_ATTR}]`) as HTMLSpanElement | null

      if (!wordSpan) {
        // 移出词区域
        if (currentHoveredSpan.current) {
          currentHoveredSpan.current.classList.remove(HOVER_CLASS)
          currentHoveredSpan.current = null
          setHoveredWord(null)
        }
        return
      }

      // 悬停在新的词上
      if (wordSpan !== currentHoveredSpan.current) {
        // 清除旧的悬停
        if (currentHoveredSpan.current) {
          currentHoveredSpan.current.classList.remove(HOVER_CLASS)
        }

        // 设置新的悬停
        wordSpan.classList.add(HOVER_CLASS)
        currentHoveredSpan.current = wordSpan
        setHoveredWord(wordSpan.getAttribute(DATA_WORD_ATTR))
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`[${DATA_WORD_ATTR}]`)

      // 鼠标离开词区域
      if (!wordSpan && currentHoveredSpan.current) {
        // 检查是否移动到子元素
        const relatedTarget = event.relatedTarget as HTMLElement
        if (relatedTarget && currentHoveredSpan.current.contains(relatedTarget)) {
          return
        }
        currentHoveredSpan.current.classList.remove(HOVER_CLASS)
        currentHoveredSpan.current = null
        setHoveredWord(null)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wordSpan = target.closest(`[${DATA_WORD_ATTR}]`) as HTMLSpanElement | null

      if (!wordSpan) return

      const word = wordSpan.getAttribute(DATA_WORD_ATTR)
      if (!word) return

      // 获取位置
      const rect = wordSpan.getBoundingClientRect()

      setSelection({
        text: word,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
        },
      })

      // 阻止事件冒泡
      event.stopPropagation()
    }

    // 使用事件委托
    container.addEventListener('mouseover', handleMouseOver, true)
    container.addEventListener('mouseout', handleMouseOut, true)
    container.addEventListener('click', handleClick, true)

    return () => {
      container.removeEventListener('mouseover', handleMouseOver, true)
      container.removeEventListener('mouseout', handleMouseOut, true)
      container.removeEventListener('click', handleClick, true)

      // 清理悬停状态
      if (currentHoveredSpan.current) {
        currentHoveredSpan.current.classList.remove(HOVER_CLASS)
      }
    }
  }, [containerRef])

  return { selection, hoveredWord, clearSelection }
}
```

---

## Task 12: 添加智能选词样式

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 检查现有样式文件**

运行命令:
```bash
head -50 /Users/bytedance/code/ai-language-learning-frontend/src/index.css
```

Expected: 显示样式文件内容

- [ ] **Step 2: 添加智能选词样式**

在 `src/index.css` 文件末尾添加:

```css
/* 智能选词样式 */
.smart-word {
  cursor: pointer;
  display: inline;
  transition: background-color 0s;
}

.smart-word--hover {
  background-color: var(--semi-color-primary-light-default);
  border-radius: 2px;
}
```

---

## Task 13: 修改 ChatDialogArea 组件集成智能选词

**Files:**
- Modify: `src/pages/Chat/components/ChatDialogArea.tsx`

- [ ] **Step 1: 修改 ChatDialogArea 组件**

完整替换文件内容:

```typescript
import React, { useEffect, useRef } from 'react'
import { AIChatDialogue, Spin } from '@douyinfe/semi-ui'
import type { Message as AIChatMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation'
import { useSmartSelection } from '../../../hooks/useSmartSelection'
import { processTextNodes } from '../../../utils/segmentation'
import { TranslateModal } from '@/components/TranslateModal/index'

interface ChatDialogAreaProps {
  chats: AIChatMessage[]
  roleConfig: {
    user: { name: string; color: string }
    assistant: { name: string; color: string }
  }
  hintPrompts: string[]
  languageLabel: string
  onHintClick: (hint: string) => void
  loading?: boolean
}

/**
 * 聊天对话区域组件
 * 集成智能短语选择功能
 */
export const ChatDialogArea: React.FC<ChatDialogAreaProps> = ({
  chats,
  roleConfig,
  hintPrompts,
  languageLabel,
  onHintClick,
  loading,
}) => {
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用智能选词 Hook
  const { selection, clearSelection } = useSmartSelection(containerRef)

  // 当聊天内容变化时，处理文本节点
  useEffect(() => {
    if (!containerRef.current || chats.length === 0) return

    // 延迟处理，确保 DOM 已更新
    const timer = setTimeout(() => {
      if (containerRef.current) {
        processTextNodes(containerRef.current)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [chats])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <>
      {chats.length === 0 && (
        <div className="px-6 pt-6 text-center">
          <p className="text-lg font-semibold text-slate-700">开始你的{languageLabel}对话练习</p>
          <p className="mt-2 text-sm text-slate-500">
            试试下面的建议开场语，或者直接输入你想说的话。
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="chat-shell__dialogue flex-1 min-h-0 overflow-hidden px-3 pt-3"
      >
        <AIChatDialogue
          chats={chats}
          roleConfig={roleConfig}
          align="leftRight"
          mode="bubble"
          hints={chats.length === 0 ? hintPrompts : []}
          onHintClick={onHintClick}
          className="h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* 翻译 Modal */}
      <TranslateModal selection={selection} onClose={clearSelection} />
    </>
  )
}

export default ChatDialogArea
```

---

## Task 14: 更新 TranslateModal 类型兼容

**Files:**
- Modify: `src/components/TranslateModal/index.tsx`

- [ ] **Step 1: 更新 TranslateModal 类型导入**

修改 `src/components/TranslateModal/index.tsx` 第 6 行的类型导入:

将:
```typescript
import type { TextSelection } from '../../hooks/useTextSelection'
```

改为:
```typescript
import type { SmartSelection } from '../../hooks/useSmartSelection'
```

- [ ] **Step 2: 更新 TranslateModalProps 类型**

修改第 9-12 行:

将:
```typescript
export interface TranslateModalProps {
  selection: TextSelection | null
  onClose: () => void
}
```

改为:
```typescript
export interface TranslateModalProps {
  selection: SmartSelection | null
  onClose: () => void
}
```

---

## Task 15: 类型检查和测试

**Files:**
- Multiple files

- [ ] **Step 1: 运行 TypeScript 类型检查**

运行命令:
```bash
pnpm tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 2: 启动开发服务器测试**

运行命令:
```bash
pnpm dev
```

Expected: 服务器启动成功，无编译错误

- [ ] **Step 3: 手动测试**

测试步骤:
1. 打开聊天页面
2. 发送一条消息
3. 鼠标悬停在消息文字上，观察是否高亮整个词
4. 点击词，观察是否弹出翻译弹窗
5. 测试中文、英文、日文、韩文文本

Expected: 所有功能正常工作

---

## 自查清单

| 检查项 | 状态 |
|--------|------|
| 规格覆盖完整性 | ✅ 所有规格要求都有对应任务 |
| 无占位符 | ✅ 无 TBD/TODO/待实现 |
| 类型一致性 | ✅ 类型定义和使用一致 |
| 文件路径准确 | ✅ 所有文件路径正确 |
| 代码完整性 | ✅ 每个步骤都有完整代码 |
