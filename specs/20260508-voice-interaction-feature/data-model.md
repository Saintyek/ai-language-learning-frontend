# Data Model: 语音交互功能

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08

## Overview

本文档定义语音交互功能涉及的数据实体、类型和状态。

---

## 1. VoiceSession (语音会话)

### Description
管理单次语音交互的完整生命周期状态。

### Fields

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | ✓ | 会话唯一标识 (UUID) |
| status | VoiceSessionStatus | ✓ | 当前会话状态 |
| interimText | string | | 中间识别结果 (灰色显示) |
| finalText | string | | 最终识别结果 (黑色显示) |
| aiResponse | string | | AI 文字回复 |
| audioChunks | string[] | | AI 语音回复 (base64 数组) |
| pronunciationResult | PronunciationResult \| null | | 发音分析结果 |
| startTime | number | | 录音开始时间戳 |
| endTime | number | | 录音结束时间戳 |
| error | VoiceError \| null | | 错误信息 |

### State Transitions

```
idle → recording → processing → completed
                ↘ error
```

---

## 2. VoiceSessionStatus (枚举)

### Values

```typescript
type VoiceSessionStatus = 
  | 'idle'        // 空闲，未开始
  | 'recording'   // 录音中
  | 'processing'  // 处理中 (等待 AI 回复)
  | 'completed'   // 已完成
  | 'error'       // 错误状态
```

---

## 3. PronunciationResult (发音分析结果)

### Description
用户发音质量分析结果。

### Fields

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| score | number | ✓ | 发音准确度评分 (0-100) |
| userText | string | ✓ | 用户实际发音文本 |
| standardText | string | ✓ | 标准文本 |
| problems | PronunciationProblem[] | | 问题音素列表 |
| suggestion | string | | 改进建议 |

---

## 4. PronunciationProblem (发音问题)

### Fields

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| position | number | ✓ | 问题位置索引 |
| expected | string | ✓ | 期望字符 |
| actual | string | ✓ | 实际字符 |
| type | 'missing' \| 'wrong' \| 'extra' | ✓ | 问题类型 |

---

## 5. VoiceError (错误信息)

### Fields

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| code | VoiceErrorCode | ✓ | 错误码 |
| message | string | ✓ | 用户友好错误信息 |
| retryable | boolean | ✓ | 是否可重试 |

---

## 6. VoiceErrorCode (枚举)

### Values

```typescript
type VoiceErrorCode =
  | 'PERMISSION_DENIED'     // 麦克风权限被拒绝
  | 'NOT_SUPPORTED'         // 浏览器不支持
  | 'WEBSOCKET_ERROR'       // WebSocket 连接错误
  | 'WEBSOCKET_TIMEOUT'     // WebSocket 连接超时
  | 'ASR_ERROR'             // 语音识别错误
  | 'AI_ERROR'              // AI 回复错误
  | 'TTS_ERROR'             // 语音合成错误
  | 'NETWORK_ERROR'         // 网络错误
  | 'UNKNOWN_ERROR'         // 未知错误
```

---

## 7. WebSocket Events

### Client → Server Events

#### AudioData
```typescript
interface AudioDataEvent {
  type: 'audio'
  data: ArrayBuffer  // PCM 音频数据
}
```

#### TextMessage
```typescript
interface TextMessageEvent {
  type: 'text'
  content: string
}
```

#### StartSession
```typescript
interface StartSessionEvent {
  type: 'start_session'
  sessionId?: string  // 可选：关联的聊天会话ID
  language?: string   // 可选：目标语言
}
```

#### EndSession
```typescript
interface EndSessionEvent {
  type: 'end_session'
}
```

### Server → Client Events

#### ASRResponse
```typescript
interface ASRResponseEvent {
  type: 'asr'
  text: string
  isFinal: boolean  // true=最终结果, false=中间结果
}
```

#### ChatResponse
```typescript
interface ChatResponseEvent {
  type: 'chat'
  text: string
  isFinal: boolean
}
```

#### TTSResponse
```typescript
interface TTSResponseEvent {
  type: 'tts'
  audio: string  // base64 编码音频
  sequence: number
}
```

#### TTSEnded
```typescript
interface TTSEndedEvent {
  type: 'tts_ended'
}
```

#### PronunciationResponse
```typescript
interface PronunciationResponseEvent {
  type: 'pronunciation'
  result: PronunciationResult
}
```

#### Error
```typescript
interface ErrorEvent {
  type: 'error'
  code: VoiceErrorCode
  message: string
}
```

---

## 8. Validation Rules

### VoiceSession
- `id` 必须是有效的 UUID v4
- `status` 必须是 VoiceSessionStatus 枚举值之一
- `interimText` 和 `finalText` 不能同时有值
- `startTime` 必须 <= `endTime` (如果都存在)

### PronunciationResult
- `score` 范围: 0-100 (整数)
- `userText` 长度: 1-1000 字符
- `standardText` 长度: 1-1000 字符

### AudioData
- 必须是有效的 PCM 数据
- 采样率: 16kHz
- 位深: 16bit
- 声道: 单声道

---

## TypeScript Interfaces

```typescript
// src/types/voice.ts

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
```
