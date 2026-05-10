/**
 * 语音聊天协调 Hook
 * Feature: 20260508-voice-interaction-feature
 *
 * 协调实时语音会话与聊天显示，将 ASR 文本与 AI 回复文本直接落到聊天列表，
 * 不再触发文本聊天 LLM / TTS 链路（避免与实时语音模型重复回复）。
 */

import { useCallback, useRef, useState } from 'react'
import { useVoiceSession } from './useVoiceSession'
import type { VoiceError, PronunciationResult } from '../types/voice'

export interface VoiceChatOptions {
  /** 当前学习语言，透传给实时语音后端用于 prompt 构建 */
  language?: string
  /** 当前场景标识，透传给实时语音后端用于场景 prompt 注入 */
  scenario?: string
  /**
   * 用户语音识别完成回调（isFinal=true 时由 useVoiceChat 触发一次完整文本）
   * 上层据此把"用户消息"直接 append 到聊天列表
   */
  onUserTranscript: (text: string) => void
  /**
   * AI 回复完整结束回调（在 tts_ended 触发）
   * 上层据此把"AI 消息"直接 append 到聊天列表
   */
  onAiResponseFinalized: (text: string) => void
  /** 错误回调 */
  onError?: (error: VoiceError) => void
}

export interface UseVoiceChatReturn {
  /** 是否在语音会话中 */
  isInVoiceSession: boolean
  /** ASR 中间结果 */
  asrInterimText: string
  /** ASR 最终结果 */
  asrFinalText: string
  /** AI 回复文本（流式累积，仅供 UI 实时显示） */
  aiResponseText: string
  /** 是否正在播放 TTS */
  isPlayingTTS: boolean
  /** 发音分析结果 */
  pronunciationResult: PronunciationResult | null
  /** 错误信息 */
  error: VoiceError | null
  /** 是否已连接 */
  isConnected: boolean
  /** 是否正在连接中 */
  isConnecting: boolean
  /** 开始语音会话 */
  startVoiceSession: () => void
  /** 停止录音（发送 EndASR 信号，等待 AI 回复） */
  stopRecording: () => void
  /** 结束语音会话 */
  endVoiceSession: () => void
  /** 发送音频数据 */
  sendAudio: (data: ArrayBuffer) => void
  /** 停止 TTS 播放 */
  stopTTS: () => void
  /** 重置 ASR 文本（开始新一轮录音前调用，清空模态框上一次的文本） */
  resetTranscript: () => void
}

/**
 * 语音聊天协调 Hook
 */
export function useVoiceChat(options: VoiceChatOptions): UseVoiceChatReturn {
  const { language, scenario, onUserTranscript, onAiResponseFinalized, onError } = options

  const [asrInterimText, setAsrInterimText] = useState('')
  const [asrFinalText, setAsrFinalText] = useState('')
  const [isInVoiceSession, setIsInVoiceSession] = useState(false)

  const finalTextRef = useRef('')
  // 记录已经上报过的用户文本，避免同一句话被重复 append
  const lastReportedTranscriptRef = useRef('')

  // 处理 ASR 结果：isFinal 时立刻把用户文本回吐给上层（无需等 endVoiceSession）
  const handleAsrResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setAsrFinalText(text)
        finalTextRef.current = text
        setAsrInterimText('')
        // 仅在与上次不同时才上报，防止火山重复推送同一最终结果
        if (text && text !== lastReportedTranscriptRef.current) {
          lastReportedTranscriptRef.current = text
          onUserTranscript(text)
        }
      } else {
        setAsrInterimText(text)
      }
    },
    [onUserTranscript]
  )

  // AI 回复完整结束：把完整 AI 文本回吐给上层
  const handleAiResponseFinalized = useCallback(
    (text: string) => {
      onAiResponseFinalized(text)
    },
    [onAiResponseFinalized]
  )

  // 使用语音会话 Hook
  const voiceSession = useVoiceSession({
    language,
    scenario,
    onAsrResult: handleAsrResult,
    onAiResponseFinalized: handleAiResponseFinalized,
    onError,
  })

  // 开始语音会话
  const startVoiceSession = useCallback(() => {
    finalTextRef.current = ''
    lastReportedTranscriptRef.current = ''
    setAsrInterimText('')
    setAsrFinalText('')
    setIsInVoiceSession(true)
    voiceSession.startSession()
  }, [voiceSession])

  // 停止录音（发送 EndASR 信号，等待 AI 回复）
  const stopRecording = useCallback(() => {
    voiceSession.sendEndASR()
  }, [voiceSession])

  // 结束语音会话
  // 注意：不再在此处 append 用户消息，因为 ASR isFinal 时已上报
  const endVoiceSession = useCallback(() => {
    setIsInVoiceSession(false)
    setAsrInterimText('')
    setAsrFinalText('')
    finalTextRef.current = ''
    lastReportedTranscriptRef.current = ''
    voiceSession.endSession()
  }, [voiceSession])

  // 重置 ASR 文本（再次点击话筒前调用）
  const resetTranscript = useCallback(() => {
    finalTextRef.current = ''
    lastReportedTranscriptRef.current = ''
    setAsrInterimText('')
    setAsrFinalText('')
  }, [])

  // 发送音频数据
  const sendAudio = useCallback(
    (data: ArrayBuffer) => {
      voiceSession.sendAudio(data)
    },
    [voiceSession]
  )

  return {
    isInVoiceSession,
    asrInterimText,
    asrFinalText,
    aiResponseText: voiceSession.aiResponseText,
    isPlayingTTS: voiceSession.isPlayingTTS,
    pronunciationResult: voiceSession.pronunciationResult,
    error: voiceSession.error,
    isConnected: voiceSession.isConnected,
    isConnecting: voiceSession.isConnecting,
    startVoiceSession,
    stopRecording,
    endVoiceSession,
    sendAudio,
    stopTTS: voiceSession.stopTTS,
    resetTranscript,
  }
}
