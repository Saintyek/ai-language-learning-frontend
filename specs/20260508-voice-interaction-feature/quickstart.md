# Quickstart: 语音交互功能

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08

## 概述

本文档提供语音交互功能的快速开发指南，帮助开发者快速理解和实现该功能。

---

## 前置条件

### 前端
- Node.js 18+
- npm 或 pnpm
- 现代浏览器 (Chrome 89+, Firefox 91+, Safari 14.1+, Edge 89+)

### 后端 (独立仓库)
- NestJS 后端服务运行中
- 火山引擎 RealtimeAPI 凭证已配置

---

## 快速开始

### 1. 环境配置

前端项目无需额外环境变量，WebSocket 地址会根据环境自动选择：
- 开发环境: `ws://localhost:3000/voice`
- 生产环境: `wss://api.example.com/voice` (需配置 `VITE_API_BASE_URL`)

### 2. 核心文件结构

```
src/
├── api/voice.ts              # WebSocket API 封装
├── hooks/useVoiceRecorder.ts # 麦克风录音 Hook
├── components/
│   ├── VoiceRecorder/        # 录音按钮组件
│   └── PronunciationAnalysis/# 发音分析组件
├── types/voice.ts            # 类型定义
└── pages/Chat.tsx            # 聊天页面 (修改)
```

---

## 实现步骤

### Step 1: 创建类型定义

```typescript
// src/types/voice.ts
export type VoiceSessionStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error'

export interface VoiceSession {
  id: string
  status: VoiceSessionStatus
  interimText: string
  finalText: string
  // ... 其他字段见 data-model.md
}
```

### Step 2: 实现 WebSocket API 封装

```typescript
// src/api/voice.ts
export class VoiceWebSocket {
  private ws: WebSocket | null = null

  connect(onMessage: (event: VoiceEvent) => void): void {
    // 实现 WebSocket 连接
  }

  sendAudio(audioData: ArrayBuffer): void {
    // 发送音频数据
  }
}
```

### Step 3: 实现录音 Hook

```typescript
// src/hooks/useVoiceRecorder.ts
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1 }
    })
    // ... MediaRecorder 配置
  }

  return { isRecording, startRecording, stopRecording }
}
```

### Step 4: 创建录音按钮组件

```tsx
// src/components/VoiceRecorder/index.tsx
export function VoiceRecorder({ onTextReady }: VoiceRecorderProps) {
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder()

  return (
    <Button 
      icon={<IconMic />}
      onClick={isRecording ? stopRecording : startRecording}
    />
  )
}
```

### Step 5: 集成到聊天页面

```tsx
// src/pages/Chat.tsx
function Chat() {
  return (
    <ChatInput>
      <VoiceRecorder onTextReady={handleVoiceText} />
    </ChatInput>
  )
}
```

---

## 测试流程

### 单元测试

```bash
# 运行 Hook 测试
pnpm test useVoiceRecorder

# 运行 API 测试
pnpm test voice
```

### 手动测试

1. 启动开发服务器: `pnpm dev`
2. 打开浏览器访问聊天页面
3. 点击麦克风按钮
4. 允许浏览器麦克风权限
5. 说话并观察实时识别结果
6. 再次点击停止录音
7. 验证消息发送和 AI 回复

---

## 常见问题

### Q: 浏览器提示麦克风权限被拒绝

**A**: 
1. 检查浏览器地址栏左侧的权限图标
2. 清除浏览器权限设置后重试
3. 确保使用 HTTPS 或 localhost

### Q: WebSocket 连接失败

**A**:
1. 检查后端服务是否运行
2. 确认 WebSocket 端点是否正确
3. 查看浏览器控制台网络面板

### Q: 语音识别结果不准确

**A**:
1. 检查麦克风质量
2. 确保网络延迟 < 200ms
3. 验证音频格式配置 (16kHz, 16bit, 单声道)

---

## 相关文档

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Notes](./research.md)
- [Data Model](./data-model.md)
- [WebSocket API Contract](./contracts/websocket-api.md)

---

## 后续步骤

完成前端实现后，需要配合后端团队完成：

1. 后端 WebSocket Gateway 实现
2. 火山引擎 RealtimeAPI 集成
3. 发音分析服务实现
4. 端到端集成测试
