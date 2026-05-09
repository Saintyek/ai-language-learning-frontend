/**
 * WebSocket 语音 API 封装
 * Feature: 20260508-voice-interaction-feature
 */

import type { VoiceEvent, ClientMessage, VoiceError, VoiceErrorCode } from '../types/voice'

export interface VoiceWebSocketOptions {
  onMessage?: (event: VoiceEvent) => void
  onError?: (error: VoiceError) => void
  onOpen?: () => void
  onClose?: () => void
  token?: string
  /** 连接成功后立即发送的初始消息 */
  initialMessage?: ClientMessage
}

export interface VoiceWebSocketController {
  sendAudio: (audioData: ArrayBuffer) => void
  sendMessage: (message: ClientMessage) => void
  disconnect: () => void
  isConnected: () => boolean
}

const getWebSocketUrl = (): string => {
  const baseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : ''

  const protocol = import.meta.env.PROD ? 'wss' : 'ws'
  const host = baseUrl ? baseUrl.replace(/^https?:\/\//, '') : 'localhost:3000'

  return `${protocol}://${host}/ws/voice`
}

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
 * 创建 WebSocket 语音连接
 */
export function createVoiceWebSocket(options: VoiceWebSocketOptions): VoiceWebSocketController {
  const { onMessage, onError, onOpen, onClose, initialMessage } = options

  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 3
  const reconnectDelay = 1000

  const connect = (): void => {
    try {
      const url = getWebSocketUrl()
      ws = new WebSocket(url)

      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        reconnectAttempts = 0
        // 发送初始消息（如 start_session）- 使用 NestJS ws adapter 期望的格式
        if (initialMessage && ws?.readyState === WebSocket.OPEN) {
          const nestMessage = {
            event: initialMessage.type,
            data: initialMessage,
          }
          ws.send(JSON.stringify(nestMessage))
        }
        onOpen?.()
      }

      ws.onmessage = event => {
        if (event.data instanceof ArrayBuffer) {
          // Binary audio data - handle separately if needed
          console.log('[VoiceWebSocket] Received binary data')
          return
        }

        try {
          const message = JSON.parse(event.data) as VoiceEvent
          onMessage?.(message)
        } catch {
          console.error('[VoiceWebSocket] Failed to parse message:', event.data)
        }
      }

      ws.onerror = () => {
        onError?.(createVoiceError('WEBSOCKET_ERROR', 'WebSocket 连接错误', true))
      }

      ws.onclose = event => {
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(
            `[VoiceWebSocket] Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`
          )
          setTimeout(connect, reconnectDelay * reconnectAttempts)
        } else {
          onClose?.()
        }
      }
    } catch {
      onError?.(createVoiceError('WEBSOCKET_ERROR', 'WebSocket 连接失败', true))
    }
  }

  connect()

  // ArrayBuffer 转 Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const sendAudio = (audioData: ArrayBuffer): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      // 使用 NestJS ws adapter 期望的格式发送音频数据
      const base64Audio = arrayBufferToBase64(audioData)
      const nestMessage = {
        event: 'audio',
        data: {
          type: 'audio',
          data: base64Audio,
        },
      }
      ws.send(JSON.stringify(nestMessage))
    }
  }

  const sendMessage = (message: ClientMessage): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      // 使用 NestJS ws adapter 期望的格式: { event: string, data: any }
      const nestMessage = {
        event: message.type,
        data: message,
      }
      console.log('[VoiceWebSocket] Sending message:', nestMessage)
      ws.send(JSON.stringify(nestMessage))
    } else {
      console.warn(
        '[VoiceWebSocket] Cannot send message, WebSocket not open. State:',
        ws?.readyState
      )
    }
  }

  const disconnect = (): void => {
    if (ws) {
      ws.close(1000, 'User disconnect')
      ws = null
    }
  }

  const isConnected = (): boolean => {
    return ws?.readyState === WebSocket.OPEN
  }

  return {
    sendAudio,
    sendMessage,
    disconnect,
    isConnected,
  }
}

/**
 * 检查浏览器是否支持 WebSocket
 */
export function isWebSocketSupported(): boolean {
  return typeof WebSocket !== 'undefined'
}
