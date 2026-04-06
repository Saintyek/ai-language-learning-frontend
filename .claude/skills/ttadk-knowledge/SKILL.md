---
name: ttadk-knowledge
description: TTADK knowledge base for current command system. Covers common commands, SDD/SDT workflows, TTADK CLI operations, cloud tasks, plugin development, and troubleshooting.
user-invocable: false
---

# TTADK 知识库

## TTADK 是什么

TTADK（TikTok AI-Driven Development Kit）是由 TikTok Eng Local Services 团队开发的企业级 AI 辅助开发工具包，基于 GitHub 开源项目 [Spec Kit](https://github.com/github/spec-kit) 深度定制。核心能力：

1. **AI 工具初始化与插件管理** — 为多种 AI 编程工具（Claude Code、Cursor、Codex、Coco、Gemini、Trae、OpenCode、TMates）提供统一的项目初始化和配置管理，通过插件系统提供定制化能力
2. **Spec-Driven 工作流** — 提供 `SDD`（Spec Driven Development）和 `SDT`（Spec Driven Testing）两套结构化流程，由 Commands、Skills、Memory、MCP 服务共同驱动
3. **模型代理** — 内置 SSO 认证、多域 LLMBox 模型发现和透明 API 路由，通过 `ttadk code` 统一启动
4. **数据上报** — 自动附加元数据 Headers（X-Source、X-Project-Root、X-Repo-Info）用于使用追踪

## SDD 是什么

SDD（Spec Driven Development，规范驱动开发）的核心理念是 **"先写规范，再写代码"**。相较于 Vibe Coding（直接让 AI 写代码），SDD 在实现之前先创建结构化的规范文档，使 AI 生成的代码更可靠、可追溯、可维护。

核心优势：
- **结构化**：从模糊想法到可执行代码的清晰路径
- **可追溯**：需求 → 设计 → 任务 → 代码的完整链路
- **质量保障**：多层验证确保符合企业标准
- **知识注入**：通过 Skills 自动注入技术栈最佳实践

## 当前命令体系

TTADK 当前主要分为三类命令：**基础公共命令**、**SDD**、**SDT**。其中 `/adk:cloud` 负责云端异步任务管理。

### 基础公共命令

| 命令 | 说明 |
|------|------|
| `/adk:help` | TTADK 帮助手册，可用来回答 TTADK 介绍、命令用法、报错咨询、SDD 下一步指引等问题 |
| `/adk:readiness` | 多维度检查当前代码仓库是否足够 AI Friendly，并给出成熟度报告和改进建议 |
| `/adk:commit` | 提交当前工作区改动，自动生成规范化 commit message 并附加 TTADK 追踪签名 |
| `/adk:cloud` | 以自然语言方式创建、查看、继续、停止、同步 TTADK Cloud 异步任务 |

### SDD 工作流命令

| 命令 | 产出物 | 说明 |
|------|--------|------|
| `/adk:sdd:brainstorm` | 思路文档 / Lark 文档 | 头脑风暴入口，支持 ERD、学习资料、简单想法等输入，帮助梳理技术方案 |
| `/adk:sdd:ff` | `spec.md`、`plan.md`、`tasks.md` | Fast Forward 模式，一步生成核心制品，适合快速推进 |
| `/adk:sdd:constitution` | `.ttadk/memory/constitution.md` | 定义项目原则、编码标准、质量门禁 |
| `/adk:sdd:specify` | `spec.md` | 生成功能规格、用户故事、成功标准 |
| `/adk:sdd:clarify` | 更新已有制品 | 交互式澄清需求并同步已有下游制品 |
| `/adk:sdd:plan` | `plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md` | 制定实现计划与技术设计骨架 |
| `/adk:sdd:erd` | `technical-design.md` | 生成技术设计文档，包含图表和关键设计说明 |
| `/adk:sdd:tasks` | `tasks.md` | 生成依赖有序的原子化任务列表 |
| `/adk:sdd:analyze` | 分析报告 | 对 `spec.md`、`plan.md`、`tasks.md` 做只读一致性和质量检查 |
| `/adk:sdd:implement` | 代码变更 | 按任务顺序落地实现代码 |
| `/adk:sdd:archive` | 归档索引 / tar.gz | 归档历史功能制品 |

### SDT 工作流命令

| 命令 | 说明 |
|------|------|
| `/adk:sdt:ff` | 根据现有 Spec 等输入快速生成测试用例、测试计划等测试制品 |
| `/adk:sdt:clarify` | 对 SDT 产物进行澄清、补充和修正 |
| `/adk:sdt:implement` | 执行测试用例、跑集成测试，并产出测试报告 |

## 推荐工作流

### 标准 SDD 模式

```
readiness → [sdd:brainstorm] → sdd:constitution → sdd:specify → [sdd:clarify] → sdd:plan → [sdd:erd] → sdd:tasks → [sdd:analyze] → sdd:implement → commit → sdd:archive
```

标准模式的核心路径是：

```
Specify → Plan → Tasks → Implement
```

### 快速 SDD 模式

```
readiness → [sdd:brainstorm] → sdd:ff → sdd:implement → commit → sdd:archive
```

快速模式的核心路径是：

```
FF → Implement
```

### SDT 模式

```
sdt:ff → [sdt:clarify] → sdt:implement
```

## 旧资料兼容说明

如果看到以下旧叫法，需要映射到当前命令体系理解：

- 旧的 `adkl` 轻量流程已下线，`/adkl:proposal` 的定位迁移为 `/adk:sdd:ff`
- 当前正式命令是 `/adk:sdd:brainstorm`
- 旧的平铺命令（如 `/adk:specify`、`/adk:plan`、`/adk:tasks`、`/adk:implement`）应优先理解为对应的 `/adk:sdd:*` 命令
- 任务拆解命令的当前正式写法是 `/adk:sdd:tasks`

## 命令速查表

| 场景 | 推荐命令 |
|------|---------|
| 不知道 TTADK 是什么或下一步该做什么 | `/adk:help` |
| 想先判断仓库是否适合 AI 开发 | `/adk:readiness` |
| 只有模糊想法、ERD 或学习资料 | `/adk:sdd:brainstorm` |
| 开始新功能（完整流程） | `/adk:sdd:specify` |
| 开始新功能（快速流程） | `/adk:sdd:ff` |
| 规格或测试制品不清晰 | `/adk:sdd:clarify` 或 `/adk:sdt:clarify` |
| 准备制定实现计划 | `/adk:sdd:plan` |
| 需要技术设计文档 | `/adk:sdd:erd` |
| 准备拆解开发任务 | `/adk:sdd:tasks` |
| 想检查 spec/plan/tasks 质量 | `/adk:sdd:analyze` |
| 准备写代码 | `/adk:sdd:implement` |
| 准备生成测试计划或测试用例 | `/adk:sdt:ff` |
| 准备执行测试并产出测试报告 | `/adk:sdt:implement` |
| 想查看或发起云端异步任务 | `/adk:cloud` |
| 代码准备提交 | `/adk:commit` |
| 功能完成，归档 | `/adk:sdd:archive` |
| 设置项目原则 | `/adk:sdd:constitution` |

## TTADK CLI 速查

| 命令 | 说明 |
|------|------|
| `ttadk init [name]` | 初始化项目（选择 AI 工具、语言、Preset） |
| `ttadk init -H` | 在当前目录初始化 |
| `ttadk code` | 启动 AI 工具（含 SSO 认证和模型代理） |
| `ttadk code -t <tool>` | 启动指定 AI 工具 |
| `ttadk plugin install <name>` | 安装插件 |
| `ttadk plugin update --all` | 更新所有插件 |
| `ttadk plugin list` | 列出已安装插件 |
| `ttadk sync` | 同步配置变更到项目 |
| `ttadk config` | 配置 MCP 参数 |
| `ttadk cloud` | 云端异步任务 CLI，`/adk:cloud` 会基于自然语言封装它 |
| `ttadk upgrade` | 升级 TTADK 到最新版本 |
| `ttadk skills read <name>` | 读取 Skill 内容 |

## 核心概念

- **Feature Directory**：`specs/YYYYMMDD-feature-name/` — 所有 SDD 制品存放于此
- **Constitution**：`.ttadk/memory/constitution.md` — 所有命令都会遵循的项目级原则
- **Config**：`.ttadk/config.json` — 项目配置（`ai_tool`、`preferred_language`、`preset`、`plugins`）
- **Plugin System**：Commands、Skills、MCPs、Agents 以插件形式组织在 `.ttadk/plugins/` 下
- **Preset**：预配置的插件集合，适配不同技术栈（如 `ttadk/frontend`、`ttadk/backend`、`ttadk/common`）
- **Model Proxy**：`ttadk code` 提供 SSO 认证、模型发现和到 LLMBox 的 API 路由

## 支持的 AI 工具

| Tool ID | 显示名称 | Commands 目录 | MCP 配置 | Memory 文件 |
|---------|---------|--------------|---------|------------|
| `claude` | Claude Code | `.claude/commands/` | `.mcp.json` | `CLAUDE.md` |
| `cursor` | Cursor IDE | `.cursor/commands/` | `.cursor/mcp.json` | `AGENTS.md` |
| `codex` | Codex | `~/.codex/prompts/` | `~/.codex/config.toml` | `AGENTS.md` |
| `coco` | Trae CLI (Coco) | `.coco/commands/` | `.coco/coco.yaml` | `AGENTS.md` |
| `gemini` | Gemini CLI | `.gemini/commands/` | `.gemini/settings.json` | `.gemini/GEMINI.md` |
| `trae` | Trae IDE | `.trae/commands/` | `.trae/mcp.json` | `AGENTS.md` |
| `opencode` | OpenCode | `.opencode/commands/` | `opencode.jsonc` | `AGENTS.md` |
| `tmates` | TMates | `.tmates/commands/` | `.tmates/.mcp.json` | `AGENTS.md` |

## 详细参考文件

| 文件 | 内容 | 何时阅读 |
|------|------|---------|
| [sdd-workflow.md](./sdd-workflow.md) | 当前 SDD / SDT 流程、阶段说明、最佳实践、云端协作建议 | 用户询问 SDD/SDT 概念、工作流阶段或开发最佳实践 |
| [commands-reference.md](./commands-reference.md) | 基础命令、SDD/SDT 命令、Cloud 命令、CLI 详解与示例 | 用户询问具体命令用法、CLI 操作或插件开发 |
| [troubleshooting.md](./troubleshooting.md) | 常见问题、报错处理、readiness/cloud 使用、环境配置、AI 贡献率追踪 | 用户遇到问题、报错或询问“为什么”“怎么解决” |
