/**
 * 流式音频播放器
 * 支持两种音频源：
 *   - 'pcm_s16le_24k'：火山实时语音返回的裸 PCM 流（边收边解边播）
 *   - 'mp3'：HTTP TTS 返回的 MP3 流式分片（累积后整体解码再播）
 *
 * 关键设计：MP3 流式分片不是完整 MP3 容器，单帧调用 decodeAudioData 必失败，
 * 因此 mp3 模式在 enqueue 时只累积字节，由调用方在流结束时调用 flush() 一次性解码。
 */

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'stopped'

/** 音频格式 */
export type AudioFormat = 'pcm_s16le_24k' | 'mp3'

export interface AudioChunk {
  sequence: number
  audioData: string
  timestamp: number
  isFinal: boolean
}

export interface StreamingPlayerState {
  status: PlayerStatus
  queue: AudioChunk[]
  currentSequence: number
  duration: number
  currentTime: number
}

export interface StreamingAudioPlayerOptions {
  /** 音频格式，默认 pcm_s16le_24k（实时语音模型） */
  format?: AudioFormat
  /**
   * 播放器状态变化回调
   * 内部任何 status 变更（包括自然播放结束→idle）都会触发，便于 React 层订阅
   */
  onStatusChange?: (status: PlayerStatus) => void
}

/** 实时 PCM 流的固定参数（与火山 RealtimeAPI tts.audio_config 一致） */
const PCM_SAMPLE_RATE = 24000

