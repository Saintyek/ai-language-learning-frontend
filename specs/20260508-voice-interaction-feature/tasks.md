# Task Breakdown: 语音交互功能

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

本文档将语音交互功能分解为可执行的开发任务。任务按 User Story 优先级组织，每个 User Story 形成一个完整的、可独立测试的增量交付。

**项目范围**: 本文档仅包含前端任务。后端任务在独立仓库 (`ai-language-learning-backend`) 中实现。

---

## Phase 1: Setup

**目标**: 建立项目基础设施，为后续开发做准备。

| Task ID | Description | File | Dependencies |
|---------|-------------|------|--------------|
| T001 | [x] [P] 创建语音相关类型定义文件 | `src/types/voice.ts` | - |
| T002 | [x] [P] 创建 WebSocket 语音 API 封装基础结构 | `src/api/voice.ts` | T001 |

**Checkpoint**: 类型定义和 API 骨架就位，可开始 User Story 开发。

---

## Phase 2: User Story 1 - 麦克风录音与语音识别 (P1)

**目标**: 实现麦克风录音和实时语音识别功能，识别结果自动发送。

**独立测试标准**:
- ✓ 点击麦克风按钮开始录音，再次点击停止
- ✓ 实时显示中间识别结果（灰色文字）
- ✓ 显示最终识别结果（黑色文字）
- ✓ 自动发送识别的文本消息到聊天列表
- ✓ 浏览器不支持时显示友好提示

| Task ID | Description | File | Dependencies |
|---------|-------------|------|--------------|
| T003 | [x] [US1] 实现 useVoiceRecorder Hook - 麦克风权限请求 | `src/hooks/useVoiceRecorder.ts` | T001 |
| T004 | [x] [US1] 实现 useVoiceRecorder Hook - MediaRecorder 配置 (PCM 16kHz) | `src/hooks/useVoiceRecorder.ts` | T003 |
| T005 | [x] [US1] 实现 useVoiceRecorder Hook - 录音状态管理 | `src/hooks/useVoiceRecorder.ts` | T004 |
| T006 | [x] [US1] 实现 VoiceWebSocket 类 - 连接管理 | `src/api/voice.ts` | T002 |
| T007 | [x] [US1] 实现 VoiceWebSocket 类 - 音频数据发送 | `src/api/voice.ts` | T006 |
| T008 | [x] [US1] 实现 VoiceWebSocket 类 - ASR 事件接收 | `src/api/voice.ts` | T007 |
| T009 | [x] [US1] 创建 VoiceRecorder 组件 - UI 和状态展示 | `src/components/VoiceRecorder/index.tsx` | T005, T008 |
| T010 | [x] [US1] 创建 VoiceRecorder 组件 - 录音状态视觉反馈 | `src/components/VoiceRecorder/index.tsx` | T009 |
| T011 | [x] [US1] 修改 ChatInput 组件 - 添加麦克风按钮 | `src/components/ChatInput/index.tsx` | T010 |
| T012 | [x] [US1] 实现浏览器兼容性检测和提示 | `src/components/VoiceRecorder/index.tsx` | T010 |

**并行机会**: T003-T005 与 T006-T008 可并行开发（不同文件）

**Checkpoint US1**: 可独立测试完整的录音和识别流程。

---

## Phase 3: User Story 2 - AI对话与回复播放 (P2)

**目标**: 实现 AI 文字回复和语音回复的接收与展示。

**前置依赖**: Phase 2 完成

**独立测试标准**:
- ✓ AI 文字回复显示在聊天界面
- ✓ AI 语音回复通过扬声器播放
- ✓ 文字回复流式显示
- ✓ 语音无缝播放（复用 StreamingAudioPlayer）
- ✓ AI 回复失败时显示错误提示

| Task ID | Description | File | Dependencies |
|---------|-------------|------|--------------|
| T013 | [x] [US2] 实现 VoiceWebSocket - Chat 事件接收 | `src/api/voice.ts` | T008 |
| T014 | [x] [US2] 实现 VoiceWebSocket - TTS 音频事件接收 | `src/api/voice.ts` | T013 |
| T015 | [x] [US2] 实现 VoiceWebSocket - TTSEnded 事件处理 | `src/api/voice.ts` | T014 |
| T016 | [x] [US2] 修改 Chat 页面 - 集成语音会话状态管理 | `src/pages/Chat.tsx` | T012 |
| T017 | [x] [US2] 修改 Chat 页面 - AI 文字回复流式展示 | `src/pages/Chat.tsx` | T016 |
| T018 | [x] [US2] 修改 Chat 页面 - AI 语音播放集成 | `src/pages/Chat.tsx` | T017 |
| T019 | [x] [US2] 实现错误处理和用户提示 | `src/pages/Chat.tsx` | T018 |

**Checkpoint US2**: 可独立测试完整的对话流程（录音→识别→AI回复→播放）。

---

## Phase 4: User Story 3 - 发音分析 (P3)

