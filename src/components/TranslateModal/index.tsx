import React, { useState, useEffect, useRef } from 'react'
import { Modal, Spin, Button } from '@douyinfe/semi-ui'
import { IconPlay, IconCopy } from '@douyinfe/semi-icons'
import { Toast } from '@douyinfe/semi-ui'
import { translateText } from '../../api/translate'
import type { SmartSelection } from '../../hooks/useSmartSelection'
import type { TranslateResponse } from '../../api/translate'

export interface TranslateModalProps {
  selection: SmartSelection | null
  onClose: () => void
}

/**
 * 翻译弹窗组件
 * 使用 Modal 在页面正中央展示翻译结果
 */
export const TranslateModal: React.FC<TranslateModalProps> = ({ selection, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TranslateResponse | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // 播放发音功能
  const handlePlay = () => {
    if (isPlaying && utteranceRef.current) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    if (!result?.translation) return

    const utterance = new SpeechSynthesisUtterance(result.translation)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  // 复制功能
  const handleCopy = async () => {
    if (!result?.translation) return
    try {
      await navigator.clipboard.writeText(result.translation)
      Toast.success('已复制')
    } catch {
      Toast.error('复制失败')
    }
  }

  useEffect(() => {
    if (!selection) {
      setResult(null)
      setError(null)
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setResult(null)
    setError(null)
    setLoading(true)

    translateText({ text: selection.text })
      .then(response => {
        if (!abortController.signal.aborted) {
          setResult(response)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : '翻译失败')
          setLoading(false)
        }
      })

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [selection])

  // 清理语音
  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isPlaying])

  // 关闭时重置状态
  const handleClose = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
    onClose()
  }

  // 渲染 Modal 内容
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="翻译中..." />
        </div>
      )
    }

    if (error) {
      return (
        <div className="py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleClose}>关闭</Button>
        </div>
      )
    }

    if (!result) return null

    return (
      <div className="relative">
        {/* 原文 */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">原文</p>
          <p className="text-gray-700 text-base leading-relaxed">{selection?.text}</p>
        </div>

        {/* 翻译结果 */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">翻译</p>
          <p className="text-gray-900 text-xl font-semibold leading-relaxed">
            {result.translation}
          </p>
          {result.pronunciation && (
            <p className="text-sm text-cyan-600 mt-1">{result.pronunciation}</p>
          )}
        </div>

        {/* 例句 */}
        {result.example?.sentence && (
          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">例句</p>
            <p className="text-gray-700 text-sm leading-relaxed mb-1">{result.example.sentence}</p>
            {result.example.translation && (
              <p className="text-gray-500 text-sm leading-relaxed">{result.example.translation}</p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isPlaying
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200'
                : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
            }`}
            aria-label="播放发音"
          >
            <IconPlay className={isPlaying ? 'animate-pulse' : ''} />
            <span className="text-sm font-medium">{isPlaying ? '播放中' : '发音'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            aria-label="复制翻译"
          >
            <IconCopy />
            <span className="text-sm font-medium">复制</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <Modal
      title="翻译"
      visible={!!selection}
      onCancel={handleClose}
      footer={null}
      centered
      maskClosable
      bodyStyle={{
        paddingBottom: '28px',
      }}
    >
      {renderContent()}
    </Modal>
  )
}

export default TranslateModal
