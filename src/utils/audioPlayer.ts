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

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 })
    }
  }

  /**
   * 添加音频片段到队列
   */
  async enqueue(base64Audio: string): Promise<void> {
    if (this.isDestroyed) return

    this.initAudioContext()

    try {
      const audioBuffer = await this.decodeBase64Audio(base64Audio)
      this.audioQueue.push(audioBuffer)

      // 如果有等待定时器，取消它（有新音频进来了）
      if (this.waitTimer) {
        clearTimeout(this.waitTimer)
        this.waitTimer = null
      }

      // 如果状态是 idle，自动开始播放
      if (this.status === 'idle') {
        this.play()
      } else if (this.status === 'playing') {
        // 如果正在播放，调度新加入的音频
        this.scheduleAudio(audioBuffer)
      }
    } catch (error) {
      console.error('[AudioPlayer] Failed to enqueue audio:', error)
    }
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
   */
  private async decodeBase64Audio(base64Audio: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    // 将 base64 转换为 ArrayBuffer
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 解码音频数据
    return await this.audioContext.decodeAudioData(bytes.buffer)
  }

  /**
   * 调度单个音频片段
   */
  private scheduleAudio(audioBuffer: AudioBuffer): void {
    if (!this.audioContext || this.status !== 'playing') return

    const currentTime = this.audioContext.currentTime

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

    // 更新下一个开始时间
    this.nextStartTime = startTime + audioBuffer.duration
    this.lastSourceEndTime = this.nextStartTime

    // 保存已调度的音频源
    this.scheduledSources.push(source)

    // 设置结束回调（只对最后一个设置）
    source.onended = () => {
      // 从已调度列表中移除
      const index = this.scheduledSources.indexOf(source)
      if (index > -1) {
        this.scheduledSources.splice(index, 1)
      }

      // 如果所有音频都播放完了，检查是否有新音频
      if (this.scheduledSources.length === 0 && this.audioQueue.length === 0) {
        this.waitForNewAudio()
      }
    }
  }

  /**
   * 调度队列中所有待处理的音频
   */
  private scheduleAllPending(): void {
    while (this.audioQueue.length > 0 && this.status === 'playing') {
      const audioBuffer = this.audioQueue.shift()!
      this.scheduleAudio(audioBuffer)
    }

    // 如果没有音频被调度，等待新音频
    if (this.scheduledSources.length === 0) {
      this.waitForNewAudio()
    }

    // 恢复 AudioContext（如果被暂停）
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
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
    if (this.waitTimer) {
      clearTimeout(this.waitTimer)
    }

    this.waitTimer = setTimeout(() => {
      this.waitTimer = null
      // 如果还在播放状态但没有音频，切换到 idle
      if (
        this.status === 'playing' &&
        this.scheduledSources.length === 0 &&
        this.audioQueue.length === 0
      ) {
        this.status = 'idle'
      }
    }, this.WAIT_TIMEOUT)
  }
}
