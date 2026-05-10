/**
 * VoiceRecorder 组件
 * Feature: 20260508-voice-interaction-feature
 *
 * 提供麦克风录音功能和实时语音识别展示
 *
 * 注意（2026-05-10 修复）：
 * 已移除 onTextReady 中转链路 —— 用户 ASR 文本与 AI 回复文本统一由 useVoiceChat
 * 的 onUserTranscript / onAiResponseFinalized 回调直接落到聊天列表，
 * 避免在停止录音时再走一次 LLM + TTS 合成（造成重复回复）。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Modal, Typography, Spin } from '@douyinfe/semi-ui'
import { IconMicrophoneStroked, IconStop } from '@douyinfe/semi-icons'
import { useVoiceRecorder, isMediaRecorderSupported } from '../../hooks/useVoiceRecorder'
import type { VoiceError } from '../../types/voice'

export interface VoiceRecorderProps {
  /** 禁用状态 */
  disabled?: boolean
  /** 发送音频数据的函数（由父组件提供） */
  sendAudio?: (data: ArrayBuffer) => void
  /** 是否已连接到语音服务 */
  isConnected?: boolean
  /** 是否正在连接中 */
  isConnecting?: boolean
  /** 当前已连接语音会话使用的发音分析开关值 */
  sessionPronunciationAnalysisEnabled?: boolean | null
  /** 开始语音会话 */
  onStartSession?: () => void
  /** 停止录音（发送 EndASR 信号） */
  onStopRecording?: () => void
  /** 结束语音会话 */
  onEndSession?: () => void
  /** 重置 ASR 文本回调（开始新一轮录音前调用） */
  onResetTranscript?: () => void
  /** ASR 中间结果 */
  asrInterimText?: string
  /** ASR 最终结果 */
  asrFinalText?: string
  /** 是否开启发音分析轻量反馈 */
  pronunciationAnalysisEnabled?: boolean
  /** 发音分析开关变更回调 */
  onPronunciationAnalysisChange?: (enabled: boolean) => void
  /** 按钮展示形态：默认保留输入框内的图标按钮样式 */
  variant?: 'icon' | 'pill'
}

/**
 * 语音录音组件
 *
 * 功能：
 * - 点击麦克风按钮直接开始录音
 * - 点击停止或达到时长限制后发送识别文本
 */
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  disabled = false,
  sendAudio,
  isConnected = false,
  isConnecting = false,
  sessionPronunciationAnalysisEnabled = null,
  onStartSession,
  onStopRecording,
  onEndSession,
  onResetTranscript,
  pronunciationAnalysisEnabled = false,
  variant = 'icon',
}) => {
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [pendingRecording, setPendingRecording] = useState(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPillVariant = variant === 'pill'

  // 处理音频数据
  const handleAudioData = useCallback(
    (data: ArrayBuffer) => {
      // 只有在连接成功后才发送音频数据
      if (isConnected) {
        sendAudio?.(data)
      }
    },
    [sendAudio, isConnected]
  )

  // 处理录音错误
  const handleError = useCallback(
    (error: VoiceError) => {
      console.error('[VoiceRecorder] Recording error:', error)
      setConnectionError(error.message)
      setPendingRecording(false)
      onEndSession?.()
    },
    [onEndSession]
  )

  // 使用录音 Hook
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder({
    onAudioData: handleAudioData,
    onError: handleError,
    maxDuration: 60000,
  })

  // 当连接成功后，开始录音
  useEffect(() => {
    if (isConnected && pendingRecording) {
      setPendingRecording(false)
      startRecording()
    }
  }, [isConnected, pendingRecording, startRecording])

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
      }
    }
  }, [])

  // 点击语音入口后直接启动录音，不再打开二次确认模态框。
  const handleStartRecording = useCallback(async () => {
    // 检查浏览器兼容性
    if (!isMediaRecorderSupported()) {
      setConnectionError('您的浏览器不支持录音功能，请使用 Chrome、Firefox 或 Edge 浏览器')
      return
    }

    setConnectionError(null)
    onResetTranscript?.()

    const shouldReuseSession =
      isConnected && sessionPronunciationAnalysisEnabled === pronunciationAnalysisEnabled

    // 只有当前连接的 Realtime 会话已经使用相同开关值时，才复用会话直接录音。
    if (shouldReuseSession) {
      try {
        await startRecording()
      } catch (err) {
        setConnectionError(err instanceof Error ? err.message : '启动录音失败')
        onEndSession?.()
      }
    } else {
      // system_role 只在会话启动时生效；开关变更后必须重开会话再录音。
      setPendingRecording(true)
      if (isConnected) {
        onEndSession?.()
        restartTimerRef.current = setTimeout(() => {
          onStartSession?.()
        }, 150)
      } else {
        onStartSession?.()
      }
    }
  }, [
    isConnected,
    sessionPronunciationAnalysisEnabled,
    pronunciationAnalysisEnabled,
    startRecording,
    onStartSession,
    onEndSession,
    onResetTranscript,
  ])

  // 停止录音
  const handleStopRecording = useCallback(() => {
    console.log('[VoiceRecorder] Stopping recording')
    // 1. 先停止本地录音
    stopRecording()
    // 2. 发送 EndASR 信号，通知服务端音频输入结束
    onStopRecording?.()
  }, [stopRecording, onStopRecording])

  // 显示错误提示
  useEffect(() => {
    if (connectionError) {
      console.error('[VoiceRecorder] Error:', connectionError)
    }
  }, [connectionError])

  const buttonText = isConnecting ? '连接中...' : isRecording ? '停止录音' : '实时语音输入'
  const buttonClassName = isPillVariant
    ? [
        '!h-12 !w-full !justify-center !rounded-full !border-0 !text-white shadow-lg',
        '!bg-linear-to-r !from-blue-500 !to-indigo-500 shadow-blue-500/20',
      ].join(' ')
    : '!mr-1 !rounded-full'
  const stopIconClassName = isPillVariant ? 'text-white' : 'text-[var(--semi-color-danger)]'

  return (
    <>
      <Button
        type={isRecording ? 'danger' : 'tertiary'}
        theme={isPillVariant ? 'solid' : 'borderless'}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isConnecting}
        icon={
          isConnecting ? (
            <Spin size="small" />
          ) : isRecording ? (
            <IconStop className={stopIconClassName} />
          ) : (
            <IconMicrophoneStroked />
          )
        }
        className={buttonClassName}
        aria-label={isRecording ? '停止录音' : '开始录音'}
      >
        {isPillVariant ? buttonText : null}
      </Button>

      {/* 错误提示弹窗 */}
      {connectionError && (
        <Modal
          visible={!!connectionError}
          title="语音输入错误"
          onOk={() => setConnectionError(null)}
          onCancel={() => setConnectionError(null)}
          okText="确定"
        >
          <Typography.Text type="danger">{connectionError}</Typography.Text>
        </Modal>
      )}
    </>
  )
}

export default VoiceRecorder
