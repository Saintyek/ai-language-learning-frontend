import { useCallback, useEffect, useRef, useState } from 'react'
import { StreamingAudioPlayer } from '../utils/audioPlayer'
import type { AudioFormat, PlayerStatus } from '../utils/audioPlayer'

export interface UseStreamingTTSOptions {
  autoPlay?: boolean
  /** 音频格式，默认 'mp3'（HTTP TTS 链路） */
  format?: AudioFormat
}

export interface UseStreamingTTSReturn {
  status: PlayerStatus
  play: () => void
  pause: () => void
  stop: () => void
  enqueueAudio: (base64Audio: string) => Promise<void>
  /** 通知本轮音频流接收完毕（mp3 模式必需） */
  flush: () => Promise<void>
}

/**
 * TTS 流式播放 Hook
 * 默认使用 mp3 格式，与后端 HTTP TTS 服务一致
 */
export function useStreamingTTS(options: UseStreamingTTSOptions = {}): UseStreamingTTSReturn {
  const { format = 'mp3' } = options
  const playerRef = useRef<StreamingAudioPlayer | null>(null)
  const [status, setStatus] = useState<PlayerStatus>('idle')

  // 初始化播放器：format 变化时重建（一般不会变）
  useEffect(() => {
    playerRef.current = new StreamingAudioPlayer({ format })

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [format])

  // 播放
  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play()
      setStatus('playing')
    }
  }, [])

  // 暂停
  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause()
      setStatus('paused')
    }
  }, [])

  // 停止
  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop()
      setStatus('stopped')
    }
  }, [])

  // 添加音频到队列
  const enqueueAudio = useCallback(async (base64Audio: string) => {
    if (playerRef.current) {
      await playerRef.current.enqueue(base64Audio)
      setStatus(playerRef.current.getState().status)
    }
  }, [])

  // 通知音频流结束（mp3 模式触发整体解码）
  const flush = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.flush()
      setStatus(playerRef.current.getState().status)
    }
  }, [])

  return {
    status,
    play,
    pause,
    stop,
    enqueueAudio,
    flush,
  }
}
