import { useCallback, useEffect, useRef, useState } from 'react'
import { StreamingAudioPlayer } from '../utils/audioPlayer'
import type { PlayerStatus } from '../utils/audioPlayer'

export interface UseStreamingTTSOptions {
  autoPlay?: boolean
}

export interface UseStreamingTTSReturn {
  status: PlayerStatus
  play: () => void
  pause: () => void
  stop: () => void
  enqueueAudio: (base64Audio: string) => Promise<void>
}

/**
 * TTS 流式播放 Hook
 */
export function useStreamingTTS(options: UseStreamingTTSOptions = {}): UseStreamingTTSReturn {
  const { autoPlay = true } = options
  const playerRef = useRef<StreamingAudioPlayer | null>(null)
  const [status, setStatus] = useState<PlayerStatus>('idle')

  // 初始化播放器
  useEffect(() => {
    playerRef.current = new StreamingAudioPlayer()

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

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

      // 更新状态
      const state = playerRef.current.getState()
      setStatus(state.status)
    }
  }, [])

  return {
    status,
    play,
    pause,
    stop,
    enqueueAudio,
  }
}
