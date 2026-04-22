---
description: "Task list for profile prompt injection feature"
---

# Tasks: 语言学习档案提示词注入

**Input**: Design documents from `/specs/20260422-profile-prompt-inject/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 包含精确文件路径

## Path Conventions
- **前端项目**: `/Users/bytedance/code/ai-language-learning-frontend/src/`
- **后端项目**: `/Users/bytedance/code/ai-language-learning-backend/src/`

---

## Phase 1: 后端核心实现 (User Story 1 - P1) 🎯 MVP

**Goal**: 实现档案提示词注入的核心逻辑，确保最高优先级

**Independent Test**: 单元测试验证提示词生成和注入顺序

### 后端任务

- [x] T001 [P] [US1] 创建档案提示词构建器 `ai-language-learning-backend/src/chat/prompts/profile-builder.ts`
- [x] T002 [P] [US1] 创建档案提示词模板配置 `ai-language-learning-backend/src/chat/prompts/profile-template.ts`
- [x] T003 [US1] 修改 `ai-language-learning-backend/src/chat/prompts/index.ts` 导出档案提示词函数
- [x] T004 [US1] 修改 `ai-language-learning-backend/src/chat/chat.service.ts` 注入档案提示词逻辑
- [x] T005 [US1] 修改 `ai-language-learning-backend/src/chat/chat.module.ts` 导入 ProfileModule
- [x] T006 [US1] 验证档案提示词优先级高于场景提示词

**Checkpoint**: 后端档案提示词注入功能完成，可独立测试

---

## Phase 2: 前端适配 (User Story 2 - P2)

**Goal**: 确保前端正确传递认证信息和语言代码

**Independent Test**: 通过 Network 面板验证请求参数

### 前端任务

- [x] T007 [US2] 检查前端聊天组件是否正确传递语言信息
- [x] T008 [US2] 如需要，修改前端聊天 API 调用确保传递认证 token
- [ ] T009 [US2] 可选：添加档案存在性检查，引导用户设置档案

**Checkpoint**: 前端正确传递所有必要信息

---

## Phase 3: 提示词优化 (User Story 3 - P3)

**Goal**: 优化提示词模板，提供更好的个性化体验

**Independent Test**: 手动验证不同档案生成的提示词效果

### 优化任务

- [ ] T010 [P] [US3] 优化初学者级别提示词模板
- [ ] T011 [P] [US3] 优化中级学习者提示词模板
- [ ] T012 [P] [US3] 优化高级学习者提示词模板
- [ ] T013 [US3] 添加更多学习动机相关的提示词内容

**Checkpoint**: 所有级别的提示词模板优化完成

---

## Phase 4: 集成测试

**Goal**: 验证整体功能正确运行

- [ ] T014 端到端测试：有档案用户发起对话
- [ ] T015 端到端测试：无档案用户发起对话
- [ ] T016 端到端测试：档案+场景同时存在时的提示词顺序

**Note**: T014-T016 为集成测试任务，可在功能部署后进行手动验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (后端核心)**: 无依赖，可立即开始
- **Phase 2 (前端适配)**: 依赖 Phase 1 完成
- **Phase 3 (提示词优化)**: 依赖 Phase 1 完成，可与 Phase 2 并行
- **Phase 4 (集成测试)**: 依赖 Phase 1-3 完成

### Parallel Opportunities

- T001 和 T002 可并行执行
- T010, T011, T012 可并行执行
- Phase 2 和 Phase 3 可并行执行（不同项目）

---

## Notes

- 后端修改需确保 ProfileModule 正确导入到 ChatModule
- 注意处理档案不存在的情况，不应影响正常对话
- 提示词模板需考虑国际化（中英文）
