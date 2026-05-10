/**
 * 语音交互相关类型定义
 * Feature: 20260508-voice-interaction-feature
 */

export type VoiceSessionStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error'

export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'WEBSOCKET_ERROR'
  | 'WEBSOCKET_TIMEOUT'
  | 'ASR_ERROR'
  | 'AI_ERROR'
  | 'TTS_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export interface VoiceError {
  code: VoiceErrorCode
  message: string
  retryable: boolean
}

export interface PronunciationProblem {
  position: number
  expected: string
  actual: string
  type: 'missing' | 'wrong' | 'extra'
}

export interface PronunciationResult {
  score: number
  userText: string
  standardText: string
  problems: PronunciationProblem[]
  suggestion: string
}

export interface VoiceSession {
  id: string
  status: VoiceSessionStatus
  interimText: string
  finalText: string
  aiResponse: string
  audioChunks: string[]
  pronunciationResult: PronunciationResult | null
  startTime: number
  endTime: number
  error: VoiceError | null
}

// WebSocket 事件类型

/** 后端连接已就绪事件（包含到火山 RealtimeAPI 的连接已建好） */
export interface ConnectedEvent {
  type: 'connected'
  sessionId: string
}

export interface ASRResponseEvent {
  type: 'asr'
  text: string
  isFinal: boolean
}

export interface ChatResponseEvent {
  type: 'chat'
  text: string
  isFinal: boolean
}

export interface TTSResponseEvent {
  type: 'tts'
  audio: string
  sequence: number
}

export interface TTSEndedEvent {
  type: 'tts_ended'
}

export interface PronunciationResponseEvent {
  type: 'pronunciation'
  result: PronunciationResult
}

export interface ErrorEvent {
  type: 'error'
  code: VoiceErrorCode
  message: string
  retryable?: boolean
}

export interface SessionEndedEvent {
  type: 'session_ended'
  reason: 'user_request' | 'timeout' | 'error'
}

export interface ASREndedEvent {
  type: 'asr_ended'
}

export type VoiceEvent =
  | ConnectedEvent
  | ASRResponseEvent
  | ChatResponseEvent
  | TTSResponseEvent
  | TTSEndedEvent
  | PronunciationResponseEvent
  | ErrorEvent
  | SessionEndedEvent
  | ASREndedEvent

// 客户端发送的事件类型

export interface StartSessionEvent {
  type: 'start_session'
  sessionId?: string
  token?: string
  language?: string
  scenario?: string
}

export interface EndSessionEvent {
  type: 'end_session'
}

export interface TextMessageEvent {
  type: 'text'
  content: string
}

export interface EndASREvent {
  type: 'end_asr'
}

export type ClientMessage = StartSessionEvent | EndSessionEvent | TextMessageEvent | EndASREvent

// Hook 返回类型

export interface UseVoiceRecorderReturn {
  isRecording: boolean
  status: VoiceSessionStatus
  interimText: string
  finalText: string
  error: VoiceError | null
  startRecording: () => Promise<void>
  stopRecording: () => void
}

// 组件 Props 类型

export interface VoiceRecorderProps {
  onTextReady?: (text: string) => void
  onSessionChange?: (session: VoiceSession) => void
  disabled?: boolean
}

export interface PronunciationAnalysisProps {
  result: PronunciationResult
  className?: string
}
