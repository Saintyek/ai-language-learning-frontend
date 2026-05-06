---
last_compound_scan: 2026-05-06
compound_scan_mode: incremental
---

# AI Language Learning Frontend Reliability

## Core Practices

### I. Fault Tolerance Patterns

**超时配置**
- HTTP 请求：15 秒超时 (`src/utils/request.ts:9`)
- 流式连接：使用 fetch API 默认超时

**错误恢复**
- HTTP 401：自动清除认证数据并重定向到登录页 (`src/utils/request.ts:63-74`)
- 流式错误：优雅终止并提取错误消息 (`src/api/chat.ts:103-108`)
- 网络故障：用户友好的错误消息 (`src/utils/request.ts:100-103`)

### II. Degradation Strategy

**认证降级链：**
1. 主要方式：基于 Token 的认证 (`localStorage.getItem('token')`)
2. 降级方式：使用 userId 作为标识 (`localStorage.getItem('userId')`)
3. 位置：`src/api/auth.ts:97-99`

**会话管理：**
- 认证过期：24 小时 (`src/api/auth.ts:86`)
- 过期自动清理 (`src/api/auth.ts:104-120`)
- 跨标签页同步通过 `storage` 事件 (`src/components/Navbar/hooks/useAuthState.ts:30`)

### III. Monitoring Patterns

**错误日志：**
- HTTP 错误：控制台错误日志包含响应详情 (`src/utils/request.ts:105`)
- 流式错误：错误消息提取和传播 (`src/api/chat.ts:62-65`)

**状态追踪：**
- 生成状态带中止能力 (`src/pages/Chat/hooks/useChat.ts:173-178`)
- 组件挂载状态用于安全更新 (`src/pages/Chat/hooks/useSceneSelection.ts:88`)

### IV. Graceful Startup/Shutdown

**启动：**
- 挂载时验证认证状态 (`src/components/Navbar/hooks/useAuthState.ts:19-28`)
- 访问认证数据前检查过期 (`src/api/auth.ts:124-127`)

**关闭：**
- 在 useEffect 返回中清理观察者和监听器
- 待处理请求使用 AbortController (`src/pages/Chat/hooks/useChat.ts:174`)

## Fixed Rules

1. **所有 HTTP 请求必须配置超时**（当前：15秒）
2. **401 响应必须清除认证数据并重定向**
3. **流式操作必须处理 SSE 和 NDJSON 两种格式**
4. **认证数据必须有过期时间和自动清理**

## Governance

- 错误消息必须用户友好，避免技术细节
- 网络错误必须区分"无响应"和"错误响应"
- 所有 useEffect 返回函数必须执行清理

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
