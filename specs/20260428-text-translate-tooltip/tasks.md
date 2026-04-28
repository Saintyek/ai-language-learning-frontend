---
description: "Task list for chat page text translation tooltip feature"
---

# Tasks: 聊天页面选词翻译 Tooltip

**Input**: Design documents from `/specs/20260428-text-translate-tooltip/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: 任务按用户故事分组，支持独立实现和测试。支持并行开发（前端和后端分离）。

## Format: `[ID] [P?] [Story] [Repo] Description`
- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- **[Repo]**: 仓库标识（FE=前端, BE=后端）
- 包含精确文件路径

## Path Conventions
- **前端**: `/Users/bytedance/code/ai-language-learning-frontend/src/`
- **后端**: `/Users/bytedance/code/ai-language-learning-backend/src/`

---

## Phase 1: 后端 API 开发 (Backend)

**Purpose**: 创建翻译 API 端点和 LLM 调用逻辑

### 基础设施任务

- [x] T001 [P] [US1] [BE] 创建翻译模块目录结构 `src/translate/`
- [x] T002 [P] [US1] [BE] 创建 DTO 文件 `src/translate/dto/translate-request.dto.ts`
- [x] T003 [P] [US1] [BE] 创建响应 DTO `src/translate/dto/translate-response.dto.ts`

### 核心实现任务

- [x] T004 [US1] [BE] 实现 TranslateService `src/translate/translate.service.ts`
  - 调用 Ark LLM API
  - 设计 prompt 模板获取翻译、拼音、例句
- [x] T005 [US1] [BE] 实现 TranslateController `src/translate/translate.controller.ts`
  - POST /api/translate 端点
  - 请求验证
- [x] T006 [US1] [BE] 创建 TranslateModule `src/translate/translate.module.ts`
- [x] T007 [US1] [BE] 注册模块到 AppModule `src/app.module.ts`

**Checkpoint**: 后端 API 可独立测试，可通过 curl/Postman 验证

---

## Phase 2: 前端组件开发 (Frontend)

**Purpose**: 创建翻译 Tooltip 组件和选词监听逻辑

### API 层任务

- [x] T008 [P] [US1] [FE] 创建翻译 API `src/api/translate.ts`
  - 定义请求/响应类型
  - 实现 translateText 函数

### Hook 任务

- [x] T009 [US1] [FE] 创建文本选择 Hook `src/hooks/useTextSelection.ts`
  - 监听文本选择事件
  - 返回选中文本和位置信息

### 组件任务

- [x] T010 [P] [US1] [FE] 创建 TranslateCard 组件 `src/components/TranslateTooltip/TranslateCard.tsx`
  - 显示翻译结果、拼音、例句
  - 关闭按钮
- [x] T011 [US1] [FE] 创建 TranslateTooltip 组件 `src/components/TranslateTooltip/TranslateTooltip.tsx`
  - 包装 Semi UI Tooltip
  - 定位逻辑
  - 加载状态
- [x] T012 [US1] [FE] 创建组件导出 `src/components/TranslateTooltip/index.ts`

### 集成任务

- [x] T013 [US1] [FE] 修改 ChatDialogArea `src/pages/Chat/components/ChatDialogArea.tsx`
  - 集成 useTextSelection
  - 集成 TranslateTooltip
  - 处理选词事件

**Checkpoint**: 前端选词翻译功能可用，Tooltip 正确显示

---

## Phase 3: User Story 2 - 发音播放 (Priority: P2)

**Goal**: 点击播放按钮播放翻译发音

**Independent Test**: 点击播放按钮能听到语音输出

- [x] T014 [US2] [FE] 添加发音功能到 TranslateCard `src/components/TranslateTooltip/TranslateCard.tsx`
  - 使用 Web Speech API (speechSynthesis)
  - 播放/停止切换逻辑

**Checkpoint**: 发音功能可用

---

## Phase 4: User Story 3 - 复制功能 (Priority: P3)

**Goal**: 点击复制按钮复制翻译内容

**Independent Test**: 点击复制后粘贴能看到翻译内容

- [x] T015 [US3] [FE] 添加复制功能到 TranslateCard `src/components/TranslateTooltip/TranslateCard.tsx`
  - 使用 navigator.clipboard.writeText()
  - 显示复制成功提示

**Checkpoint**: 复制功能可用

---

## Phase 5: 边界情况处理

- [x] T016 [US1] [FE] 处理空文本选择
- [x] T017 [US1] [FE] 处理过长文本选择（>500字符）
- [x] T018 [US1] [FE] 处理 API 错误显示
- [x] T019 [US1] [FE] 处理快速连续选词（取消上一个请求）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Backend)**: 无依赖，可立即开始
- **Phase 2 (Frontend)**: 依赖 Phase 1 的 API 端点可用
- **Phase 3 (US2)**: 依赖 Phase 2 完成
- **Phase 4 (US3)**: 依赖 Phase 2 完成，可与 Phase 3 并行
- **Phase 5 (边界处理)**: 依赖 Phase 2 完成

### Parallel Opportunities

- T001, T002, T003 可并行（不同文件）
- T008, T010 可并行（不同文件）
- Phase 3 和 Phase 4 可并行

---

## Agent Team 执行策略

### 后端 Agent (ai-language-learning-backend)

负责 Phase 1 所有任务，完成后通知前端 Agent。

### 前端 Agent (ai-language-learning-frontend)

等待后端 Agent 完成 API 后，执行 Phase 2-5 任务。

---

## Notes

- [P] 任务可并行执行
- 每个 checkpoint 验证功能后再继续
- 提交粒度：每个任务完成后提交
- 遇到问题及时沟通协调