**目标**: 实现发音质量分析和结果展示。

**前置依赖**: Phase 3 完成

**独立测试标准**:
- ✓ 显示发音准确度评分（0-100分）
- ✓ 问题音素高亮显示
- ✓ 提供简单的改进建议
- ✓ 分析结果以卡片形式展示

| Task ID | Description | File | Dependencies |
|---------|-------------|------|--------------|
| T020 | [x] [US3] 实现 VoiceWebSocket - Pronunciation 事件接收 | `src/api/voice.ts` | T015 |
| T021 | [x] [US3] 创建 PronunciationAnalysis 组件 - 评分展示 | `src/components/PronunciationAnalysis/index.tsx` | T001 |
| T022 | [x] [US3] 创建 PronunciationAnalysis 组件 - 问题音素高亮 | `src/components/PronunciationAnalysis/index.tsx` | T021 |
| T023 | [x] [US3] 创建 PronunciationAnalysis 组件 - 改进建议展示 | `src/components/PronunciationAnalysis/index.tsx` | T022 |
| T024 | [x] [US3] 修改 Chat 页面 - 集成发音分析组件 | `src/pages/Chat.tsx` | T020, T023 |

**Checkpoint US3**: 可独立测试完整的语音学习流程（录音→识别→AI回复→发音分析）。

---

## Phase 5: Polish & Cross-Cutting Concerns

**目标**: 完善边缘情况和用户体验。

| Task ID | Description | File | Dependencies |
|---------|-------------|------|--------------|
| T025 | [x] 实现 WebSocket 自动重连机制 | `src/api/voice.ts` | T019 |
| T026 | [x] 实现麦克风权限拒绝提示和引导 | `src/components/VoiceRecorder/index.tsx` | T012 |
| T027 | [x] 实现录音时长限制 (60秒) | `src/hooks/useVoiceRecorder.ts` | T005 |
| T028 | [x] 添加录音状态样式优化 (动画/图标) | `src/components/VoiceRecorder/index.tsx` | T010 |

---

## Dependencies

### User Story 完成顺序

```
Phase 1 (Setup)
     ↓
Phase 2 (US1: 录音与识别) ← MVP 可交付
     ↓
Phase 3 (US2: AI回复与播放)
     ↓
Phase 4 (US3: 发音分析)
     ↓
Phase 5 (Polish)
```

### 任务依赖图

```
T001 ─┬─→ T003 → T004 → T005 ─┬─→ T009 → T010 → T011
      │                        │
      └─→ T002 → T006 → T007 → T008 ─┘
                                          ↓
                              T012 ─→ T016 → T017 → T018 → T019
                                          ↑
T013 → T014 → T015 ────────────────────────┘
                 ↓
                 T020 ─→ T024 ← T021 → T022 → T023
```

---

## Parallel Execution Examples

### Phase 2 并行示例

```
开发者 A: T003 → T004 → T005 → T009 → T010 → T011 → T012
开发者 B: T002 → T006 → T007 → T008
```

两个开发路径可以并行进行，最后在 T009 汇合。

### Phase 3 并行示例

```
开发者 A: T013 → T014 → T015 → T020
开发者 B: T016 → T017 → T018 → T019
```

API 层和 UI 层可以并行开发。

---

## Implementation Strategy

### MVP 范围 (Phase 1 + Phase 2)

建议首先完成 Phase 1 和 Phase 2，交付一个可用的 MVP：
- 用户可以点击麦克风录音
- 语音实时转换为文字
- 识别结果自动发送到聊天

### 增量交付

每个 User Story 完成后都是一个可独立测试和交付的增量：
1. **US1 完成后**: 验证语音识别准确性和用户体验
2. **US2 完成后**: 验证完整对话流程
3. **US3 完成后**: 验证发音分析功能

---

## Task Summary

| Phase | User Story | Task Count | Parallelizable |
|-------|------------|------------|----------------|
| Phase 1 | Setup | 2 | 2 tasks |
| Phase 2 | US1: 录音与识别 | 10 | 2 paths |
| Phase 3 | US2: AI回复与播放 | 7 | 2 paths |
| Phase 4 | US3: 发音分析 | 5 | 2 paths |
| Phase 5 | Polish | 4 | 4 tasks |
| **Total** | | **28** | |

---

## File Changes Summary

### 新增文件 (5)
- `src/types/voice.ts` - 语音类型定义
- `src/api/voice.ts` - WebSocket API 封装
- `src/hooks/useVoiceRecorder.ts` - 录音 Hook
- `src/components/VoiceRecorder/index.tsx` - 录音组件
- `src/components/PronunciationAnalysis/index.tsx` - 发音分析组件

### 修改文件 (2)
- `src/components/ChatInput/index.tsx` - 添加麦克风按钮
- `src/pages/Chat.tsx` - 集成语音功能

### 复用文件 (1)
- `src/utils/audioPlayer.ts` - 流式音频播放器
