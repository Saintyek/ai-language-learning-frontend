/**
 * 流式音频播放器
 * 支持流式 MP3 播放，维护音频队列，支持播放控制
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
  private currentSource: AudioBufferSourceNode | null = null
  private status: PlayerStatus = 'idle'
  private currentSequence = 0
  private startTime = 0
  private pauseTime = 0
  private isDestroyed = false
  private waitTimer: ReturnType<typeof setTimeout> | null = null
  private readonly WAIT_TIMEOUT = 3000 // 等待 3 秒

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
      console.log(
        '[AudioPlayer] Enqueued audio, queue length:',
        this.audioQueue.length,
        'status:',
        this.status
      )

      // 如果有等待定时器，取消它（有新音频进来了）
      if (this.waitTimer) {
        console.log('[AudioPlayer] Cancelling wait timer, new audio arrived')
        clearTimeout(this.waitTimer)
        this.waitTimer = null
      }

      // 如果状态是 idle，自动开始播放
      if (this.status === 'idle') {
        console.log('[AudioPlayer] Auto-starting playback')
        this.play()
      }
    } catch (error) {
      console.error('Failed to enqueue audio:', error)
    }
  }

  /**
   * 开始/继续播放
   */
  play(): void {
    if (this.isDestroyed) return

    if (this.status === 'paused') {
      // 从暂停恢复
      this.status = 'playing'
      this.playNext()
    } else if (this.status === 'idle' || this.status === 'stopped') {
      // 开始新播放
      this.status = 'playing'
      this.playNext()
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.status !== 'playing') return

    this.status = 'paused'
    if (this.currentSource) {
      this.currentSource.stop()
      this.pauseTime = this.audioContext?.currentTime ?? 0
      this.currentSource = null
    }
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
    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }
    this.audioQueue = []
    this.currentSequence = 0
    this.startTime = 0
    this.pauseTime = 0
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
   * 播放下一个音频片段
   */
  private playNext(): void {
    console.log(
      '[AudioPlayer] playNext called, status:',
      this.status,
      'queue length:',
      this.audioQueue.length
    )

    if (this.status !== 'playing' || !this.audioContext) {
      return
    }

    if (this.audioQueue.length === 0) {
      // 队列为空，但可能还有音频在传输中，等待一段时间
      console.log('[AudioPlayer] Queue empty, waiting for new audio...')
      this.waitTimer = setTimeout(() => {
        console.log('[AudioPlayer] Wait timeout, no new audio arrived, stopping')
        this.waitTimer = null
        if (this.status === 'playing') {
          this.status = 'idle'
        }
      }, this.WAIT_TIMEOUT)
      return
    }

    const audioBuffer = this.audioQueue.shift()!
    console.log(
      '[AudioPlayer] Playing audio buffer, duration:',
      audioBuffer.duration.toFixed(2) + 's'
    )

    this.currentSource = this.audioContext.createBufferSource()
    this.currentSource.buffer = audioBuffer
    this.currentSource.connect(this.audioContext.destination)

    this.currentSource.onended = () => {
      console.log('[AudioPlayer] Audio playback ended, queue length:', this.audioQueue.length)
      this.currentSequence++
      this.playNext()
    }

    // 恢复 AudioContext（如果被暂停）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.currentSource.start(0)
  }
}
