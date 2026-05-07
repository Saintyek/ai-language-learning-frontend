# Tasks: Streaming TTS Voice

**Input**: Design documents from `/specs/20260507-streaming-tts-voice/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**组织方式**: 任务按用户故事分组，支持独立实现和测试。

## 格式说明
- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事 (US1, US2, US3)

## 路径约定
- **后端**: `ai-language-learning-backend/src/`
- **前端**: `ai-language-learning-frontend/src/`

---

## Phase 1: Setup (项目初始化)

**目的**: 环境准备和基础结构创建

- [x] T001 [P] 后端安装 HTTP 客户端依赖: `cd ai-language-learning-backend && npm install axios` (如未安装)
- [x] T002 [P] 后端创建 TTS 模块目录结构: `src/tts/`, `src/tts/dto/`, `src/tts/interfaces/`
- [x] T003 [P] 后端添加环境变量到 `.env.example`: `VOLCENGINE_TTS_API_KEY`, `VOLCENGINE_TTS_RESOURCE_ID`, `VOLCENGINE_TTS_DEFAULT_SPEAKER`

**Checkpoint**: 项目结构就绪，可以开始核心开发

---

## Phase 2: Foundational - US2 后端TTS流式服务 (Priority: P1) 🎯 MVP基础

**目标**: 实现与火山引擎的 HTTP Chunked 单向流式通信，支持文本输入和音频输出

**独立测试**: 通过单元测试验证 HTTP 请求构造和响应解析逻辑

### US2 实现任务

- [x] T004 [P] [US2] 创建火山引擎 HTTP API 接口定义 `ai-language-learning-backend/src/tts/interfaces/volcengine-tts.interface.ts`
  - 定义请求 Body 接口
  - 定义响应接口
  - 定义音频参数接口

- [x] T005 [P] [US2] 创建请求参数 DTO `ai-language-learning-backend/src/tts/dto/tts-stream.dto.ts`
  - TTSStreamRequestDto 类
  - 验证装饰器

- [x] T006 [US2] 实现 HTTP 客户端管理 `ai-language-learning-backend/src/tts/tts.service.ts`
  - 使用 axios 或 node-fetch 发送 HTTP POST 请求
  - 流式接收响应数据
  - 连接复用 (keep-alive)
  - 请求超时处理

- [x] T007 [US2] 实现文本累积策略
  - 检测句子结束符（。！？）
  - 最大累积 100 字符强制发送
  - 文本缓冲区管理

- [x] T008 [US2] 实现文本发送和音频接收
  - POST 请求发送文本
  - 流式接收音频数据
  - 音频数据 base64 编码

- [x] T009 [US2] 创建 TTS Controller `ai-language-learning-backend/src/tts/tts.controller.ts`
  - POST /api/tts/stream 端点
  - SSE 响应格式

- [x] T010 [US2] 创建 TTS Module `ai-language-learning-backend/src/tts/tts.module.ts`
  - 注册 Service 和 Controller
  - 导出 Service 供 ChatService 使用

- [x] T011 [US2] 注册 TTS 模块到 AppModule `ai-language-learning-backend/src/app.module.ts`

**Checkpoint**: 后端 TTS 服务可用，可通过 API 测试验证

---

## Phase 3: Foundational - US3 前端流式音频播放器 (Priority: P2)

**目标**: 实现支持 MP3 流式播放的音频播放器，维护播放队列，支持播放控制

**独立测试**: 通过模拟音频数据测试播放器的队列管理和播放控制功能

### US3 实现任务

- [x] T012 [P] [US3] 创建流式音频播放器 `ai-language-learning-frontend/src/utils/audioPlayer.ts`
  - StreamingAudioPlayer 类
  - AudioContext 初始化
  - 音频队列管理
  - enqueue/play/pause/stop/destroy 方法

- [x] T013 [US3] 实现音频解码
  - base64 转 ArrayBuffer
  - AudioContext.decodeAudioData() 解码 MP3
  - AudioBufferSourceNode 队列播放

- [x] T014 [US3] 实现播放控制
  - 暂停/继续功能
  - 停止并清空队列
  - 播放状态管理 (idle/playing/paused/stopped)

- [x] T015 [P] [US3] 创建 TTS API 封装 `ai-language-learning-frontend/src/api/tts.ts`
  - streamTTS 函数
  - SSE 连接管理
  - 音频数据回调

- [x] T016 [US3] 创建 useStreamingTTS Hook `ai-language-learning-frontend/src/hooks/useStreamingTTS.ts`
  - 播放器实例管理
  - 音频数据入队
  - 播放控制接口

**Checkpoint**: 前端播放器可用，可通过模拟音频数据独立测试

---

## Phase 4: Integration - US1 Chat语音自动播放 (Priority: P1) 🎯 MVP

**目标**: 在 Chat 页面集成 TTS，实现 LLM 流式输出时同步播放语音

**独立测试**: 发送一条消息并验证是否听到语音播放

### US1 实现任务

- [x] T017 [US1] 修改 ChatService 集成 TTS `ai-language-learning-backend/src/chat/chat.service.ts`
  - 注入 TtsService
  - 在 pipeArkStream 中发送文本到 TTS
  - 接收音频并写入 SSE (audio 事件)
  - 添加 enableTTS 参数控制

- [x] T018 [US1] 修改前端 Chat 流式处理 `ai-language-learning-frontend/src/api/chat.ts`
  - 处理 audio 事件
  - 调用音频播放回调

- [x] T019 [US1] 修改 useChat Hook 集成 TTS `ai-language-learning-frontend/src/pages/Chat/hooks/useChat.ts`
  - 初始化 StreamingAudioPlayer
  - 连接音频播放器到 Chat 流
  - 添加播放控制 UI 状态

- [x] T020 [US1] 添加错误处理和降级
  - TTS 服务不可用时显示提示
  - 文本显示不受影响

**Checkpoint**: Chat 页面完整功能可用，语音自动播放

---

## Phase 5: Polish & Cross-Cutting Concerns

**目的**: 改进和优化

- [x] T021 [P] 添加播放控制 UI 组件（暂停/继续/停止按钮）
- [x] T022 [P] 性能优化：连接复用、音频预加载
- [x] T023 更新 API 文档和用户指南

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) 
    ↓
Phase 2 (US2: Backend TTS) ──┬──→ Phase 4 (US1: Chat Integration)
                              │
Phase 3 (US3: Frontend Player)┘
    ↓
Phase 5 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US2 (后端TTS) | Setup | Phase 1 完成 |
| US3 (前端播放器) | Setup | Phase 1 完成 (可与 US2 并行) |
| US1 (Chat集成) | US2 + US3 | Phase 2 & 3 完成 |

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 可并行
- **Phase 2**: T004, T005 可并行
- **Phase 2 & 3**: US2 和 US3 可并行开发（不同仓库）
- **Phase 3**: T012, T015 可并行

---

## Implementation Strategy

### MVP 路径 (最小可行产品)

1. ✅ Phase 1: Setup
2. ✅ Phase 2: 后端 TTS 服务
3. ✅ Phase 3: 前端播放器
4. ✅ Phase 4: Chat 集成
5. **STOP & VALIDATE**: 端到端测试

### 增量交付

| 里程碑 | 交付内容 | 价值 |
|--------|---------|------|
| M1 | US2 后端服务 | API 可用 |
| M2 | US3 前端播放器 | 播放器可用 |
| M3 | US1 Chat集成 | 完整功能 🎯 |

---

## Notes

- [P] 任务 = 不同文件，可并行
- [Story] 标签 = 任务所属用户故事
- 每个 Checkpoint 后验证独立功能
- 按任务编号顺序执行
- 每完成一个任务提交代码
