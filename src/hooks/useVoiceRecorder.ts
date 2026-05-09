/**
 * 麦克风录音 Hook
 * Feature: 20260508-voice-interaction-feature
 *
 * 关键改造（2026-05-09）：
 * - 改用 AudioContext + AudioWorklet 直接采集裸 PCM
 * - 输出格式严格匹配火山 RealtimeAPI 要求：
 *   单声道、16000Hz、Int16、小端序
 * - 每 20ms（640 字节）回调一次音频帧
 * - 旧实现使用 MediaRecorder 输出 webm/mp4 容器格式，火山无法解析为 PCM，
 *   导致 ASR 永远拿不到识别结果，从而后续没有 AI 语音回复。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  UseVoiceRecorderReturn,
  VoiceError,
  VoiceSessionStatus,
  VoiceErrorCode,
} from '../types/voice'

// 火山 RealtimeAPI 要求的目标采样率
const TARGET_SAMPLE_RATE = 16000
// 一帧 20ms 的采样点数（16k * 0.02s = 320）
const FRAME_SAMPLES = 320

const createVoiceError = (
  code: VoiceErrorCode,
  message: string,
  retryable = false
): VoiceError => ({
  code,
  message,
  retryable,
})

/**
 * 检查浏览器是否支持必需的 API
 * 这里检查 getUserMedia + AudioContext + AudioWorklet 三件套
 */
