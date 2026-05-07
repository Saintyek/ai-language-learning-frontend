# Data Model: Streaming TTS Voice

**Feature**: `streaming-tts-voice` | **Date**: 2026-05-07

## 实体定义

### 1. TTSSession (TTS 会话)

**用途**: 管理单次 TTS 会话的参数和状态

```typescript
interface TTSSession {
  /** 会话 ID */
  sessionId: string;
  
  /** 音色 ID */
  speaker: string;
  
  /** 音频格式 */
  format: 'mp3';
  
  /** 采样率 */
  sampleRate: number;
  
  /** 比特率 */
  bitRate: number;
  
  /** 会话状态 */
  status: 'pending' | 'active' | 'completed' | 'error';
  
  /** 创建时间 */
  createdAt: Date;
}
```

**默认值**:
- `speaker`: `zh_female_vv_uranus_bigtts`
- `format`: `mp3`
- `sampleRate`: `24000`
- `bitRate`: `128000`

**状态转换**:
```
pending → active → completed
       ↘ error
```

### 2. AudioChunk (音频片段)

**用途**: 表示流式返回的单个音频数据片段

```typescript
interface AudioChunk {
  /** 片段序号 */
  sequence: number;
  
  /** Base64 编码的音频数据 */
  audioData: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 是否为最后一个片段 */
  isFinal: boolean;
}
```

### 3. StreamingPlayerState (播放器状态)

**用途**: 前端播放器状态管理

```typescript
interface StreamingPlayerState {
  /** 播放状态 */
  status: 'idle' | 'playing' | 'paused' | 'stopped';
  
  /** 音频队列 */
  queue: AudioChunk[];
  
  /** 当前播放序号 */
  currentSequence: number;
  
  /** 总时长 (ms) */
  duration: number;
  
  /** 当前播放时间 (ms) */
  currentTime: number;
}
```

**状态转换**:
```
idle → playing ↔ paused
     ↓           ↓
   stopped    stopped
```

## 接口定义

### 后端 DTO

#### TTSStreamRequestDto
```typescript
class TTSStreamRequestDto {
  @IsOptional()
  @IsString()
  speaker?: string = 'zh_female_vv_uranus_bigtts';

  @IsOptional()
  @IsEnum(['mp3'])
  format?: 'mp3' = 'mp3';

  @IsOptional()
  @IsNumber()
  sampleRate?: number = 24000;
}
```

### 前端接口

#### StreamingAudioPlayer
```typescript
interface StreamingAudioPlayer {
  /** 添加音频片段到队列 */
  enqueue(base64Audio: string): void;
  
  /** 开始/继续播放 */
  play(): void;
  
  /** 暂停播放 */
  pause(): void;
  
  /** 停止播放并清空队列 */
  stop(): void;
  
  /** 销毁播放器 */
  destroy(): void;
  
  /** 当前状态 */
  readonly state: StreamingPlayerState;
}
```

#### TTSController
```typescript
interface TTSController {
  /** 发送文本片段 */
  sendText(text: string): void;
  
  /** 结束 TTS 会话 */
  finish(): void;
}
```

## 数据流

```
用户输入 → ChatService
              │
              ├── LLM API (文本流)
              │       │
              │       └── delta 事件 → 前端 SSE
              │
              └── TTS WebSocket (音频流)
                      │
                      └── audio 事件 → 前端 SSE
                              │
                              └── StreamingAudioPlayer
                                      │
                                      └── 音频队列 → 播放
```
