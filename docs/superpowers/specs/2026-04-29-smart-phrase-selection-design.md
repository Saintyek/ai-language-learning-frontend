# 智能短语选择功能设计文档

## 概述

在聊天页面的翻译功能中，实现智能短语选择，替代手动划词。当用户鼠标悬停在某个字符上时，自动高亮整个语义短语；点击时选中该短语并触发翻译弹窗。

## 目标

- 支持中文、英文、日文、韩文四种语言的智能分词
- 悬停即时高亮，点击即触发翻译
- 保持现有 Semi UI MarkdownRender 功能不变
- 使用轻量级分词库，控制包体积增量

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    ChatDialogArea                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │              AIChatDialogue (Semi UI)               ││
│  │  ┌───────────────────────────────────────────────┐  ││
│  │  │            MarkdownRender                      │  ││
│  │  │  ↓ 渲染完成后                                  │  ││
│  │  └───────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                         ↓                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │         SmartTextSegmenter (新增)                   ││
│  │  1. 遍历文本节点                                    ││
│  │  2. 检测语言                                        ││
│  │  3. 调用对应分词库                                  ││
│  │  4. 用 <span data-word> 包裹每个词                  ││
│  └─────────────────────────────────────────────────────┘│
│                         ↓                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │         useSmartSelection Hook (新增)               ││
│  │  - 监听 hover 事件（事件委托）                       ││
│  │  - 监听 click 事件                                  ││
│  │  - 管理高亮状态                                     ││
│  │  - 触发翻译弹窗                                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 分词库选择

| 语言 | 分词库 | 包体积 | 说明 |
|------|--------|--------|------|
| 中文 | `segmentit` | ~200KB | 纯 JS 实现，无需 WebAssembly |
| 日文 | `tiny-segmenter` | ~20KB | 轻量级形态素分析器 |
| 韩文 | 自定义规则 | ~5KB | 空格分词 + 形态素后缀规则 |
| 英文 | 自定义规则 | ~1KB | 空格 + 标点切分 |

**预计包体积增量：~250KB（gzip 后约 80KB）**

### 核心模块

#### 1. 语言检测器

```typescript
// src/utils/segmentation/detectLanguage.ts

type Language = 'zh' | 'ja' | 'ko' | 'en' | 'mixed'

/**
 * 检测文本的主要语言类型
 * 通过 Unicode 范围和字符特征判断
 */
export function detectLanguage(text: string): Language
```

检测逻辑：
- 中日韩字符（CJK Unified Ideographs）：中文/日文
- 平假名/片假名：日文
- 谚文：韩文
- 拉丁字母：英文
- 混合字符：返回 mixed

#### 2. 分词器接口

```typescript
// src/utils/segmentation/types.ts

export interface Segmenter {
  /** 将文本分割为词语数组 */
  segment(text: string): string[]
}

export interface SegmentationResult {
  words: string[]
  language: Language
}
```

#### 3. 分词器实现

**中文分词器**
```typescript
// src/utils/segmentation/segmenters/chinese.ts

import Segmentit from 'segmentit'

export class ChineseSegmenter implements Segmenter {
  private segmentit: Segmentit

  constructor() {
    this.segmentit = new Segmentit()
    // 加载默认词典
    this.segmentit.useDefault()
  }

  segment(text: string): string[] {
    return this.segmentit.doSegment(text, {
      simple: true,
      stripPunctuation: false,
    })
  }
}
```

**日文分词器**
```typescript
// src/utils/segmentation/segmenters/japanese.ts

import TinySegmenter from 'tiny-segmenter'

export class JapaneseSegmenter implements Segmenter {
  private segmenter: TinySegmenter

  constructor() {
    this.segmenter = new TinySegmenter()
  }

  segment(text: string): string[] {
    return this.segmenter.segment(text)
  }
}
```

**韩文分词器**
```typescript
// src/utils/segmentation/segmenters/korean.ts

export class KoreanSegmenter implements Segmenter {
  // 韩文常见助词、词尾后缀
  private static SUFFIXES = [
    '은', '는', '이', '가', '을', '를', '에', '에서',
    '으로', '로', '와', '과', '도', '만', '부터', '까지',
    '하다', '했다', '합니다', '입니다', '습니다', '어요', '아요'
  ]

  segment(text: string): string[] {
    // 1. 按空格分割
    // 2. 对每个 token，尝试分离后缀
    const result: string[] = []
    const tokens = text.split(/\s+/)

    for (const token of tokens) {
      if (!token) continue

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

**英文分词器**
```typescript
// src/utils/segmentation/segmenters/english.ts

