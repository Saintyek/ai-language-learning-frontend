# Research: Streaming TTS Voice

**Feature**: `streaming-tts-voice` | **Date**: 2026-05-07

## 研究任务

### 1. 火山引擎 TTS WebSocket 双向流式-V3 API

**Decision**: 使用 WebSocket 双向流式-V3 API

**Rationale**: 
- 支持实时流式输入文本，适配 LLM 流式输出场景
- 火山引擎官方推荐用于对接大文本模型
- 相比 HTTP 单向流式，无需等待完整文本

**Alternatives Considered**:
| API | 适用场景 | 不选择原因 |
|-----|---------|-----------|
| HTTP Chunked/SSE 单向流式 | 已有完整文本 | 需要一次性输入全部文本 |
| WebSocket 单向流式 | 已有完整文本 | 需要一次性输入全部文本 |

**API Details**:
- 接口地址: `wss://openspeech.bytedance.com/api/v3/tts/bidirection`
- 鉴权方式: Header 携带 `X-Api-Key` 和 `X-Api-Resource-Id`
- 协议: 二进制帧格式

### 2. 前端流式音频播放方案

**Decision**: 使用 AudioContext + 音频队列方案

**Rationale**:
- AudioContext 支持流式解码 MP3
- 音频队列确保连续播放
- 支持播放控制（暂停、继续、停止）

**Alternatives Considered**:
| 方案 | 优点 | 缺点 |
|-----|-----|-----|
| `<audio>` 元素 + Blob URL | 简单 | 需要完整音频文件，不支持流式 |
| AudioContext + SourceBuffer | 支持流式 | 实现复杂，需要 MSE |
| AudioContext + 音频队列 | 支持流式，实现适中 | 需要管理队列 |

**Implementation Notes**:
- 将 base64 音频解码为 ArrayBuffer
- 使用 AudioContext.decodeAudioData() 解码
- 维护 AudioBufferSourceNode 队列
- 顺序播放，支持暂停/继续

### 3. 后端 WebSocket 客户端实现

**Decision**: 使用 Node.js 原生 WebSocket

**Rationale**:
- NestJS 不内置 WebSocket 客户端
- 使用 `ws` 库或原生 WebSocket
- 与火山引擎二进制协议兼容

**Protocol Details**:
- 二进制帧格式，头部 4 字节 + 可选 event number 4 字节 + payload
- Event types: StartConnection(1), StartSession(100), TaskRequest(200), TTSResponse(352)
- Payload 使用 JSON 序列化

### 4. SSE 与 WebSocket 并行处理

**Decision**: 后端同时维护 SSE 连接和 WebSocket 连接

**Rationale**:
- SSE 用于向前端推送文本和音频
- WebSocket 用于与火山引擎通信
- ChatService 协调两个连接的数据流

**Data Flow**:
```
LLM SSE 流 → ChatService
    │
    ├── 写入前端 SSE (文本 delta)
    │
    └── 发送到 TTS WebSocket
            │
            └── 接收音频 → 写入前端 SSE (audio)
```

## 依赖库

### 后端新增依赖
```json
{
  "ws": "^8.x"  // WebSocket 客户端
}
```

### 前端新增依赖
无需新增，使用浏览器原生 API：
- AudioContext
- fetch (SSE)

## 风险与缓解

| 风险 | 缓解措施 |
|-----|---------|
| WebSocket 断线 | 实现断线重连，最多 3 次，间隔 1s |
| 首包延迟 200-500ms | 提前建立连接，连接复用 |
| 音频卡顿 | 音频队列缓冲，预加载策略 |
| 并发限制 | 后端限流，连接池管理 |
