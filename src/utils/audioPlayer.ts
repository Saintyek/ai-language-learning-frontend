/**
 * 流式音频播放器
 * 支持流式 MP3 无缝播放，维护音频队列，使用 Web Audio API 调度消除片段间隙
 */

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'stopped'

export interface AudioChunk {
  sequence: number
  audioData: string // base64 编码
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

export class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null
  private audioQueue: AudioBuffer[] = []
  private status: PlayerStatus = 'idle'
  private currentSequence = 0
  private isDestroyed = false
  private waitTimer: ReturnType<typeof setTimeout> | null = null
  private readonly WAIT_TIMEOUT = 3000 // 等待 3 秒

  // 无缝播放相关
  private nextStartTime = 0 // 下一个音频片段的开始时间
  private scheduledSources: AudioBufferSourceNode[] = [] // 已调度的音频源
  private lastSourceEndTime = 0 // 最后一个音频的结束时间

  // 防止竞态条件：待处理的 base64 音频队列和正在处理的标志
  private pendingBase64Queue: string[] = []
  private isProcessingQueue = false

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 })
    }
  }

  /**
   * 添加音频片段到队列（线程安全）
   */
  async enqueue(base64Audio: string): Promise<void> {
    if (this.isDestroyed) return

    // 将音频加入待处理队列
    this.pendingBase64Queue.push(base64Audio)

    // 如果已经在处理队列，直接返回（新的音频会被后续处理）
    if (this.isProcessingQueue) {
      return
    }

    // 开始处理队列
    await this.processQueue()
  }

  /**
   * 处理待解码的音频队列（串行处理，避免竞态条件）
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true
    this.initAudioContext()

    try {
      // 串行处理所有待解码的音频
      while (this.pendingBase64Queue.length > 0) {
        const base64Audio = this.pendingBase64Queue.shift()!

        try {
          const audioBuffer = await this.decodeBase64Audio(base64Audio)
          this.audioQueue.push(audioBuffer)

          // 如果有等待定时器，取消它（有新音频进来了）
          if (this.waitTimer) {
            clearTimeout(this.waitTimer)
            this.waitTimer = null
          }

          // 根据当前状态处理音频
          if (this.status === 'idle') {
            // 状态是 idle，开始播放（这会调度队列中的所有音频）
            this.play()
          } else if (this.status === 'playing') {
            // 状态已经是 playing，直接调度新加入的音频
            this.scheduleAudio(audioBuffer)
          }
        } catch (error) {
          console.error('[AudioPlayer] Failed to decode audio:', error)
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
    // 如果 AudioContext 被暂停，先恢复
    if (this.audioContext?.state === 'suspended') {
      console.log('[AudioPlayer] scheduleAudioWithResume - AudioContext is suspended, resuming...')
      await this.audioContext.resume()
      console.log('[AudioPlayer] scheduleAudioWithResume - AudioContext resumed')
    }
    this.scheduleAudio(audioBuffer)
  }

  /**
   * 开始/继续播放
   */
  play(): void {
    if (this.isDestroyed) return

    if (this.status === 'paused') {
      // 从暂停恢复 - 需要重新调度
      this.status = 'playing'
      this.rescheduleAll()
    } else if (this.status === 'idle' || this.status === 'stopped') {
      // 开始新播放
      this.status = 'playing'
      // 初始化开始时间为当前时间
      this.nextStartTime = this.audioContext?.currentTime ?? 0
      this.scheduleAllPending()
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.status !== 'playing') return

    this.status = 'paused'
    // 停止所有已调度的音频
    this.stopAllSources()
  }

  /**
   * 停止播放并清空队列
   */
  stop(): void {
    // 清除等待定时器
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
      this.waitTimer = null
    }
    // 清空待处理队列
    this.pendingBase64Queue = []
    this.status = 'stopped'
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
   * 解码 base64 音频为 AudioBuffer
   * 关键修复（2026-05-09）：火山服务端 TTS 返回的是裸 PCM (pcm_s16le/24kHz/单声道)
   * 流式分片，必须直接构造 AudioBuffer，不能用 decodeAudioData
   * （decodeAudioData 只能处理完整 OGG/WAV/MP3 容器，对裸 PCM 会抛 EncodingError）
   */
  private async decodeBase64Audio(base64Audio: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    // base64 → Uint8Array
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 裸 PCM int16 小端序 → Int16Array（注意按 byteOffset/length/2 切片）
    // 长度必须为偶数；若服务端返回奇数字节，丢弃末尾 1 字节避免越界
    const byteLength = bytes.byteLength - (bytes.byteLength % 2)
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, byteLength / 2)

    // Int16 [-32768, 32767] → Float32 [-1, 1]，AudioBuffer 要求 Float32
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000
    }

    // 24kHz 单声道，与后端 tts.audio_config 一致；与 AudioContext 采样率一致
    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000)
    audioBuffer.copyToChannel(float32, 0)
    return audioBuffer
  }

  /**
   * 调度单个音频片段
   */
  private scheduleAudio(audioBuffer: AudioBuffer): void {
    if (!this.audioContext || this.status !== 'playing') return

    const currentTime = this.audioContext.currentTime
    console.log(
      '[AudioPlayer] scheduleAudio - currentTime:',
      currentTime,
      'audioContext.state:',
      this.audioContext.state,
      'bufferDuration:',
      audioBuffer.duration
    )

    // 如果下一个开始时间已经过去，从当前时间开始
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)

    // 使用精确的开始时间实现无缝播放
    const startTime = this.nextStartTime
    source.start(startTime)
    console.log(
      '[AudioPlayer] Audio scheduled to start at:',
      startTime,
      'end at:',
      startTime + audioBuffer.duration
    )

    // 更新下一个开始时间
    this.nextStartTime = startTime + audioBuffer.duration
    this.lastSourceEndTime = this.nextStartTime

    // 保存已调度的音频源
    this.scheduledSources.push(source)
    console.log('[AudioPlayer] scheduledSources count:', this.scheduledSources.length)

    // 设置结束回调
    source.onended = () => {
      console.log('[AudioPlayer] onended callback triggered')
      // 从已调度列表中移除
      const index = this.scheduledSources.indexOf(source)
      if (index > -1) {
        this.scheduledSources.splice(index, 1)
      }
      console.log(
        '[AudioPlayer] After removal - scheduledSources:',
        this.scheduledSources.length,
        'audioQueue:',
        this.audioQueue.length
      )

      // 如果所有音频都播放完了，检查是否有新音频
      if (this.scheduledSources.length === 0 && this.audioQueue.length === 0) {
        console.log('[AudioPlayer] All audio finished, calling waitForNewAudio')
        this.waitForNewAudio()
      }
    }
  }

  /**
   * 调度队列中所有待处理的音频
   */
  private async scheduleAllPending(): Promise<void> {
    // 恢复 AudioContext（如果被暂停）- 必须在调度音频之前
    if (this.audioContext?.state === 'suspended') {
      console.log('[AudioPlayer] AudioContext is suspended, resuming...')
      await this.audioContext.resume()
      console.log('[AudioPlayer] AudioContext resumed, state:', this.audioContext.state)
    }

    while (this.audioQueue.length > 0 && this.status === 'playing') {
      const audioBuffer = this.audioQueue.shift()!
      this.scheduleAudio(audioBuffer)
    }

    // 如果没有音频被调度，等待新音频
    if (this.scheduledSources.length === 0) {
      this.waitForNewAudio()
    }
  }

  /**
   * 重新调度所有音频（从暂停恢复时使用）
   */
  private rescheduleAll(): void {
    // 计算暂停时已播放的时间
    const currentTime = this.audioContext?.currentTime ?? 0
    this.nextStartTime = currentTime

    // 重新调度队列中的音频
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
    console.log('[AudioPlayer] waitForNewAudio called, current waitTimer:', !!this.waitTimer)
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
    }

    this.waitTimer = setTimeout(() => {
      console.log('[AudioPlayer] waitTimer fired, checking status:', {
        status: this.status,
        scheduledSources: this.scheduledSources.length,
        audioQueue: this.audioQueue.length,
      })
      this.waitTimer = null
      // 如果还在播放状态但没有音频，切换到 idle
      if (
        this.status === 'playing' &&
        this.scheduledSources.length === 0 &&
        this.audioQueue.length === 0
      ) {
        console.log('[AudioPlayer] Setting status to idle')
        this.status = 'idle'
      }
    }, this.WAIT_TIMEOUT)
  }
}
