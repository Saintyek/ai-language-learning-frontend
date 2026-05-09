# Research: 语音交互功能

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08

## Overview

本文档记录语音交互功能的技术研究和决策过程。

---

## 1. API 选型决策

### Decision: 使用火山引擎 RealtimeAPI

**Rationale**: 
- 现有 TTS API (HTTP Chunked 单向流式) 不支持语音识别 (ASR) 和实时对话
- RealtimeAPI 提供完整的 ASR + AI对话 + TTS 一体化能力
- WebSocket 双向通信支持实时语音交互

**Alternatives Considered**:

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 现有 TTS API | 已集成，无额外成本 | 无 ASR 能力，无法实现语音输入 | ❌ 不满足需求 |
| RealtimeAPI | 端到端语音交互，低延迟 | 按量计费，需新增集成 | ✅ 选择此方案 |
| 第三方 ASR + TTS 组合 | 可选厂商多 | 集成复杂，延迟叠加 | ❌ 架构复杂 |

---

## 2. WebSocket 架构设计

### Decision: 后端转发模式

**Rationale**:
- API Key 安全性：火山引擎认证参数保存在后端，不暴露前端
- 可复用现有架构：后端已使用 NestJS
- 便于扩展：可在后端添加日志、监控、限流等功能

**Architecture**:
```
前端 <--WebSocket--> 后端 <--WebSocket--> 火山引擎 RealtimeAPI
```

**Alternatives Considered**:

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 前端直连火山引擎 | 少一跳延迟 | API Key 暴露前端，安全风险 | ❌ 安全问题 |
| 后端转发模式 | 安全，可控 | 多一跳延迟 | ✅ 选择此方案 |

---

## 3. 音频格式处理

### Decision: PCM 格式，浏览器端 MediaRecorder

**Rationale**:
- 火山引擎 RealtimeAPI 要求输入 PCM 16kHz 16bit 单声道
- MediaRecorder API 是浏览器标准，兼容性好
- 可通过 AudioContext 进行音频格式转换（如需要）

**Technical Details**:

| 参数 | 输入 (前端采集) | 输出 (火山引擎返回) |
|------|----------------|-------------------|
| 格式 | PCM | PCM |
| 采样率 | 16kHz | 24kHz |
| 位深 | 16bit | 32bit |
| 声道 | 单声道 | 单声道 |

---

## 4. 浏览器兼容性

### Decision: 支持 Chrome, Firefox, Safari, Edge

**Rationale**:
- MediaRecorder API 在主流浏览器中支持良好
- 需要处理 Safari 的特殊行为（可能需要 polyfill 或格式转换）

**Compatibility Notes**:

| 浏览器 | MediaRecorder | PCM 支持 | 备注 |
|--------|---------------|----------|------|
| Chrome 89+ | ✅ | ✅ | 推荐 |
| Firefox 91+ | ✅ | ✅ | 支持 |
| Safari 14.1+ | ✅ | ⚠️ | 可能需要格式转换 |
| Edge 89+ | ✅ | ✅ | 基于 Chromium |

---

## 5. 复用现有组件

### Decision: 复用 StreamingAudioPlayer 播放 AI 语音

**Rationale**:
- 现有 `src/utils/audioPlayer.ts` 已实现流式音频播放
- 支持 base64 音频队列和无缝播放
- 可直接复用，无需重新实现

**Integration**:
```typescript
// 复用现有 Hook
import { useStreamingTTS } from '../hooks/useStreamingTTS'

// WebSocket 音频数据 -> base64 -> enqueueAudio
```

---

## 6. 发音分析实现

### Decision: 基于文本相似度的简单评分

**Rationale**:
- MVP 阶段不需要复杂的音素分析
- 使用 Levenshtein 编辑距离计算相似度
- 提供基础评分和改进建议即可

**Algorithm**:
1. 获取用户发音识别文本 (ASR 结果)
2. 获取标准文本 (来自对话上下文)
3. 计算相似度评分 (0-100分)
4. 识别差异字符，生成改进建议

---

## 7. 错误处理策略

### Decision: 多层错误处理 + 用户友好提示

**Error Categories**:

| 类型 | 处理方式 | 用户提示 |
|------|----------|----------|
| 麦克风权限拒绝 | 检测权限状态 | "请开启麦克风权限" |
| WebSocket 断开 | 自动重连 (最多3次) | "连接中断，正在重连..." |
| API 限流 | 后端返回错误码 | "服务繁忙，请稍后再试" |
| 浏览器不支持 | 检测 MediaRecorder | "您的浏览器不支持录音功能" |

---

## 8. 性能优化

### Decision: 音频分片 + 流式传输

**Rationale**:
- 实时语音需要低延迟
- 音频分片发送 (20ms 一包) 减少等待时间
- 流式接收结果，实时显示

**Implementation**:
- MediaRecorder `timeslice: 20` 参数
- WebSocket 二进制帧传输
- 防抖处理中间识别结果

---

## References

- [火山引擎 RealtimeAPI 文档](https://www.volcengine.com/docs/6561/1594356)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
