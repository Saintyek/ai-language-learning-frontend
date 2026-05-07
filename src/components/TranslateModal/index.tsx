import React, { useState, useEffect, useRef } from 'react'
import { Modal, Spin, Button } from '@douyinfe/semi-ui'
import { IconPlay, IconCopy } from '@douyinfe/semi-icons'
import { Toast } from '@douyinfe/semi-ui'
import { translateText } from '../../api/translate'
import { fetchTTS } from '../../api/tts'
import { StreamingAudioPlayer } from '../../utils/audioPlayer'
import type { SmartSelection } from '../../hooks/useSmartSelection'
import type { TranslateResponse } from '../../api/translate'

export interface TranslateModalProps {
  selection: SmartSelection | null
  /** 当前学习语言代码，用于确定翻译目标语言 */
  langCode: string | undefined
  onClose: () => void
}

/**
 * 根据当前学习语言确定翻译目标语言
 * - 中文学习：翻译为英文
 * - 其他语言（日语、西班牙语、英语）：翻译为中文
 */
const getTargetLanguage = (langCode: string | undefined): 'zh' | 'en' => {
  if (langCode === 'cn') {
    return 'en'
  }
  return 'zh'
}

/**
 * 翻译弹窗组件
 * 使用 Modal 在页面正中央展示翻译结果
 */
export const TranslateModal: React.FC<TranslateModalProps> = ({ selection, langCode, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TranslateResponse | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const playerRef = useRef<StreamingAudioPlayer | null>(null)

  // 初始化音频播放器
  useEffect(() => {
    playerRef.current = new StreamingAudioPlayer()
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  // 播放 TTS 音频
  const playTTSAudio = async (text: string): Promise<void> => {
    console.log('[TranslateModal] playTTSAudio called with text:', text)
    if (!playerRef.current) {
      console.log('[TranslateModal] playerRef.current is null')
      return
    }

    const audioChunks = await fetchTTS(text, langCode)
    console.log('[TranslateModal] fetchTTS returned', audioChunks.length, 'chunks')
    for (const chunk of audioChunks) {
      await playerRef.current.enqueue(chunk)
    }
    console.log('[TranslateModal] All chunks enqueued')
  }

  // 播放发音功能：先播放翻译，间隔1秒后播放例句
  const handlePlay = async () => {
    console.log('[TranslateModal] handlePlay called, isPlaying:', isPlaying)
    if (isPlaying) {
      playerRef.current?.stop()
      setIsPlaying(false)
      return
    }

    if (!result?.translation) return

    setIsPlaying(true)

    try {
      console.log('[TranslateModal] Starting playback for translation:', result.translation)
      // 播放翻译音频
      await playTTSAudio(result.translation)
      console.log('[TranslateModal] playTTSAudio finished, waiting for playback complete')

      // 等待播放完成（通过检查播放器状态）
      await waitForPlaybackComplete()
      console.log('[TranslateModal] waitForPlaybackComplete finished')

      // 如果有例句，间隔1秒后播放例句
      if (result.example?.sentence) {
        console.log('[TranslateModal] Waiting 1 second before playing example sentence')
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('[TranslateModal] Playing example sentence:', result.example.sentence)
        await playTTSAudio(result.example.sentence)
        await waitForPlaybackComplete()
        console.log('[TranslateModal] Example sentence playback finished')
      }
    } catch (err) {
      console.error('TTS error:', err)
      Toast.error('语音合成失败')
    } finally {
      console.log('[TranslateModal] Setting isPlaying to false')
      setIsPlaying(false)
    }
  }

  // 等待播放完成
  const waitForPlaybackComplete = (): Promise<void> => {
    return new Promise(resolve => {
      let hasStartedPlaying = false
      let checkCount = 0

      const checkStatus = () => {
        checkCount++
        const state = playerRef.current?.getState()
        console.log(`[TranslateModal] checkStatus #${checkCount}:`, state?.status)

        // 首先等待播放器开始播放
        if (!hasStartedPlaying) {
          if (state?.status === 'playing') {
            console.log('[TranslateModal] Player started playing')
            hasStartedPlaying = true
          } else if (state?.status === 'idle' || state?.status === 'stopped') {
            // 如果播放器从未开始播放就进入了 idle 或 stopped 状态，直接完成
            console.log('[TranslateModal] Player finished without playing (was idle/stopped)')
            resolve()
            return
          }
          // 继续等待播放开始
          setTimeout(checkStatus, 100)
          return
        }

        // 播放已经开始，等待播放完成（idle 或 stopped）
        if (state?.status === 'idle' || state?.status === 'stopped') {
          console.log('[TranslateModal] Player finished playing')
          resolve()
        } else {
          setTimeout(checkStatus, 100)
        }
      }

      // 开始检查
      setTimeout(checkStatus, 100)
    })
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

    const targetLanguage = getTargetLanguage(langCode)
    translateText({ text: selection.text, targetLanguage })
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
  }, [selection, langCode])

  // 关闭时重置状态
  const handleClose = () => {
    if (isPlaying) {
      playerRef.current?.stop()
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
