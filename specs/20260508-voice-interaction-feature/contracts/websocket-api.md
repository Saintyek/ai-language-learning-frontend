# WebSocket API Contract: Voice Interaction

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08
**Protocol**: WebSocket
**Endpoint**: `ws://localhost:3000/voice` (development) | `wss://api.example.com/voice` (production)

---

## Connection

### Handshake

```
ws://localhost:3000/voice
```

**Headers**:
- `Authorization`: Bearer {token} (可选，如果用户已登录)

### Connection Lifecycle

1. Client connects to `/voice` endpoint
2. Server establishes connection to Volcano Engine RealtimeAPI
3. Bidirectional message exchange begins
4. Either side can close the connection

---

## Message Format

All messages are JSON-encoded text frames unless otherwise specified.

### Base Message Structure

```typescript
interface BaseMessage {
  type: string  // Message type identifier
  [key: string]: unknown  // Type-specific payload
}
```

---

## Client → Server Messages

### 1. StartSession

Initialize a new voice session.

```typescript
{
  "type": "start_session",
  "sessionId": "uuid-optional",     // Optional: Link to chat session
  "language": "cn"                   // Optional: Target language (cn, jp, us, es)
}
```

**Response**: Server starts RealtimeAPI session

---

### 2. Audio

Send audio data chunk (binary frame preferred for efficiency).

**Binary Frame Format**:
```
| Byte 0-3 | Payload |
|----------|---------|
| Type: 0x01 (Audio) | PCM audio data (Int16Array) |
```

**JSON Format (fallback)**:
```typescript
{
  "type": "audio",
  "data": "base64-encoded-pcm-audio"
}
```

**Audio Specifications**:
- Format: PCM
- Sample Rate: 16000 Hz
- Bit Depth: 16-bit
- Channels: 1 (Mono)
- Chunk Size: ~320 bytes (10ms) to 640 bytes (20ms)

---

### 3. Text

Send text message directly (bypass ASR).

```typescript
{
  "type": "text",
  "content": "用户输入的文本"
}
```

---

### 4. EndSession

End the current voice session.

```typescript
{
  "type": "end_session"
}
```

**Response**: Server sends `session_ended` event

---

## Server → Client Messages

### 1. ASR (Speech Recognition Result)

```typescript
{
  "type": "asr",
  "text": "识别的文本",
  "isFinal": false  // false = interim, true = final
}
```

**Usage**:
- `isFinal: false` → Display as gray text (interim)
- `isFinal: true` → Display as black text (final)

---

### 2. Chat (AI Response)

```typescript
{
  "type": "chat",
  "text": "AI回复的文本",
  "isFinal": false
}
```

**Streaming**:
- Multiple `isFinal: false` messages → Accumulate text
- `isFinal: true` → Complete response

---

### 3. TTS (Audio Response)

```typescript
{
  "type": "tts",
  "audio": "base64-encoded-audio",
  "sequence": 1
}
```

**Audio Specifications**:
- Format: PCM
- Sample Rate: 24000 Hz
- Bit Depth: 32-bit
- Channels: 1 (Mono)

**Playback**:
- Use `StreamingAudioPlayer.enqueue(base64Audio)`
- Play in `sequence` order

---

### 4. TTSEnded

Signals end of TTS stream.

```typescript
{
  "type": "tts_ended"
}
```

---

### 5. Pronunciation

Pronunciation analysis result.

```typescript
{
  "type": "pronunciation",
  "result": {
    "score": 85,
    "userText": "你好世界",
    "standardText": "你好世界",
    "problems": [],
    "suggestion": "发音非常标准"
  }
}
```

---

### 6. SessionEnded

Session has ended.

```typescript
{
  "type": "session_ended",
  "reason": "user_request" | "timeout" | "error"
}
```

---

### 7. Error

Error occurred.

```typescript
{
  "type": "error",
  "code": "WEBSOCKET_ERROR",
  "message": "用户友好的错误信息",
  "retryable": true
}
```

**Error Codes**:
| Code | Description | Retryable |
|------|-------------|-----------|
| `PERMISSION_DENIED` | Microphone permission denied | No |
| `NOT_SUPPORTED` | Browser not supported | No |
| `WEBSOCKET_ERROR` | WebSocket connection error | Yes |
| `WEBSOCKET_TIMEOUT` | Connection timeout | Yes |
| `ASR_ERROR` | Speech recognition failed | Yes |
| `AI_ERROR` | AI response failed | Yes |
| `TTS_ERROR` | Speech synthesis failed | Yes |
| `NETWORK_ERROR` | Network error | Yes |

---

## Message Sequence Diagrams

### Complete Voice Interaction Flow

```
Client                          Server                    Volcano Engine
  │                               │                              │
  │──── start_session ───────────>│                              │
  │                               │──── WebSocket connect ──────>│
  │                               │<─── Connected ───────────────│
  │<─── session_started ──────────│                              │
  │                               │                              │
  │──── audio (PCM chunk) ───────>│──── Audio data ─────────────>│
  │──── audio (PCM chunk) ───────>│──── Audio data ─────────────>│
  │<─── asr (interim) ────────────│<─── ASR result ──────────────│
  │──── audio (PCM chunk) ───────>│──── Audio data ─────────────>│
  │<─── asr (final) ──────────────│<─── ASR result ──────────────│
  │                               │                              │
  │                               │<─── Chat response ───────────│
  │<─── chat (streaming) ─────────│<─── Chat response ───────────│
  │<─── chat (final) ─────────────│<─── Chat complete ───────────│
  │                               │                              │
  │<─── tts (audio chunk) ────────│<─── TTS audio ───────────────│
  │<─── tts (audio chunk) ────────│<─── TTS audio ───────────────│
  │<─── tts_ended ────────────────│<─── TTS complete ────────────│
  │                               │                              │
  │<─── pronunciation ────────────│<─── Analysis result ─────────│
  │                               │                              │
  │──── end_session ─────────────>│──── Close connection ───────>│
  │<─── session_ended ────────────│                              │
  │                               │                              │
```

---

## Implementation Notes

### Frontend (Client)

```typescript
// src/api/voice.ts
export class VoiceWebSocket {
  private ws: WebSocket | null = null

  connect(onMessage: (event: VoiceEvent) => void): void {
    const wsUrl = import.meta.env.PROD 
      ? 'wss://api.example.com/voice'
      : 'ws://localhost:3000/voice'
    
    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Handle binary audio data
      } else {
        const message = JSON.parse(event.data) as VoiceEvent
        onMessage(message)
      }
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    this.ws?.send(audioData)
  }

  sendMessage(message: ClientMessage): void {
    this.ws?.send(JSON.stringify(message))
  }
}
```

### Error Handling

1. **Connection Failures**: Retry with exponential backoff (max 3 attempts)
2. **Authentication Errors**: Redirect to login
3. **Timeout Errors**: Show retry button
4. **Permission Errors**: Show permission request UI
