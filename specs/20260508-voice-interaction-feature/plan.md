# Implementation Plan: 语音交互功能

**Feature**: `20260508-voice-interaction-feature` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/20260508-voice-interaction-feature/spec.md`

## Summary

实现语言学习应用的语音交互功能，支持用户通过麦克风录音进行对话练习。核心技术方案采用后端转发模式：前端通过 WebSocket 连接后端，后端转发到火山引擎 RealtimeAPI 实现语音识别(ASR)、AI对话和语音合成(TTS)的一体化流程。

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2
**Primary Dependencies**: Vite 7.0, Semi UI 2.96, TailwindCSS 4.2, react-router-dom 7.13
**Storage**: N/A (前端项目，状态通过 React State 管理)
**Testing**: Vitest (需添加), Playwright (E2E)
**Target Platform**: 现代浏览器 (Chrome, Firefox, Safari, Edge)
**Project Type**: Web Application (Frontend only, 后端为独立仓库)
**Performance Goals**: 录音启动 <2s, ASR准确率 >90%, AI首字延迟 <3s
**Constraints**: WebSocket 连接稳定性, 浏览器 MediaRecorder API 支持, PCM 音频格式兼容性
**Scale/Scope**: 单用户会话, 实时语音交互

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✓ **Immutability**: 使用 React State 不可变更新模式
✓ **Error Handling**: WebSocket 断线重连, API 错误处理, 浏览器兼容性检测
✓ **Input Validation**: 音频格式验证, 文本输入验证
✓ **KISS/DRY/YAGNI**: 复用现有 StreamingAudioPlayer, 避免过度设计

## Project Structure

### Documentation (this feature)

```
specs/20260508-voice-interaction-feature/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```
src/
├── api/
│   ├── chat.ts          # 现有聊天 API
│   ├── tts.ts           # 现有 TTS API
│   └── voice.ts         # [新增] WebSocket 语音 API 封装
├── components/
│   ├── ChatInput/       # 现有聊天输入组件
│   ├── VoiceRecorder/   # [新增] 语音录制组件
│   └── PronunciationAnalysis/  # [新增] 发音分析组件
├── hooks/
│   ├── useStreamingTTS.ts  # 现有 TTS Hook
│   └── useVoiceRecorder.ts # [新增] 麦克风录音 Hook
├── pages/
│   └── Chat.tsx         # [修改] 集成语音功能
├── types/
│   └── voice.ts         # [新增] 语音相关类型定义
└── utils/
    └── audioPlayer.ts   # 现有音频播放器 (复用)
```

**Structure Decision**: 单体前端项目，按功能模块组织。新增语音功能通过新增组件和 Hook 实现，复用现有的音频播放基础设施。

## Complexity Tracking

无违规项需要记录。
