// src/utils/segmentation/domProcessor.ts

import { detectLanguage } from './detectLanguage'
import { getSegmenter } from './segmenters'

const DATA_WORD_ATTR = 'data-word'
const SMART_WORD_CLASS = 'smart-word'

// 排除处理的标签
const EXCLUDED_TAGS = ['CODE', 'PRE', 'SCRIPT', 'STYLE', 'A', 'BUTTON', 'INPUT', 'TEXTAREA']

// 全局点击回调
let globalClickCallback: ((word: string, rect: DOMRect) => void) | null = null

/**
 * 设置全局点击回调
 */
export function setWordClickCallback(callback: (word: string, rect: DOMRect) => void): void {
  globalClickCallback = callback
}

/**
 * 处理容器内的文本节点，进行分词并包裹 span
 */
export function processTextNodes(container: HTMLElement): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Node): number => {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT

      // 排除特定标签内的文本
      const tagName = parent.tagName
      if (EXCLUDED_TAGS.includes(tagName)) {
        return NodeFilter.FILTER_REJECT
      }

      // 排除已处理的节点（父元素是 smart-word）
      if (parent.classList.contains(SMART_WORD_CLASS)) {
        return NodeFilter.FILTER_REJECT
      }

      // 排除空文本
      const text = node.textContent
      if (!text || !text.trim()) {
        return NodeFilter.FILTER_REJECT
      }

      return NodeFilter.FILTER_ACCEPT
    },
  })

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

  console.log('processTextNode:', {
    text: text.substring(0, 50),
    language,
    wordsCount: words.length,
    words: words.slice(0, 10),
  })

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

    // 直接在 span 上添加点击事件
    span.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()

      const rect = span.getBoundingClientRect()
      console.log('Span clicked:', word)

      if (globalClickCallback) {
        globalClickCallback(word, rect)
      }
    })

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