export class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null
  private audioQueue: AudioBuffer[] = []
  private status: PlayerStatus = 'idle'
  private currentSequence = 0
  private isDestroyed = false
  private waitTimer: ReturnType<typeof setTimeout> | null = null
  private readonly WAIT_TIMEOUT = 300
  private readonly format: AudioFormat
  /** 状态变化回调，由构造函数注入，可选 */
  private readonly onStatusChange?: (status: PlayerStatus) => void

  // 无缝播放相关
  private nextStartTime = 0
  private scheduledSources: AudioBufferSourceNode[] = []
  private lastSourceEndTime = 0

  // PCM 模式：base64 待解码队列（防止竞态）
  private pendingBase64Queue: string[] = []
  private isProcessingQueue = false

  // MP3 模式：累积所有 chunk 字节，flush 时整体解码
  private mp3ByteChunks: Uint8Array[] = []

  constructor(options: StreamingAudioPlayerOptions = {}) {
    this.format = options.format ?? 'pcm_s16le_24k'
    this.onStatusChange = options.onStatusChange
    this.initAudioContext()
  }

  /**
   * 统一的状态变更入口
   * 内部所有 status 修改都必须走这里，确保外部回调能感知到（包括自然结束→idle）
   */
  private setStatus(next: PlayerStatus): void {
    if (this.status === next) return
    this.status = next
    this.onStatusChange?.(next)
  }

  /**
   * 初始化 AudioContext
   * - PCM 模式锁 24kHz，避免浏览器自动重采样
   * - MP3 模式使用浏览器默认采样率，让 MP3 自带 header 决定播放采样率
   */
  private initAudioContext(): void {
    if (typeof window === 'undefined' || this.audioContext) return
    this.audioContext =
      this.format === 'pcm_s16le_24k'
        ? new AudioContext({ sampleRate: PCM_SAMPLE_RATE })
        : new AudioContext()
  }

  /**
   * 添加音频片段到队列
   * - PCM 模式：立即解码 + 调度播放（流式）
   * - MP3 模式：仅累积字节，等待 flush 触发解码
   */
  async enqueue(base64Audio: string): Promise<void> {
    if (this.isDestroyed) return

    if (this.format === 'mp3') {
      this.appendMp3Chunk(base64Audio)
      return
    }

    // PCM 模式：原有逻辑
    this.pendingBase64Queue.push(base64Audio)
    if (this.isProcessingQueue) return
    await this.processQueue()
  }

  /**
   * 通知本轮音频流已完整接收（仅 MP3 模式有效）
   * 把累积字节合并为单个 MP3 二进制 → decodeAudioData → 入队播放
   */
  async flush(): Promise<void> {
    if (this.isDestroyed || this.format !== 'mp3') return
    if (this.mp3ByteChunks.length === 0) return

    this.initAudioContext()
    if (!this.audioContext) return

    // 合并所有 chunk
    const mergedBuffer = this.mergeMp3Chunks()
    this.mp3ByteChunks = []

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(mergedBuffer)
      this.audioQueue.push(audioBuffer)

      if (this.waitTimer) {
        clearTimeout(this.waitTimer)
        this.waitTimer = null
      }

      if (this.status === 'idle') {
        this.play()
      } else if (this.status === 'playing') {
        await this.scheduleAudioWithResume(audioBuffer)
      }
    } catch (error) {
      console.error('[AudioPlayer] MP3 decode failed:', error)
    }
  }

  /**
   * MP3 模式：累积单个 base64 chunk 字节
   */
  private appendMp3Chunk(base64Audio: string): void {
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    this.mp3ByteChunks.push(bytes)
  }

  /**
   * MP3 模式：把所有累积 chunk 合并为单个 ArrayBuffer
   */
  private mergeMp3Chunks(): ArrayBuffer {
    const totalLength = this.mp3ByteChunks.reduce((sum, c) => sum + c.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of this.mp3ByteChunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return merged.buffer
  }

  /**
   * PCM 模式：串行处理待解码队列
   *
   * 关键修复（2026-05-10 修复 "首轮 AI 回复重复播放且前几字缺失"）：
   * 旧实现首个 chunk 解码后既 push 到 audioQueue，又调用 play()，
   * 而 play() 内部会启动一个 await audioContext.resume() 的 scheduleAllPending；
   * 在 resume 期间后续 chunk 已通过 scheduleAudio 单独调度，
   * 等 resume 完成后 scheduleAllPending 又把 audioQueue 全部调度一遍 → 重播。
   *
   * 新实现：PCM 模式不再使用 audioQueue 中转，每个 chunk 解码后立即单次 scheduleAudio；
   * 首个 chunk 进入 playing 前先 await resume()，确保 audioContext.currentTime 已推进，
   * 避免 scheduleAudio 把 startTime 落在过去时间点导致"前几字被吃"。
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true
    this.initAudioContext()

    try {
      while (this.pendingBase64Queue.length > 0) {
        const base64Audio = this.pendingBase64Queue.shift()!

        try {
          const audioBuffer = await this.decodePcm16Le24k(base64Audio)

          // 取消等待新音频的回 idle 计时器
          if (this.waitTimer) {
            clearTimeout(this.waitTimer)
            this.waitTimer = null
          }

          // 首次进入 playing：必须先 resume 再取 currentTime 作为 nextStartTime
          // 否则 currentTime 还停在 0，scheduleAudio 会把 startTime 设到过去 → 前几帧被吃
          if (this.status === 'idle' || this.status === 'stopped') {
            this.setStatus('playing')
            if (this.audioContext?.state === 'suspended') {
              await this.audioContext.resume()
            }
            this.nextStartTime = this.audioContext?.currentTime ?? 0
          }

          if (this.status === 'playing') {
            this.scheduleAudio(audioBuffer)
          }
          // 注意：暂停状态下解码的 chunk 暂时丢弃；当前应用不会在 PCM 流中暂停
        } catch (error) {
          console.error('[AudioPlayer] Failed to decode PCM audio:', error)
        }
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * 调度音频并确保 AudioContext 已恢复
   */
  private async scheduleAudioWithResume(audioBuffer: AudioBuffer): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
    this.scheduleAudio(audioBuffer)
  }

  /**
   * 开始/继续播放
   */
  play(): void {
    if (this.isDestroyed) return

    if (this.status === 'paused') {
      this.setStatus('playing')
      this.rescheduleAll()
    } else if (this.status === 'idle' || this.status === 'stopped') {
      this.setStatus('playing')
      this.nextStartTime = this.audioContext?.currentTime ?? 0
      this.scheduleAllPending()
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.status !== 'playing') return
    this.setStatus('paused')
    this.stopAllSources()
  }

  /**
   * 停止播放并清空队列
   */
  stop(): void {
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
      this.waitTimer = null
    }
    this.pendingBase64Queue = []
    this.mp3ByteChunks = []
    this.setStatus('stopped')
    this.stopAllSources()
    this.audioQueue = []
    this.currentSequence = 0
    this.nextStartTime = 0
    this.lastSourceEndTime = 0
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    this.isDestroyed = true
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  /**
   * 获取当前状态
   */
  getState(): StreamingPlayerState {
    return {
      status: this.status,
      queue: [],
      currentSequence: this.currentSequence,
      duration: 0,
      currentTime: 0,
    }
  }

  /**
   * 解码 base64 PCM (pcm_s16le/24kHz/单声道) 为 AudioBuffer
   * 火山服务端 RealtimeAPI 返回的是裸 PCM 流式分片，必须直接构造 AudioBuffer
   */
  private async decodePcm16Le24k(base64Audio: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 长度必须为偶数；奇数字节丢弃末尾 1 字节避免越界
    const byteLength = bytes.byteLength - (bytes.byteLength % 2)
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, byteLength / 2)

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, PCM_SAMPLE_RATE)
    audioBuffer.copyToChannel(float32, 0)
    return audioBuffer
  }

  /**
   * 调度单个音频片段（无缝拼接）
   */
  private scheduleAudio(audioBuffer: AudioBuffer): void {
    if (!this.audioContext || this.status !== 'playing') return

    const currentTime = this.audioContext.currentTime
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)

    const startTime = this.nextStartTime
    source.start(startTime)

    this.nextStartTime = startTime + audioBuffer.duration
    this.lastSourceEndTime = this.nextStartTime
    this.scheduledSources.push(source)

    source.onended = () => {
      const index = this.scheduledSources.indexOf(source)
      if (index > -1) {
        this.scheduledSources.splice(index, 1)
      }
      if (this.scheduledSources.length === 0 && this.audioQueue.length === 0) {
        this.waitForNewAudio()
      }
    }
  }

  /**
   * 调度队列中所有待处理的音频
   */
  private async scheduleAllPending(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }

    while (this.audioQueue.length > 0 && this.status === 'playing') {
      const audioBuffer = this.audioQueue.shift()!
      this.scheduleAudio(audioBuffer)
    }

    if (this.scheduledSources.length === 0) {
      this.waitForNewAudio()
    }
  }

  /**
   * 重新调度所有音频（从暂停恢复时使用）
   */
  private rescheduleAll(): void {
    const currentTime = this.audioContext?.currentTime ?? 0
    this.nextStartTime = currentTime
    this.scheduleAllPending()
  }

  /**
   * 停止所有已调度的音频源
   */
  private stopAllSources(): void {
    for (const source of this.scheduledSources) {
      try {
        source.stop()
      } catch {
        // 忽略已停止的源
      }
    }
    this.scheduledSources = []
  }

  /**
   * 等待新音频
   */
  private waitForNewAudio(): void {
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
    }

    this.waitTimer = setTimeout(() => {
      this.waitTimer = null
      if (
        this.status === 'playing' &&
        this.scheduledSources.length === 0 &&
        this.audioQueue.length === 0
      ) {
        // 自然播放结束 → 回到 idle，必须走 setStatus 通知外部
        this.setStatus('idle')
      }
    }, this.WAIT_TIMEOUT)
  }
}
