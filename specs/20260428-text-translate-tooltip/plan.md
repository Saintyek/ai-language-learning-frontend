---
description: "Implementation plan for chat page text translation tooltip"
---

# Implementation Plan: 聊天页面选词翻译 Tooltip

**Feature**: `20260428-text-translate-tooltip` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/20260428-text-translate-tooltip/spec.md`

## Summary

实现在聊天页面选中文本后，调用大语言模型翻译为中文，以 Tooltip 形式展示翻译结果、拼音和例句。前端使用 React + Semi UI，后端使用 NestJS + Ark LLM API。

## Technical Context

**Language/Version**: TypeScript 5.x (前端 React, 后端 NestJS)
**Primary Dependencies**: 
- 前端: React, Semi UI (@douyinfe/semi-ui), Tailwind CSS
- 后端: NestJS, @nestjs/config, Ark LLM API (doubao)
**Storage**: PostgreSQL (已有，用于存储聊天会话)
**Testing**: Vitest (前端), Jest (后端)
**Target Platform**: Web 应用
**Project Type**: Web (前端 + 后端分离)
**Performance Goals**: Tooltip 显示延迟 < 2s
**Constraints**: 使用已有 LLM API 配置和认证体系

## Constitution Check

✅ 通过 - 功能符合项目架构，复用现有组件和 API 结构

## Project Structure

### Documentation (this feature)

```
specs/20260428-text-translate-tooltip/
├── spec.md              # 功能规范
├── plan.md              # 本文件 - 实现计划
└── tasks.md             # 任务分解
```

### Source Code (repository root)

**前端** (ai-language-learning-frontend):
```
src/
├── api/
│   └── translate.ts              # 新增 - 翻译 API 调用
├── components/
│   └── TranslateTooltip/
│       ├── TranslateTooltip.tsx  # 新增 - 翻译 Tooltip 组件
│       ├── TranslateCard.tsx     # 新增 - 翻译卡片内容
│       └── index.ts              # 新增 - 导出
├── pages/
│   └── Chat/
│       └── components/
│           └── ChatDialogArea.tsx # 修改 - 添加选词监听
└── hooks/
    └── useTextSelection.ts        # 新增 - 文本选择 Hook
```

**后端** (ai-language-learning-backend):
```
src/
├── translate/
│   ├── translate.module.ts       # 新增 - 翻译模块
│   ├── translate.controller.ts   # 新增 - 翻译控制器
│   ├── translate.service.ts      # 新增 - 翻译服务
│   └── dto/
│       ├── translate-request.dto.ts  # 新增 - 请求 DTO
│       └── translate-response.dto.ts # 新增 - 响应 DTO
└── app.module.ts                 # 修改 - 注册翻译模块
```

**Structure Decision**: 采用前后端分离架构，前端 React 应用和后端 NestJS 应用独立开发部署。翻译功能作为独立模块添加到现有架构中。

## Complexity Tracking

无违规，无需记录。

## Implementation Phases

### Phase 1: 后端 API 开发

1. 创建 translate 模块结构
2. 实现 TranslateService 调用 Ark LLM API
3. 设计 prompt 模板获取翻译、拼音、例句
4. 实现 TranslateController 暴露 REST API
5. 注册模块到 AppModule

### Phase 2: 前端组件开发

1. 创建 useTextSelection Hook 监听文本选择
2. 实现 TranslateCard 组件显示翻译结果
3. 实现 TranslateTooltip 组件包装 Tooltip 逻辑
4. 在 ChatDialogArea 中集成选词翻译功能
5. 添加发音和复制功能

### Phase 3: 集成测试

1. 端到端测试选词翻译流程
2. 测试边界情况处理
3. 优化性能和用户体验
