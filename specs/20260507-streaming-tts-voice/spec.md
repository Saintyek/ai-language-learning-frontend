# Feature Specification: Streaming TTS Voice

**Feature**: `streaming-tts-voice`
**Created**: 2026-05-07
**Status**: Draft
**Input**: User description: "在调用豆包语音合成API时，使用新版控制台的鉴权方式，我的X-Api-Key是cd3ba2f0-c88d-4180-b6e5-23a7c235a4ef，X-Api-Resource-Id默认传入seed-tts-2.0，因为我只使用豆包语音合成模型2.0的音色，并且音色模式使用zh_female_vv_uranus_bigtts"

## Clarifications

### Session 2026-05-07

- Q: 使用哪个 TTS API 端点？ → A: 使用 HTTP Chunked 单向流式 API `https://openspeech.bytedance.com/api/v3/tts/unidirectional`，不再使用 WebSocket 双向流式 API

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat语音自动播放 (Priority: P1)

用户在 Chat 页面进行对话时，当 LLM 流式输出文本回复时，系统自动将文本转换为语音并同步流式播放，实现"边说边播"的实时语音体验。

**Why this priority**: 这是核心价值功能，直接提升用户体验，让用户可以"听"AI回复而不是只能阅读文本。对于学习场景，语音播放能帮助用户更好地学习发音和语调。

**Technical Implementation**:

1. **架构方案**: 后端代理模式
   - 前端通过 SSE 接收文本和音频流
   - 后端统一代理火山引擎 TTS API
   - API Key 不暴露给前端，安全性高

2. **API选型**: HTTP Chunked 单向流式-V3
   - 接口地址: `https://openspeech.bytedance.com/api/v3/tts/unidirectional`
   - 一次性输入全部合成文本，流式输出音频
   - 支持连接复用，火山服务端 keep-alive 时间为 1 分钟

3. **鉴权配置**:
   - 使用新版控制台鉴权方式
   - Header: `X-Api-Key: {环境变量 VOLCENGINE_TTS_API_KEY}`
   - Header: `X-Api-Resource-Id: seed-tts-2.0`
   - 默认音色: `zh_female_vv_uranus_bigtts`

4. **音频参数**:
   - 格式: MP3
   - 采样率: 24000Hz
   - 比特率: 128000

5. **SSE事件格式**:
   ```
   event: delta
   data: {"content": "文本内容"}

   event: audio
   data: {"audio": "base64音频数据"}

   event: done
   data: {}
   ```

6. **流式策略** (适配 HTTP 单向 API):
   - 后端累积 LLM 输出的文本片段
   - 检测到句子结束符（句号、问号、感叹号）时发送到 TTS
   - 使用 HTTP 连接复用减少延迟
   - 首包延迟约 200-500ms

**Independent Test**: 可以通过发送一条消息并验证是否听到语音播放来测试。不依赖其他功能的实现。

**Acceptance Scenarios**:

1. **Given** 用户在 Chat 页面，**When** 发送消息后收到 LLM 流式回复，**Then** 自动播放对应语音，语音与文本同步输出
2. **Given** 语音正在播放，**When** 用户滚动页面或切换标签，**Then** 语音继续播放不中断
3. **Given** TTS 服务不可用，**When** LLM 流式输出文本，**Then** 文本正常显示，提示语音服务暂时不可用

---

### User Story 2 - 后端TTS流式服务 (Priority: P1)

后端实现 TTS HTTP 客户端，调用火山引擎 HTTP Chunked 单向流式 API，将 LLM 流式输出的文本累积后发送给 TTS API，并接收流式返回的音频数据。

**Why this priority**: 这是整个功能的技术基础，必须先实现后端服务才能支持前端语音播放。

**Technical Implementation**:

1. **HTTP API 请求格式**:
   - 请求方法: POST
   - Content-Type: application/json
   - Transfer-Encoding: chunked (响应)

2. **请求 Headers**:
   | Header | 说明 | 必须 |
   |--------|------|------|
   | X-Api-Key | API Key | √ |
   | X-Api-Resource-Id | 资源ID (seed-tts-2.0) | √ |
   | X-Api-Request-Id | 请求ID (UUID) | 可选 |

3. **请求 Body 结构**:
   ```json
   {
     "user": { "uid": "用户ID" },
     "req_params": {
       "text": "要合成的文本",
       "speaker": "zh_female_vv_uranus_bigtts",
       "audio_params": {
         "format": "mp3",
         "sample_rate": 24000,
         "bit_rate": 128000
       }
     }
   }
   ```

4. **响应格式**:
   ```json
   // 音频数据响应
   { "code": 0, "message": "", "data": "base64音频数据" }
   
   // 合成结束响应
   { "code": 20000000, "message": "ok", "data": null, "usage": {"text_words": 10} }
   ```

5. **流式处理流程**:
   ```
   LLM 输出文本片段
       ↓
   后端累积文本，检测句子边界
       ↓
   发送完整句子到 HTTP API
       ↓
   流式接收音频数据 (base64)
       ↓
   通过 SSE 推送给前端
   ```

