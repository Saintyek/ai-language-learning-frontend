/**
 * 语音聊天协调 Hook
 * Feature: 20260508-voice-interaction-feature
 *
 * 协调语音会话与聊天显示，管理 ASR 结果到消息发送的流程
 */

import { useCallback, useRef, useState } from 'react'
import { useVoiceSession } from './useVoiceSession'
import type { VoiceError, PronunciationResult } from '../types/voice'

export interface VoiceChatOptions {
  /** 发送消息到聊天列表 */
  onSendMessage: (text: string) => void
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
  /** AI 回复文本 */
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
}

/**
 * 语音聊天协调 Hook
 *
 * 管理语音会话状态，协调 ASR 结果与消息发送
 */
export function useVoiceChat(options: VoiceChatOptions): UseVoiceChatReturn {
  const { onSendMessage, onError } = options

  const [asrInterimText, setAsrInterimText] = useState('')
  const [asrFinalText, setAsrFinalText] = useState('')
  const [isInVoiceSession, setIsInVoiceSession] = useState(false)

  const finalTextRef = useRef('')

  // 处理 ASR 结果
  const handleAsrResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setAsrFinalText(text)
      finalTextRef.current = text
      setAsrInterimText('')
    } else {
      setAsrInterimText(text)
    }
  }, [])

  // 使用语音会话 Hook
  const voiceSession = useVoiceSession({
    onAsrResult: handleAsrResult,
    onError,
  })

  // 开始语音会话
  const startVoiceSession = useCallback(() => {
    finalTextRef.current = ''
    setAsrInterimText('')
    setAsrFinalText('')
    setIsInVoiceSession(true)
    voiceSession.startSession()
  }, [voiceSession])

  // 停止录音（发送 EndASR 信号，等待 AI 回复）
  // 在 push_to_talk 模式下，音频输入结束后必须发送此信号
  const stopRecording = useCallback(() => {
    voiceSession.sendEndASR()
  }, [voiceSession])

  // 结束语音会话
  const endVoiceSession = useCallback(() => {
    // 如果有最终识别结果，发送消息
    if (finalTextRef.current) {
      onSendMessage(finalTextRef.current)
    }
    setIsInVoiceSession(false)
    setAsrInterimText('')
    setAsrFinalText('')
    finalTextRef.current = ''
    voiceSession.endSession()
  }, [voiceSession, onSendMessage])

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
  }
}
