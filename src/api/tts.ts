/**
 * TTS 流式 API 封装
 */

const getApiBaseUrl = () => (import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : '')

/**
 * 简单 TTS API - 播放单个文本
 * @param text 要播放的文本
 * @param language 语言代码 (cn, jp, us, es)
 * @returns Promise<string[]> 返回音频 base64 数组
 */
export async function fetchTTS(text: string, language?: string): Promise<string[]> {
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/tts/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, language }),
  })

  if (!response.ok || !response.body) {
    throw new Error('TTS request failed')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const audioChunks: string[] = []

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    // 解析 SSE 事件
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const lines = event.split('\n')
      let eventType = ''
      let data = ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          data = line.slice(5).trim()
        }
      }

      if (eventType === 'audio' && data) {
        try {
          const parsed = JSON.parse(data) as { audio?: string }
          if (parsed.audio) {
            audioChunks.push(parsed.audio)
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return audioChunks
}

export interface StreamTTSParams {
  onAudio: (audioBase64: string) => void
  onError?: (error: string) => void
  signal?: AbortSignal
}

export interface TTSController {
  sendText: (text: string) => void
  finish: () => void
}

/**
 * 流式 TTS API
 * 注意：当前设计中，TTS 音频通过 Chat SSE 流返回，此函数作为备用方案
 */
export function streamTTS(params: StreamTTSParams): TTSController {
  const { onAudio, onError, signal } = params
  const baseUrl = getApiBaseUrl()

  let isFinished = false
  const textQueue: string[] = []

  // 开始 SSE 连接
  fetch(`${baseUrl}/api/tts/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
    signal,
  })
    .then(response => {
      if (!response.ok || !response.body) {
        throw new Error('TTS stream request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processBuffer = () => {
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const lines = event.split('\n')
          let eventType = ''
          let data = ''

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              data = line.slice(5).trim()
            }
          }

          if (eventType === 'audio' && data) {
            try {
              const parsed = JSON.parse(data) as { audio?: string }
              if (parsed.audio) {
                onAudio(parsed.audio)
              }
            } catch {
              // Ignore parse errors
            }
          } else if (eventType === 'error' && data) {
            try {
              const parsed = JSON.parse(data) as { message?: string }
              if (parsed.message && onError) {
                onError(parsed.message)
              }
            } catch {
              // Ignore parse errors
            }
          } else if (eventType === 'done') {
            isFinished = true
          }
        }
      }

      const readStream = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            return
          }

          buffer += decoder.decode(value, { stream: true })
          processBuffer()

          if (!isFinished) {
            return readStream()
          }
        })
      }

      return readStream()
    })
    .catch(error => {
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error')
      }
    })

  return {
    sendText: (text: string) => {
      if (!isFinished) {
        textQueue.push(text)
        // 在实际实现中，这里需要通过 WebSocket 发送文本
        // 当前通过 Chat SSE 流返回音频，此方法作为备用
      }
    },
    finish: () => {
      isFinished = true
    },
  }
}
