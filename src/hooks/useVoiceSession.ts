/**
 * 语音会话管理 Hook
 * Feature: 20260508-voice-interaction-feature
 *
 * 管理 WebSocket 连接、AI 回复、TTS 播放和发音分析
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createVoiceWebSocket, isWebSocketSupported } from '../api/voice'
import { StreamingAudioPlayer } from '../utils/audioPlayer'
import type { VoiceWebSocketController, VoiceWebSocketOptions } from '../api/voice'
import type {
  VoiceEvent,
  VoiceError,
  VoiceSessionStatus,
  PronunciationResult,
} from '../types/voice'

export interface UseVoiceSessionOptions {
  /** AI 文本回复回调（流式，每片到达即触发） */
  onChatResponse?: (text: string, isFinal: boolean) => void
  /**
   * AI 本轮回复完整结束时回调（在 tts_ended 触发）
   * 用于实时语音链路：把累积的完整 AI 文本一次性落到聊天列表
   */
  onAiResponseFinalized?: (fullText: string) => void
  /** ASR 识别结果回调 */
  onAsrResult?: (text: string, isFinal: boolean) => void
  /** 发音分析结果回调 */
  onPronunciationResult?: (result: PronunciationResult) => void
  /** 错误回调 */
  onError?: (error: VoiceError) => void
  /** 会话状态变化回调 */
  onStatusChange?: (status: VoiceSessionStatus) => void
}

export interface UseVoiceSessionReturn {
  /** 当前会话状态 */
  status: VoiceSessionStatus
  /** 当前 AI 回复文本 */
  aiResponseText: string
  /** 发音分析结果 */
  pronunciationResult: PronunciationResult | null
  /** 是否正在播放 TTS */
  isPlayingTTS: boolean
  /** 错误信息 */
  error: VoiceError | null
  /** 开始会话 */
  startSession: () => void
  /** 结束会话 */
  endSession: () => void
  /** 停止 TTS 播放 */
  stopTTS: () => void
  /** 发送音频数据 */
  sendAudio: (data: ArrayBuffer) => void
  /** 发送文本消息 */
  sendText: (text: string) => void
  /** 发送 EndASR 事件（停止音频输入） */
  sendEndASR: () => void
  /** 是否已连接 */
  isConnected: boolean
  /** 是否正在连接中 */
  isConnecting: boolean
}

/**
 * 语音会话管理 Hook
 */