export class EnglishSegmenter implements Segmenter {
  segment(text: string): string[] {
    // 保留标点符号作为独立 token
    const result: string[] = []
    let current = ''

    for (const char of text) {
      if (/[\s]/.test(char)) {
        if (current) {
          result.push(current)
          current = ''
        }
      } else if (/[.,!?;:'"()[\]{}]/.test(char)) {
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
```

#### 4. DOM 处理器

```typescript
// src/utils/segmentation/domProcessor.ts

import { detectLanguage } from './detectLanguage'
import { getSegmenter } from './segmenters'

const DATA_WORD_ATTR = 'data-word'
const WORD_CLASS = 'smart-word'

/**
 * 处理容器内的文本节点，进行分词并包裹 span
 */
export function processTextNodes(container: HTMLElement): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // 排除 code、pre、script、style 等标签内的文本
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT

        const tagName = parent.tagName.toLowerCase()
        if (['code', 'pre', 'script', 'style', 'a'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        // 排除已处理的节点
        if (parent.hasAttribute(DATA_WORD_ATTR)) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

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

    const span = document.createElement('span')
    span.setAttribute(DATA_WORD_ATTR, word)
    span.className = WORD_CLASS
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
```

#### 5. 智能选词 Hook

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

      if (!wordSpan && currentHoveredSpan.current) {
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

      // 阻止事件冒泡，避免触发其他点击处理
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

### 文件结构

```
src/
├── utils/
│   └── segmentation/
│       ├── index.ts              # 统一导出
│       ├── detectLanguage.ts     # 语言检测
│       ├── domProcessor.ts       # DOM 处理
│       ├── segmenters/
│       │   ├── index.ts          # 分词器工厂
│       │   ├── chinese.ts        # 中文分词
│       │   ├── japanese.ts       # 日文分词
│       │   ├── korean.ts         # 韩文分词
│       │   └── english.ts        # 英文分词
│       └── types.ts              # 类型定义
│
├── hooks/
│   ├── useTextSelection.ts       # 保留原有（备用）
│   └── useSmartSelection.ts      # 新增：智能选词
│
├── components/
│   └── TranslateModal/
│       └── index.tsx             # 现有组件，接口不变
│
└── pages/Chat/components/
    └── ChatDialogArea.tsx        # 集成智能选词
```

### 样式设计（Tailwind CSS）

在 `src/index.css` 或全局样式文件中添加：

```css
/* 智能选词样式 - 使用 Tailwind 类名 */
.smart-word {
  @apply cursor-pointer inline-block;
}

.smart-word--hover {
  @apply bg-[var(--semi-color-primary-light-default)] rounded;
}

.smart-word--selected {
  @apply bg-[var(--semi-color-primary-light-hover)];
}
```

或者直接在 React 组件中使用 Tailwind 类名：

```tsx
// 在 domProcessor.ts 中动态添加类名
const WORD_CLASSES = 'cursor-pointer inline-block hover:bg-[var(--semi-color-primary-light-default)] hover:rounded'

// 使用方式
span.className = WORD_CLASSES
```

### 集成方式

修改 `ChatDialogArea.tsx`：

```tsx
import { useEffect, useRef } from 'react'
import { AIChatDialogue } from '@douyinfe/semi-ui'
import { useSmartSelection } from '@/hooks/useSmartSelection'
import { processTextNodes, clearProcessedNodes } from '@/utils/segmentation'
import { TranslateModal } from '@/components/TranslateModal'

export const ChatDialogArea: React.FC<ChatDialogAreaProps> = ({
  chats,
  // ... other props
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { selection, clearSelection } = useSmartSelection(containerRef)

  // 当聊天内容变化时，处理文本节点
  useEffect(() => {
    if (!containerRef.current) return

    // 使用 MutationObserver 或 setTimeout 确保渲染完成
    const timer = setTimeout(() => {
      processTextNodes(containerRef.current!)
    }, 0)

    return () => clearTimeout(timer)
  }, [chats])

  return (
    <div ref={containerRef}>
      <AIChatDialogue
        chats={chats}
        // ... other props
      />
      <TranslateModal selection={selection} onClose={clearSelection} />
    </div>
  )
}
```

### 交互流程

```
消息渲染完成
       ↓
processTextNodes 遍历文本节点
       ↓
检测语言 → 调用对应分词器
       ↓
用 <span data-word="词"> 包裹每个词
       ↓
用户悬停在某字上
       ↓
事件委托捕获 mouseover
       ↓
查找最近的 span[data-word]
       ↓
添加高亮样式类
       ↓
用户点击
       ↓
事件委托捕获 click
       ↓
获取短语内容 + 位置
       ↓
触发翻译弹窗
```

### 边界情况处理

1. **混合语言文本**：按主要语言分词，或分段处理
2. **代码块**：排除 `code`、`pre` 标签内的文本
3. **链接**：排除 `a` 标签内的文本，保持链接功能
4. **空文本**：跳过处理
5. **动态内容**：使用 `MutationObserver` 监听 DOM 变化

### 性能优化

1. **懒加载分词库**：按需加载对应语言的分词器
2. **缓存分词结果**：相同文本复用分词结果
3. **防抖处理**：频繁 DOM 变化时使用防抖
4. **虚拟列表**：长消息列表只处理可视区域

### 测试计划

1. **单元测试**
   - 语言检测函数准确性
   - 各分词器分词准确性
   - DOM 处理逻辑

2. **集成测试**
   - 悬停高亮效果
   - 点击触发翻译
   - 多语言混合文本

3. **E2E 测试**
   - 中文：正确识别词语如"感觉"、"什么"
   - 日文：正确识别形态素
   - 韩文：正确分离助词
   - 英文：正确处理空格和标点

### 依赖安装

```bash
npm install segmentit tiny-segmenter
# 或
pnpm add segmentit tiny-segmenter
```

### 预估工作量

| 任务 | 预估时间 |
|------|----------|
| 分词模块实现 | 2-3 小时 |
| DOM 处理器 | 1-2 小时 |
| Hook 实现 | 1-2 小时 |
| 样式调整 | 0.5 小时 |
| 集成测试 | 1-2 小时 |
| **总计** | **5.5-9.5 小时** |
