---
last_compound_scan: 2026-05-06
compound_scan_mode: incremental
---

# AI Language Learning Frontend Coding Standards

## Core Conventions

### I. Naming Conventions

**变量和函数：** camelCase，描述性命名
- 好的示例：`getSegmenter`, `processTextNodes`, `handleSceneChange`
- 避免：缩写、无意义名称

**布尔值：** 使用 `is`、`has`、`should`、`can` 前缀
- 示例：`isAuthenticated`, `isLoading`, `hasError`

**组件和类型：** PascalCase
- 组件：`ChatDialogArea`, `TranslateModal`, `Navbar`
- 类型/接口：`Segmenter`, `ChatMessage`, `LanguageProfile`

**常量：** UPPER_SNAKE_CASE
- 示例：`AUTH_EXPIRY_TIME`, `DEFAULT_TIMEOUT`

**自定义 Hook：** camelCase 带 `use` 前缀
- 示例：`useAuthState`, `useSmartSelection`, `useSceneSelection`

### II. Error Handling

**HTTP 错误处理：** (`src/utils/request.ts:48-108`)
- 状态码映射到用户友好消息
- 401 自动重定向到登录
- 网络错误检测
- 响应数据提取

**流式错误处理：** (`src/api/chat.ts:67-131`)
- SSE 和 NDJSON 流错误检测
- 错误事件类型检查
- 优雅的错误消息提取
- 缓冲区状态管理

**错误处理原则：**
- 每一层显式处理错误
- 面向 UI 的代码提供用户友好的错误消息
- 永远不要静默吞掉错误

### III. Logging Standards

**当前状态：** 控制台日志

**日志级别：**
- 错误：`console.error` 用于 API 错误和异常
- 警告：`console.warn` 用于非关键问题
- 信息：`console.log` 用于开发调试

**最佳实践：**
- 日志应包含足够的上下文信息
- 避免在生产环境输出敏感数据

### IV. File Organization

**目录结构：**
```
src/
├── api/           # API 调用封装
├── components/    # React 组件
├── consts/        # 常量定义
├── features/      # 功能模块
├── hooks/         # 自定义 Hook
├── pages/         # 页面组件
├── routes/        # 路由配置
└── utils/         # 工具函数
```

**文件大小原则：**
- 单文件不超过 800 行
- 函数不超过 50 行
- 高内聚，低耦合

### V. Configuration Management

**环境变量：** (`.env:1-2`)
| 变量 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `VITE_API_BASE_URL` | `string` | `''` | 生产环境 API 基础地址 |

> 🔗 See [Config Templates](references/config-templates.md) for full configuration details.

## Fixed Rules

1. **遵循 ESLint 规则** - 使用 `eslint.config.js` 中定义的规则
2. **使用 TypeScript 类型** - 避免使用 `any`
3. **组件职责单一** - 每个组件只负责一件事
4. **不可变数据** - 不要修改 props 和 state

## Governance

- 优先使用仓库中已有的模式，再引入新的抽象
- 代码审查应检查正确性、风格和足够的验证
- 分支和提交实践应保持 `main` 可部署，变更易于审查

> 🔗 See [Design Patterns](arch/patterns.md) for common patterns used in the project.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