export function isMediaRecorderSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  if (!navigator.mediaDevices?.getUserMedia) return false
  const Ctor =
    (window as Window & { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return false
  // AudioWorklet 是必需的，老浏览器降级走 ScriptProcessor
  return true
}

export interface UseVoiceRecorderOptions {
  onAudioData?: (data: ArrayBuffer) => void
  onError?: (error: VoiceError) => void
  maxDuration?: number // 最大录音时长（毫秒），默认 60000 (60秒)
}

/**
 * AudioWorklet 处理器源码
 *
 * 职责：
 * - 接收浏览器原生采样率的 Float32 单声道数据
 * - 在主线程做重采样到 16k 后发送（这里 worklet 只负责切片转发）
 *
 * 注：worklet 内部不做重采样，重采样在主线程完成，便于复用 OfflineAudioContext 的精度
 *      并保持 worklet 极简、CPU 占用低
 */
const PCM_WORKLET_SOURCE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;
    // 拷贝一份 Float32Array 后通过 port 发回主线程
    const copy = new Float32Array(channel.length);
    copy.set(channel);
    this.port.postMessage(copy, [copy.buffer]);
    return true;
  }
}
registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
`

/**
 * 线性插值重采样：sourceRate -> 16000Hz
 * 对 ASR 来说线性插值精度已足够
 */
const resampleTo16k = (input: Float32Array, sourceRate: number): Float32Array => {
  if (sourceRate === TARGET_SAMPLE_RATE) return input
  const ratio = sourceRate / TARGET_SAMPLE_RATE
  const outLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio
    const left = Math.floor(srcIndex)
    const right = Math.min(left + 1, input.length - 1)
    const t = srcIndex - left
    output[i] = input[left] * (1 - t) + input[right] * t
  }
  return output
}

/**
 * Float32 -> Int16LE PCM
 */
const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(input.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < input.length; i++) {
    // 截断到 [-1, 1] 后乘以 0x7FFF
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true /* littleEndian */)
  }
  return buffer
}

/**
 * 麦克风录音 Hook
 *
 * 提供麦克风录音功能，输出符合火山 RealtimeAPI 要求的 PCM 流
 */
export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { onAudioData, onError, maxDuration = 60000 } = options

  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<VoiceSessionStatus>('idle')
  const [interimText] = useState('')
  const [finalText] = useState('')
  const [error, setError] = useState<VoiceError | null>(null)

  // 使用 ref 持有所有 Web Audio 资源，便于清理
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 缓冲区：累计到 320 采样点（20ms）后才向上回调一次
  const sampleBufferRef = useRef<Float32Array>(new Float32Array(0))
  // 保存最新回调，避免 worklet 闭包过期
  const onAudioDataRef = useRef(onAudioData)
  useEffect(() => {
    onAudioDataRef.current = onAudioData
  }, [onAudioData])

  // 统一清理函数
  const cleanup = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }

    // 断开节点
    try {
      workletNodeRef.current?.port.close()
    } catch {
      /* ignore */
    }
    try {
      workletNodeRef.current?.disconnect()
    } catch {
      /* ignore */
    }
    workletNodeRef.current = null

    try {
      sourceNodeRef.current?.disconnect()
    } catch {
      /* ignore */
    }
    sourceNodeRef.current = null

    // 关闭 AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {
        /* ignore */
      })
    }
    audioContextRef.current = null

    // 关闭麦克风轨道
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // 重置缓冲
    sampleBufferRef.current = new Float32Array(0)
    setIsRecording(false)
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  /**
   * 处理 worklet 发回的一段 Float32 数据：
   * 1. 重采样到 16k
   * 2. 累加到缓冲区
   * 3. 缓冲满 320 点（20ms）就转 Int16LE 并回调
   */
  const handleWorkletChunk = useCallback((float32Chunk: Float32Array, sourceRate: number) => {
    const resampled = resampleTo16k(float32Chunk, sourceRate)

    // 与已有 buffer 拼接
    const merged = new Float32Array(sampleBufferRef.current.length + resampled.length)
    merged.set(sampleBufferRef.current, 0)
    merged.set(resampled, sampleBufferRef.current.length)

    // 按 20ms 一帧切片输出
    let offset = 0
    while (merged.length - offset >= FRAME_SAMPLES) {
      const frame = merged.subarray(offset, offset + FRAME_SAMPLES)
      const pcmBuffer = floatTo16BitPCM(frame)
      onAudioDataRef.current?.(pcmBuffer)
      offset += FRAME_SAMPLES
    }

    // 保存剩余不满一帧的样本
    sampleBufferRef.current = merged.slice(offset)
  }, [])

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!isMediaRecorderSupported()) {
      const err = createVoiceError('NOT_SUPPORTED', '您的浏览器不支持录音功能', false)
      setError(err)
      onError?.(err)
      return
    }

    setError(null)
    setStatus('recording')

    try {
      // 1. 申请麦克风
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      mediaStreamRef.current = stream

      // 2. 创建 AudioContext（不强制 16k，因为部分浏览器会拒绝；后面手动重采样）
      const AudioCtor =
        (window as Window & { AudioContext: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioCtor()
      audioContextRef.current = audioContext

      // 3. 加载 AudioWorklet 模块（通过 Blob URL 内联，避免新增 public 文件）
      const blob = new Blob([PCM_WORKLET_SOURCE], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      try {
        await audioContext.audioWorklet.addModule(workletUrl)
      } finally {
        URL.revokeObjectURL(workletUrl)
      }

      // 4. 构造采集图：MediaStream -> WorkletNode（不连接 destination 避免回声）
      const source = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = source

      const worklet = new AudioWorkletNode(audioContext, 'pcm-capture-processor')
      workletNodeRef.current = worklet
      worklet.port.onmessage = event => {
        // event.data 是 Float32Array
        handleWorkletChunk(event.data as Float32Array, audioContext.sampleRate)
      }
      source.connect(worklet)

      setIsRecording(true)

      // 5. 最大录音时长保护
      maxDurationTimerRef.current = setTimeout(() => {
        if (workletNodeRef.current) {
          stopRecording()
        }
      }, maxDuration)
    } catch (err) {
      let voiceError: VoiceError

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          voiceError = createVoiceError(
            'PERMISSION_DENIED',
            '请允许麦克风权限以使用语音功能',
            false
          )
        } else if (err.name === 'NotFoundError') {
          voiceError = createVoiceError('NOT_SUPPORTED', '未检测到麦克风设备', false)
        } else {
          voiceError = createVoiceError('UNKNOWN_ERROR', err.message, true)
        }
      } else {
        voiceError = createVoiceError('UNKNOWN_ERROR', '未知错误', true)
      }

      setError(voiceError)
      setStatus('error')
      onError?.(voiceError)
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, maxDuration, onError, handleWorkletChunk])

  // 停止录音
  const stopRecording = useCallback(() => {
    cleanup()
    setStatus('idle')
  }, [cleanup])

  return {
    isRecording,
    status,
    interimText,
    finalText,
    error,
    startRecording,
    stopRecording,
  }
}