export function useVoiceSession(options: UseVoiceSessionOptions = {}): UseVoiceSessionReturn {
  const {
    onChatResponse,
    onAiResponseFinalized,
    onAsrResult,
    onPronunciationResult,
    onError,
    onStatusChange,
  } = options

  const [status, setStatus] = useState<VoiceSessionStatus>('idle')
  const [aiResponseText, setAiResponseText] = useState('')
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null)
  const [isPlayingTTS, setIsPlayingTTS] = useState(false)
  const [error, setError] = useState<VoiceError | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const wsRef = useRef<VoiceWebSocketController | null>(null)
  const audioPlayerRef = useRef<StreamingAudioPlayer | null>(null)
  const currentTextRef = useRef('')

  /**
   * 防御性去重锁（2026-05-10 修复 "AI 重复回复两遍"）：
   * - aiRespondingRef：本轮已经收到 AI 回复（chat / tts）后置 true，
   *     用于阻止 sendEndASR 在火山 VAD 已自动触发回复的情况下再发一次 EndASR
   *     （否则火山会再生成一遍完全相同的 AI 回复 → 听到两段相同语音）。
   * - endAsrSentRef：本轮已经发送过 EndASR 后置 true，
   *     防御 React 重复回调或用户连点造成的多次 EndASR 投递。
   * 两把锁均在每轮 startSession / tts_ended 时重置。
   */
  const aiRespondingRef = useRef(false)
  const endAsrSentRef = useRef(false)

  // 初始化音频播放器
  useEffect(() => {
    audioPlayerRef.current = new StreamingAudioPlayer()
    return () => {
      audioPlayerRef.current?.destroy()
      audioPlayerRef.current = null
    }
  }, [])

  // 更新状态并通知
  const updateStatus = useCallback(
    (newStatus: VoiceSessionStatus) => {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    [onStatusChange]
  )

  // 处理 WebSocket 消息
  const handleWSMessage = useCallback(
    (event: VoiceEvent) => {
      console.log('[useVoiceSession] Received event:', event.type, event)
      switch (event.type) {
        case 'connected':
          // 后端到火山 RealtimeAPI 的连接已建立，此时才是真正可发送音频的时机
          console.log('[useVoiceSession] Backend connected to RealtimeAPI:', event.sessionId)
          setIsConnecting(false)
          setIsConnected(true)
          break

        case 'asr':
          // ASR 识别结果
          console.log('[useVoiceSession] ASR result:', event.text, 'isFinal:', event.isFinal)
          onAsrResult?.(event.text, event.isFinal)
          break

        case 'asr_ended':
          // ASR 结束事件，服务端已收到 EndASR 并处理完毕
          console.log('[useVoiceSession] ASR ended, waiting for AI response')
          break

        case 'chat':
          // AI 文字回复
          console.log('[useVoiceSession] Chat response:', event.text, 'isFinal:', event.isFinal)
          // 收到 AI 回复 → 标记本轮已进入 AI 响应阶段
          aiRespondingRef.current = true
          if (event.isFinal) {
            currentTextRef.current += event.text
            setAiResponseText(currentTextRef.current)
          } else {
            // 中间结果，显示临时文本
            setAiResponseText(currentTextRef.current + event.text)
          }
          onChatResponse?.(event.text, event.isFinal)
          break

        case 'tts':
          // TTS 音频数据
          console.log('[useVoiceSession] TTS audio received, sequence:', event.sequence)
          aiRespondingRef.current = true
          setIsPlayingTTS(true)
          audioPlayerRef.current?.enqueue(event.audio)
          break

        case 'tts_ended':
          // TTS 播放结束 = AI 本轮回复完整结束
          // 把累积好的完整文本回吐给上层（实时语音链路据此把消息落到聊天列表）
          console.log('[useVoiceSession] TTS ended, finalizing AI response')
          setIsPlayingTTS(false)
          if (currentTextRef.current) {
            onAiResponseFinalized?.(currentTextRef.current)
          }
          // 重置缓冲区与去重锁，准备接收下一轮 AI 回复
          currentTextRef.current = ''
          setAiResponseText('')
          aiRespondingRef.current = false
          endAsrSentRef.current = false
          break

        case 'pronunciation':
          // 发音分析结果
          console.log('[useVoiceSession] Pronunciation result:', event.result)
          setPronunciationResult(event.result)
          onPronunciationResult?.(event.result)
          break

        case 'error':
          // 错误事件
          console.error('[useVoiceSession] Error:', event.code, event.message)
          const voiceError: VoiceError = {
            code: event.code,
            message: event.message,
            retryable: event.retryable ?? false,
          }
          setError(voiceError)
          updateStatus('error')
          onError?.(voiceError)
          break

        case 'session_ended':
          // 会话结束
          console.log('[useVoiceSession] Session ended')
          currentTextRef.current = ''
          updateStatus('idle')
          break

        default:
          console.log('[useVoiceSession] Unknown event type:', (event as { type: string }).type)
          break
      }
    },
    [
      onChatResponse,
      onAiResponseFinalized,
      onAsrResult,
      onPronunciationResult,
      onError,
      updateStatus,
    ]
  )

  // 开始会话
  const startSession = useCallback(() => {
    if (!isWebSocketSupported()) {
      const err: VoiceError = {
        code: 'NOT_SUPPORTED',
        message: '您的浏览器不支持 WebSocket',
        retryable: false,
      }
      setError(err)
      onError?.(err)
      return
    }

    // 重置状态与去重锁
    currentTextRef.current = ''
    aiRespondingRef.current = false
    endAsrSentRef.current = false
    setAiResponseText('')
    setPronunciationResult(null)
    setError(null)
    setIsConnecting(true)
    updateStatus('recording')

    // 创建 WebSocket 连接
    const wsOptions: VoiceWebSocketOptions = {
      initialMessage: { type: 'start_session', language: 'us' },
      onMessage: handleWSMessage,
      onError: err => {
        setIsConnecting(false)
        setError(err)
        updateStatus('error')
        onError?.(err)
      },
      onOpen: () => {
        // WebSocket 通道已打开，但还需等后端发送 'connected' 事件
        // 才能确认与火山 RealtimeAPI 的连接已就绪
        console.log('[useVoiceSession] WS opened, waiting for backend "connected" event...')
      },
      onClose: () => {
        setIsConnecting(false)
        setIsConnected(false)
        if (status !== 'idle') {
          updateStatus('idle')
        }
      },
    }

    wsRef.current = createVoiceWebSocket(wsOptions)
  }, [handleWSMessage, onError, updateStatus, status])

  // 结束会话
  const endSession = useCallback(() => {
    // 先发送结束会话消息
    wsRef.current?.sendMessage({ type: 'end_session' })
    // 延迟断开连接，确保消息发送成功
    setTimeout(() => {
      wsRef.current?.disconnect()
      wsRef.current = null
      audioPlayerRef.current?.stop()
      setIsPlayingTTS(false)
      currentTextRef.current = ''
      aiRespondingRef.current = false
      endAsrSentRef.current = false
      updateStatus('idle')
    }, 100)
  }, [updateStatus])

  // 停止 TTS 播放
  const stopTTS = useCallback(() => {
    audioPlayerRef.current?.stop()
    setIsPlayingTTS(false)
  }, [])

  // 发送音频数据
  const sendAudio = useCallback((data: ArrayBuffer) => {
    wsRef.current?.sendAudio(data)
  }, [])

  // 发送文本消息
  const sendText = useCallback((text: string) => {
    wsRef.current?.sendMessage({ type: 'text', content: text })
  }, [])

  // 发送 EndASR 事件（停止音频输入）
  // 关键去重：
  //  1) 若火山服务端 VAD 已经自动触发了一次 AI 回复（aiResponding=true），
  //     再发 EndASR 会导致火山生成第二段完全相同的回复 → 必须跳过
  //  2) 已发送过的 EndASR 不再重发，避免任何外部重复调用造成重复回复
  const sendEndASR = useCallback(() => {
    if (aiRespondingRef.current) {
      console.log(
        '[useVoiceSession] EndASR skipped: AI is already responding (server VAD likely triggered)'
      )
      return
    }
    if (endAsrSentRef.current) {
      console.log('[useVoiceSession] EndASR skipped: already sent in this turn')
      return
    }
    endAsrSentRef.current = true
    wsRef.current?.sendMessage({ type: 'end_asr' })
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect()
      audioPlayerRef.current?.destroy()
    }
  }, [])

  return {
    status,
    aiResponseText,
    pronunciationResult,
    isPlayingTTS,
    error,
    startSession,
    endSession,
    stopTTS,
    sendAudio,
    sendText,
    sendEndASR,
    isConnected,
    isConnecting,
  }
}