6. **后端变更文件**:
   | 层级 | 文件 | 变更类型 | 描述 |
   |------|------|----------|------|
   | Module | `src/tts/tts.module.ts` | 修改 | TTS 模块定义 |
   | Service | `src/tts/tts.service.ts` | 修改 | HTTP 单向流式 TTS 服务 |
   | Controller | `src/tts/tts.controller.ts` | 修改 | TTS 流式 API 端点 |
   | DTO | `src/tts/dto/tts-stream.dto.ts` | 修改 | 请求参数 DTO |
   | Service | `src/chat/chat.service.ts` | 修改 | 集成 TTS 流式输出 |
   | Env | `.env.example` | 修改 | 添加 TTS 配置项 |

**Independent Test**: 可以通过单元测试验证 HTTP 请求构造和响应解析逻辑。

**Acceptance Scenarios**:

1. **Given** 后端服务启动，**When** 收到 TTS 请求，**Then** 成功调用 HTTP API 并返回音频数据
2. **Given** 文本累积中，**When** 检测到句子结束符，**Then** 在 500ms 内发送请求并收到首包音频响应
3. **Given** HTTP 连接复用，**When** 多次请求，**Then** 复用同一 TCP 连接

---

### User Story 3 - 前端流式音频播放器 (Priority: P2)

前端实现流式音频播放器，支持 MP3 格式的流式播放，维护音频队列确保连续播放，提供基础的播放控制。

**Why this priority**: 前端播放器是用户体验的直接体现，但依赖于后端 TTS 服务的实现。

**Technical Implementation**:

1. **播放器设计**:
   - 使用 `AudioContext` 或 `<audio>` 元素
   - 维护音频队列，支持连续播放
   - 支持基础的播放控制（暂停、继续、停止）

2. **前端变更文件**:
   | 层级 | 文件 | 变更类型 | 描述 |
   |------|------|----------|------|
   | API | `src/api/tts.ts` | 新增 | TTS 流式 API 调用 |
   | Utils | `src/utils/audioPlayer.ts` | 新增 | 流式音频播放器 |
   | Hook | `src/hooks/useStreamingTTS.ts` | 新增 | TTS 流式播放 Hook |
   | Hook | `src/pages/Chat/hooks/useChat.ts` | 修改 | 集成 TTS 自动播放 |

3. **接口定义**:
   ```typescript
   interface StreamingAudioPlayer {
     enqueue(base64Audio: string): void
     play(): void
     pause(): void
     stop(): void
     destroy(): void
   }

   interface StreamTTSParams {
     onAudio: (audioBase64: string) => void
     signal?: AbortSignal
   }

   interface TTSController {
     sendText: (text: string): void
     finish: () => void
   }
   ```

4. **调用链**:
   ```
   用户发送消息 → useChat.handleSubmitText()
       │
       └── streamChatMessage()
               │
               ├── onChunk(文本) → 更新 UI + 发送到 TTS
               │
               └── onAudio(音频) → 播放音频
   ```

**Independent Test**: 可以通过模拟音频数据测试播放器的队列管理和播放控制功能。

**Acceptance Scenarios**:

1. **Given** 播放器已初始化，**When** 收到音频数据片段，**Then** 自动排队并按顺序播放
2. **Given** 音频正在播放，**When** 用户点击暂停，**Then** 暂停播放并保持当前进度
3. **Given** 音频队列中有多个片段，**When** 当前片段播放完毕，**Then** 自动播放下一个片段

---

### Edge Cases

- **HTTP 连接超时**: 实现请求超时处理，默认 30 秒超时
- **首包延迟**: 约 200-500ms，通过连接复用和提前发送缓解
- **文本累积策略**: 检测句子结束符（。！？），最大累积 100 字符强制发送
- **音频卡顿**: 音频队列缓冲，预加载策略
- **TTS 服务不可用**: 前端降级处理，仅显示文本

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST 在 LLM 流式输出文本时，同步调用火山引擎 TTS API 进行语音合成
- **FR-002**: System MUST 使用 HTTP Chunked 单向流式-V3 API，一次性输入文本并流式输出音频
- **FR-003**: System MUST 使用新版控制台鉴权方式，通过环境变量配置 API Key
- **FR-004**: System MUST 默认使用 `seed-tts-2.0` 作为 Resource-Id
- **FR-005**: System MUST 默认使用 `zh_female_vv_uranus_bigtts` 音色
- **FR-006**: System MUST 输出 MP3 格式音频，采样率 24000Hz
- **FR-007**: System MUST 通过 SSE 协议向前端推送文本和音频数据
- **FR-008**: System MUST 在前端实现流式音频播放器，支持连续播放
- **FR-009**: System MUST 实现文本累积策略，检测句子边界后发送到 TTS API
- **FR-010**: System MUST 在 TTS 服务不可用时降级为仅显示文本

### Key Entities

- **TTSSession**: TTS 会话实体，包含 speaker、format、sampleRate 等参数
- **AudioChunk**: 音频片段实体，包含 base64 编码的音频数据和序列号
- **StreamingPlayer**: 流式播放器实体，管理音频队列和播放状态

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 首包音频延迟小于 500ms（从收到首个文本片段到播放首个音频片段）
- **SC-002**: 语音播放与文本输出的同步延迟小于 1 秒
- **SC-003**: HTTP API 调用成功率大于 99%
- **SC-004**: 用户可以在语音播放过程中暂停、继续、停止播放
- **SC-005**: TTS 服务不可用时，文本显示不受影响，用户体验不中断
