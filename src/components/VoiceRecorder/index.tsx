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

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Modal, Typography, Spin } from '@douyinfe/semi-ui'
import { IconMicrophoneStroked, IconStop } from '@douyinfe/semi-icons'
import { useVoiceRecorder, isMediaRecorderSupported } from '../../hooks/useVoiceRecorder'
import type { VoiceError } from '../../types/voice'
import './styles.css'

export interface VoiceRecorderProps {
  /** 禁用状态 */
  disabled?: boolean
  /** 发送音频数据的函数（由父组件提供） */
  sendAudio?: (data: ArrayBuffer) => void
  /** 是否已连接到语音服务 */
  isConnected?: boolean
  /** 是否正在连接中 */
  isConnecting?: boolean
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
}

interface RecordingModalProps {
  visible: boolean
  interimText: string
  finalText: string
  onStop: () => void
}

/**
 * 录音状态弹窗
 */
const RecordingModal: React.FC<RecordingModalProps> = ({
  visible,
  interimText,
  finalText,
  onStop,
}) => {
  return (
    <Modal
      visible={visible}
      title="语音输入"
      footer={null}
      closable={false}
      centered
      width={400}
      className="voice-recorder-modal"
    >
      <div className="voice-recorder-modal__content">
        {/* 录音动画 */}
        <div className="voice-recorder-modal__animation">
          <div className="voice-recorder-modal__wave">
            <span className="voice-recorder-modal__wave-bar" />
            <span className="voice-recorder-modal__wave-bar" />
            <span className="voice-recorder-modal__wave-bar" />
            <span className="voice-recorder-modal__wave-bar" />
            <span className="voice-recorder-modal__wave-bar" />
          </div>
        </div>

        {/* 识别文本展示 */}
        <div className="voice-recorder-modal__text">
          {finalText && (
            <Typography.Paragraph
              className="voice-recorder-modal__final-text"
              style={{ marginBottom: 8 }}
            >
              {finalText}
            </Typography.Paragraph>
          )}
          {interimText && (
            <Typography.Paragraph className="voice-recorder-modal__interim-text" type="tertiary">
              {interimText}
            </Typography.Paragraph>
          )}
          {!finalText && !interimText && (
            <Typography.Paragraph type="tertiary" style={{ textAlign: 'center' }}>
              正在聆听...
            </Typography.Paragraph>
          )}
        </div>

        {/* 停止按钮 */}
        <Button
          type="danger"
          theme="solid"
          icon={<IconStop />}
          onClick={onStop}
          size="large"
          className="voice-recorder-modal__stop-btn"
        >
          停止录音
        </Button>
      </div>
    </Modal>
  )
}

/**
 * 语音录音组件
 *
 * 功能：
 * - 点击麦克风按钮开始录音
 * - 实时显示语音识别结果
 * - 点击停止或达到时长限制后发送识别文本
 */
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  disabled = false,
  sendAudio,
  isConnected = false,
  isConnecting = false,
  onStartSession,
  onStopRecording,
  onEndSession,
  onResetTranscript,
  asrInterimText: externalInterimText,
  asrFinalText: externalFinalText,
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [pendingRecording, setPendingRecording] = useState(false)

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
      setModalVisible(false)
      setPendingRecording(false)
      onEndSession?.()
    },
    [onEndSession]
  )

  // 使用录音 Hook
  const {
    isRecording,
    interimText: localInterimText,
    finalText: localFinalText,
    startRecording,
    stopRecording,
  } = useVoiceRecorder({
    onAudioData: handleAudioData,
    onError: handleError,
    maxDuration: 60000,
  })

  // 使用外部 ASR 文本（如果提供），否则使用本地
  const interimText = externalInterimText ?? localInterimText
  const finalText = externalFinalText ?? localFinalText

  // 当连接成功后，开始录音
  useEffect(() => {
    if (isConnected && pendingRecording) {
      setPendingRecording(false)
      startRecording()
      setModalVisible(true)
    }
  }, [isConnected, pendingRecording, startRecording])

  // 开始录音
  const handleStartRecording = useCallback(async () => {
    // 检查浏览器兼容性
    if (!isMediaRecorderSupported()) {
      setConnectionError('您的浏览器不支持录音功能，请使用 Chrome、Firefox 或 Edge 浏览器')
      return
    }

    setConnectionError(null)
    // 清空模态框内残留的上一次 ASR 文本（连接保持时再次点话筒的场景）
    onResetTranscript?.()

    // 如果已经连接，直接开始录音
    if (isConnected) {
      try {
        await startRecording()
        setModalVisible(true)
      } catch (err) {
        setConnectionError(err instanceof Error ? err.message : '启动录音失败')
        onEndSession?.()
      }
    } else {
      // 否则先启动连接，等待连接成功后再开始录音
      setPendingRecording(true)
      onStartSession?.()
    }
  }, [isConnected, startRecording, onStartSession, onEndSession, onResetTranscript])

  // 停止录音
  const handleStopRecording = useCallback(() => {
    console.log('[VoiceRecorder] Stopping recording')
    // 1. 先停止本地录音
    stopRecording()
    // 2. 发送 EndASR 信号，通知服务端音频输入结束
    onStopRecording?.()
    // 3. 关闭弹窗
    setModalVisible(false)
  }, [stopRecording, onStopRecording])

  // 显示错误提示
  useEffect(() => {
    if (connectionError) {
      console.error('[VoiceRecorder] Error:', connectionError)
    }
  }, [connectionError])

  return (
    <>
      <Button
        type="tertiary"
        theme="borderless"
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isConnecting}
        icon={
          isConnecting ? (
            <Spin size="small" />
          ) : isRecording ? (
            <IconStop style={{ color: 'var(--semi-color-danger)' }} />
          ) : (
            <IconMicrophoneStroked />
          )
        }
        style={{
          borderRadius: '50%',
          marginRight: 4,
        }}
        aria-label={isRecording ? '停止录音' : '开始录音'}
      />

      {/* 录音状态弹窗 */}
      <RecordingModal
        visible={modalVisible}
        interimText={interimText}
        finalText={finalText}
        onStop={handleStopRecording}
      />

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
