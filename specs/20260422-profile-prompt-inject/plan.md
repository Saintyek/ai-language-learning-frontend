---
description: "Implementation plan for profile prompt injection feature"
---

# Implementation Plan: 语言学习档案提示词注入

**Feature**: `20260422-profile-prompt-inject` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/20260422-profile-prompt-inject/spec.md`

## Summary

将用户设置的语言学习档案数据作为系统提示词注入到 AI 对话中，且确保档案提示词具有最高优先级（超过场景提示词）。需要前后端协同开发：后端负责提示词注入逻辑，前端负责确保认证信息和语言信息正确传递。

## Technical Context

**Language/Version**: TypeScript 5.x (前端 React, 后端 NestJS)
**Primary Dependencies**: React 18+, NestJS, class-validator, @nestjs/swagger
**Storage**: PostgreSQL (已有 profile 表)
**Testing**: Jest
**Target Platform**: Web (前端) + Node.js Server (后端)
**Project Type**: web (前后端分离项目)
**Performance Goals**: 聊天响应延迟 < 500ms
**Constraints**: 档案提示词必须优先于场景提示词

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] 代码可读性：使用清晰的命名和注释
- [x] 错误处理：妥善处理档案不存在的情况
- [x] 不可变性：使用纯函数生成提示词

## Project Structure

### Documentation (this feature)

```
specs/20260422-profile-prompt-inject/
├── spec.md              # 功能规范文档
├── plan.md              # 本文件
└── tasks.md             # 任务清单
```

### Source Code (双项目结构)

**前端项目** (`/Users/bytedance/code/ai-language-learning-frontend`):
```
src/
├── api/
│   └── profile.ts       # 已有 - 档案 API
├── pages/
│   └── Profile/         # 已有 - 档案页面
└── components/
    └── Chat/            # 需要检查 - 确保传递语言信息
```

**后端项目** (`/Users/bytedance/code/ai-language-learning-backend`):
```
src/
├── chat/
│   ├── chat.service.ts        # 需修改 - 注入档案提示词
│   ├── dto/
│   │   └── chat-stream-request.dto.ts  # 需检查 - 确保有 userId
│   └── prompts/
│       ├── index.ts           # 需修改 - 导出档案提示词函数
│       └── profile-builder.ts # 新建 - 档案提示词构建器
└── profile/
    └── profile.service.ts     # 已有 - 档案查询服务
```

**Structure Decision**: 双项目结构，前端负责数据传递，后端负责提示词注入逻辑

## Complexity Tracking

无违规项
