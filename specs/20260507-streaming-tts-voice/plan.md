# Implementation Plan: Streaming TTS Voice

**Feature**: `streaming-tts-voice` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/20260507-streaming-tts-voice/spec.md`

## Summary

实现 LLM 流式输出文本时同步调用火山引擎 TTS API 进行语音合成，通过 HTTP Chunked 单向流式-V3 API 实现文本输入和音频输出，前端实现流式音频播放器支持"边说边播"的实时语音体验。

## Technical Context

**Language/Version**: TypeScript 5.9 (前端), TypeScript (后端 NestJS 11)
**Primary Dependencies**: 
- 前端: React 19.2, Vite 7, Semi UI, Tailwind CSS 4
- 后端: NestJS 11, TypeORM, PostgreSQL
- 外部: 火山引擎 TTS HTTP Chunked 单向流式-V3 API
**Storage**: PostgreSQL (后端已有)
**Testing**: Jest (后端), Vitest (前端 - 需确认)
**Target Platform**: Web (前端), Node.js Server (后端)
**Project Type**: Web (前后端分离)
**Performance Goals**: 首包音频延迟 < 500ms, 语音与文本同步延迟 < 1s
**Constraints**: HTTP API 调用成功率 > 99%, 支持连接复用
**Scale/Scope**: 单用户对话场景，流式音频播放

## Project Structure

### Documentation (this feature)

```
specs/20260507-streaming-tts-voice/
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
├── contracts/           # Phase 1 输出
│   └── tts-api.yaml     # TTS API 接口定义
└── tasks.md             # Phase 2 输出 (/adk:sdd:tasks)
```

### Source Code (repository root)

```
# 后端 (ai-language-learning-backend/src/)
src/
├── tts/                             # TTS 模块 (新增)
│   ├── tts.module.ts               # 模块定义
│   ├── tts.service.ts              # WebSocket 流式 TTS 服务
│   ├── tts.controller.ts           # TTS API 端点
│   ├── dto/
│   │   └── tts-stream.dto.ts       # 请求参数 DTO
│   └── interfaces/
│       └── volcengine-tts.interface.ts  # 火山引擎协议接口
├── chat/
│   └── chat.service.ts             # 修改: 集成 TTS 流式输出
└── app.module.ts                   # 修改: 引入 TTS 模块

# 前端 (ai-language-learning-frontend/src/)
src/
├── api/
│   └── tts.ts                      # 新增: TTS 流式 API 调用
├── utils/
│   └── audioPlayer.ts              # 新增: 流式音频播放器
├── hooks/
│   └── useStreamingTTS.ts          # 新增: TTS 流式播放 Hook
└── pages/Chat/hooks/
    └── useChat.ts                  # 修改: 集成 TTS 自动播放
```

**Structure Decision**: 采用 Web 应用结构（前后端分离）。后端使用 NestJS 模块化架构，新增独立的 TTS 模块；前端使用 React + Vite，新增 API 层、工具类和 Hook。
